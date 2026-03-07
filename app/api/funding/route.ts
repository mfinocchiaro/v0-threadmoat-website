import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'

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

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const csvPath = path.join(process.cwd(), 'public', 'data', 'Startups-Funding.csv')
    let csvContent = await fs.readFile(csvPath, 'utf-8')

    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1)
    }

    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    const rawData = parsed.data as Record<string, string>[]

    const funding = rawData
      .filter(row => (row['Company'] || '').trim())
      .map((row, index) => ({
        id: String(index + 1),
        company: (row['Company'] || '').trim(),
        scoreFinancial: parseNum(row['Score Financial']),
        customerSignalScore: parseNum(row['Customer Signal Score']),
        estRevenueLabel: row['Est. Revenue by ARR or HC'] || '',
        weightedStartupQualityScore: parseNum(row['Weighted Startup Quality Score']),
        arrMultiple: parseNum(row['ARR Multiple']),
        estimatedValuation: parseCurrency(row['Estimated Valuation']),
        fundingFloor: parseCurrency(row['Funding Floor']),
        estimatedValueFinal: parseCurrency(row['Estimated Value Final']),
        arrPerEmployee: parseCurrency(row['ARR per Employee']),
        annualBurnProxy: parseCurrency(row['Annual Burn Proxy']),
        runwayProxyMonths: parseNum(row['Runway Proxy (Months)']),
        startupSizeCategory: row['Startup Size Category'] || '',
        capitalEfficiency: row['Capital Efficiency'] || '',
        runwayQuality: row['Runway Quality'] || '',
        netBurnLevel: row['Net Burn Level'] || '',
        financialConfidence: row['Financial Confidence'] || '',
      }))

    return NextResponse.json({ success: true, count: funding.length, data: funding })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load funding data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
