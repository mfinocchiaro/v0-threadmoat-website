import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'

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
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

/**
 * Classify cloud delivery model from Operating Model Tags.
 * Priority: Cloud-Native > SaaS > Hybrid > Traditional
 */
function classifyCloudModel(tags: string): string {
  if (!tags.trim()) return 'Unknown'
  const set = new Set(tags.split(',').map(t => t.trim().toLowerCase()))
  if (set.has('cloud-native') || set.has('cloud saas') || set.has('cloud native')) return 'Cloud-Native'
  if (set.has('usage-based') || set.has('consumption-based')) return 'Cloud-Native'
  if (set.has('hybrid') || (set.has('on-premise') && (set.has('saas') || set.has('cloud')))) return 'Hybrid'
  if (set.has('saas') || set.has('b2b saas') || set.has('enterprise saas') || set.has('vertical saas') || set.has('subscription')) return 'SaaS'
  if (set.has('cloud') || set.has('api-first') || set.has('api first') || set.has('platform')) return 'SaaS'
  if (set.has('on-premise') || set.has('on premise') || set.has('perpetual license') || set.has('perpetual')) return 'Traditional'
  return 'Unknown'
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Load both CSVs in parallel
    const [financialContent, gridContent] = await Promise.all([
      fs.readFile(path.join(process.cwd(), 'public', 'data', 'Startups-Financial Health.csv'), 'utf-8'),
      fs.readFile(path.join(process.cwd(), 'public', 'data', 'Startups-Grid view.csv'), 'utf-8'),
    ])

    const stripBOM = (s: string) => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s

    const financialRows = (Papa.parse(stripBOM(financialContent), { header: true, skipEmptyLines: true }).data as Record<string, string>[])
    const gridRows = (Papa.parse(stripBOM(gridContent), { header: true, skipEmptyLines: true }).data as Record<string, string>[])

    // Build a lookup: company name → operating model tags
    const tagsByCompany = new Map<string, string>()
    for (const row of gridRows) {
      const name = (row['Company'] || '').trim()
      if (name) tagsByCompany.set(normalizeCompanyName(name), row['Operating Model Tags'] || '')
    }

    const funding = financialRows
      .filter(row => (row['Company'] || '').trim())
      .map((row, index) => {
        const company = (row['Company'] || '').trim()
        const tags = tagsByCompany.get(normalizeCompanyName(company)) ?? ''
        const cloudModel = classifyCloudModel(tags)

        const arrPerEmployee = parseCurrency(row['ARR per Employee'])
        const totalFunding = parseCurrency(row['Total Current Known Funding Level'])
        const estimatedRevenue = parseCurrency(row['Current Estimated Annual Revenue'])

        // Cloud ARR efficiency: how many cents of ARR earned per dollar raised.
        // 100 = broke even on capital (ARR = total funding). Higher = more capital-efficient.
        const cloudArrEfficiency = totalFunding > 0 ? (estimatedRevenue / totalFunding) * 100 : 0

        // ARR/employee as % of $200K SaaS benchmark. 100 = at benchmark, 150 = 50% above, etc.
        const cloudArrVsBenchmark = arrPerEmployee > 0 ? (arrPerEmployee / CLOUD_ARR_BENCHMARK) * 100 : 0

        return {
          id: String(index + 1),
          company,
          cloudModel,
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
          annualBurnProxy: parseCurrency(row['Annual Burn Proxy']),
          runwayProxyMonths: parseNum(row['Runway Proxy (Months)']),
          startupSizeCategory: row['Startup Size Category'] || '',
          capitalEfficiency: row['Capital Efficiency'] || '',
          runwayQuality: row['Runway Quality'] || '',
          netBurnLevel: row['Net Burn Level'] || '',
          financialConfidence: row['Financial Confidence'] || '',
        }
      })

    return NextResponse.json({ success: true, count: funding.length, data: funding })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load funding data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
