import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'
import { rateLimit } from '@/lib/rate-limit'

// Cloud SaaS benchmark: $200K ARR/employee is the industry "good" threshold (Bessemer/BVP standard)
const CLOUD_ARR_BENCHMARK = 200_000

function normalizeCompanyName(name: string): string {
  return name.trim().replace(/[\u00A0\u2013\u2014]/g, ' ').replace(/\s+/g, ' ').toLowerCase()
}

function parseCurrency(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[$,\s]/g, '')
  const match = cleaned.match(/^([0-9.]+)\s*([BMKbmk])?$/)
  if (!match) return 0
  const num = parseFloat(match[1])
  if (isNaN(num)) return 0
  const suffix = (match[2] || '').toUpperCase()
  if (suffix === 'B') return num * 1_000_000_000
  if (suffix === 'M') return num * 1_000_000
  if (suffix === 'K') return num * 1_000
  return num
}

function parseNum(value: string | undefined): number {
  if (!value) return 0
  const num = parseFloat(value.replace(/[$,]/g, ''))
  return isNaN(num) ? 0 : num
}

/**
 * Classify cloud delivery model from Deployment Model column.
 * Maps new Airtable deployment values to heatmap cloud model categories.
 *
 * Airtable exports multi-select fields as Python list syntax:
 *   "['Cloud', 'Desktop']"  or  "Cloud, Desktop"
 * We strip brackets/quotes before splitting on commas.
 */
function classifyCloudModel(deploymentModel: string): string {
  if (!deploymentModel.trim()) return 'No Data'
  // Strip Python list artifacts: [ ] ' "
  const cleaned = deploymentModel.replace(/[\[\]'"]/g, '')
  if (!cleaned.trim()) return 'No Data'
  const set = new Set(cleaned.split(',').map(t => t.trim().toLowerCase()))
  const hasCloud = set.has('cloud') || set.has('web')
  const hasOnPrem = set.has('on-prem') || set.has('desktop') || set.has('embedded')
  const hasHardware = set.has('hardware')
  const hasEdge = set.has('edge')
  if (hasCloud && (hasOnPrem || hasEdge)) return 'Hybrid'
  if (hasCloud) return 'SaaS'
  if (hasEdge) return 'Edge/HW'
  if (hasHardware) return 'Edge/HW'
  if (hasOnPrem) return 'Traditional'
  if (set.has('api-only')) return 'SaaS'
  if (set.has('plugin')) return 'Traditional'
  if (set.has('hybrid')) return 'Hybrid'
  if (set.has('mobile')) return 'SaaS'
  return 'No Data'
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit(`api:funding:${session.user.id}`, 30, 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    // Load both CSVs in parallel
    const [financialContent, gridContent] = await Promise.all([
      fs.readFile(path.join(process.cwd(), 'data', 'Startups-Financial Health.csv'), 'utf-8'),
      fs.readFile(path.join(process.cwd(), 'data', 'Startups-Grid Full DB View.csv'), 'utf-8'),
    ])

    const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s

    const financialRows = (Papa.parse(stripBOM(financialContent), { header: true, skipEmptyLines: true }).data as Record<string, string>[])
    const gridRows = (Papa.parse(stripBOM(gridContent), { header: true, skipEmptyLines: true }).data as Record<string, string>[])

    // Build lookups from grid view: company name → deployment model, investment list
    const tagsByCompany = new Map<string, string>()
    const investmentListByCompany = new Map<string, string>()
    for (const row of gridRows) {
      const name = (row['Company'] || '').trim()
      if (name) {
        const key = normalizeCompanyName(name)
        tagsByCompany.set(key, row['Deployment Model'] || '')
        investmentListByCompany.set(key, row['Investment List'] || '')
      }
    }

    const funding = financialRows
      .filter(row => (row['Company'] || '').trim())
      .map((row, index) => {
        const company = (row['Company'] || '').trim()
        const normalizedName = normalizeCompanyName(company)
        const tags = tagsByCompany.get(normalizedName) ?? ''
        const cloudModel = classifyCloudModel(tags)
        const investmentList = investmentListByCompany.get(normalizedName) ?? ''

        const totalFunding = parseCurrency(row['Total Current Known Funding Level'])
        const estimatedRevenue = parseCurrency(row['Current Estimated Annual Revenue'])

        // ── Read directly from CSV (previously computed) ──
        const estimatedHeadcount = parseNum(row['Estimated Headcount'])
        const arrPerEmployee = parseNum(row['ARR per Employee'])
        const annualBurnProxy = parseNum(row['Annual Burn Proxy'])
        const runwayProxyMonths = Math.min(parseNum(row['Runway Proxy (Months)']), 999)

        // ── Derived metrics (simple ratios from CSV data) ──
        const cloudArrEfficiency = totalFunding > 0 ? (estimatedRevenue / totalFunding) * 100 : 0
        const cloudArrVsBenchmark = arrPerEmployee > 0 ? (arrPerEmployee / CLOUD_ARR_BENCHMARK) * 100 : 0

        // ── Cloud multiplier from Airtable ──
        const cloudSaasMultiplier = parseNum(row['Core Cloud / SaaS Multiplier'])
        const enhancedBurnPerEmployee = parseNum(row['Estimated HC+Cloud/AI Burn Rate'])

        return {
          id: String(index + 1),
          company,
          investmentList,
          cloudModel,
          totalFunding,
          estimatedRevenue,
          estimatedHeadcount,
          estimatedMarketValue: parseCurrency(row['Best Available Valuation']),
          cloudSaasMultiplier,
          cloudArrEfficiency: Math.round(cloudArrEfficiency * 10) / 10,
          cloudArrVsBenchmark: Math.round(cloudArrVsBenchmark * 10) / 10,
          scoreFinancial: parseNum(row['Score Financial']),
          customerSignalScore: parseNum(row['Customer Signal Score']),
          estRevenueLabel: row['Est. Revenue by ARR or HC'] || '',
          weightedStartupQualityScore: parseNum(row['Weighted Startup Quality Score']),
          arrMultiple: parseNum(row['ARR Multiple']),
          estimatedValuation: parseCurrency(row['Estimated Valuation']),
          fundingFloor: parseCurrency(row['Funding Floor']),
          estimatedValueFinal: parseCurrency(row['Estimated Value Final']),
          arrPerEmployee,
          annualBurnProxy,
          enhancedBurnPerEmployee,
          runwayProxyMonths,
          startupSizeCategory: row['Startup Size Category'] || '',
          capitalEfficiency: (row['Capital Efficiency'] || '').replace(/^Unknown$/i, ''),
          runwayQuality: (row['Runway Quality'] || '').replace(/^Unknown$/i, ''),
          netBurnLevel: (row['Net Burn Level Based on HC'] || '').replace(/^Unknown$/i, ''),
          financialConfidence: row['Financial Confidence'] || '',
          aiIntensity: row['AI Intensity'] || '',
          aiIntensityScore: parseNum(row['AI Intensity Score']),
          enhancedBurnRate: row['Enhanced HR+Cloud+AI Burn Rate'] || '',
          valuationConfidence: row['Valuation Value Confidence'] || '',
          reportedValuation: row['Reported Valuation'] || '',
        }
      })

    return NextResponse.json({ success: true, count: funding.length, data: funding })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load funding data' },
      { status: 500 }
    )
  }
}
