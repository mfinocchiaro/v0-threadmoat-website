import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'

function parseCurrency(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
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
    const csvPath = path.join(process.cwd(), 'public', 'data', 'Startups-Grid view.csv')

    let csvContent: string
    try {
      csvContent = await fs.readFile(csvPath, 'utf-8')
    } catch (fileError) {
      return NextResponse.json(
        { success: false, error: 'CSV file not found', details: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Strip BOM if present
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1)
    }

    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    const rawData = parsed.data as Record<string, string>[]

    const validData = rawData.filter(row => {
      const name = (row['Company'] || '').trim()
      if (!name) return false
      if (/^Tech\s*(XXX|YYY|ZZZ|\d+)/i.test(name)) return false
      if (/^Test\s*Company/i.test(name)) return false
      // Exclude non-startup entries (e.g. VCs)
      if ((row['Investment List'] || '').trim() === 'VC') return false
      return true
    })

    const companies = validData.map((row, i) => ({
      id: String(i + 1),
      name: row['Company'] || '',
      url: row['Company URL'] || '',
      hqLocation: row['HQ Location'] || '',
      country: row['Country'] || '',
      founded: parseInt(row['Founded']) || 0,
      headcount: parseInt(row['Estimated Headcount']) || 0,
      knownCustomers: row['Known Customers'] || '',
      strengths: row['Strengths'] || '',
      weaknesses: row['Weaknesses'] || '',
      discipline: row['Discipline'] || '',
      lifecyclePhase: row['Lifecycle Phase'] || '',
      workflowSegment: row['Workflow Segment'] || '',
      subsegment: row['Subsegment'] || '',
      sectorFocus: row['Sector Focus'] || '',
      tags: Array.from(new Set([
        ...(row['Tags'] || '').split(','),
        ...(row['Category/Function Tags'] || '').split(','),
        ...(row['Operating Model Tags'] || '').split(','),
        ...(row['Differentiation Tags'] || '').split(','),
      ].map(t => t.trim()).filter(Boolean))),
      manufacturingType: row['Manufacturing Type'] || '',
      industriesServed: Array.from(new Set(
        (row['Industries Served'] || '').split(',').map(t => t.trim()).filter(Boolean)
      )),
      investmentList: row['Investment List'] || '',
      subcategories: row['Subcategories'] || '',
      companyGroup: row['Company Group'] || '',
      startupLifecyclePhase: row['Startup Lifecycle Phase'] || '',
      latestFundingRound: row['Latest Funding Round'] || '',
      fundingYear: parseInt(row['Lastest Funding Event Year']) || parseInt(row['Latest Funding Event Year']) || 0,
      lastFundingAmount: parseCurrency(row['Latest Event Funding Amount']),
      totalFunding: parseCurrency(row['Total Current Known Funding Level']),
      estimatedRevenue: parseCurrency(row['Current Estimated Annual Revenue']),
      estimatedMarketValue: parseCurrency(row['Estimated Market Value']),
      financialNotes: row['Financials Notes'] || '',
      investors: Array.from(new Set(
        (row['Investors and VCs'] || '')
          .split(/[\n,]+/)
          .map(t => t.trim())
          .filter(t => t && ![
            'Undisclosed', 'N A', 'N/A', 'None', 'Bootstrapped', 'Boostrapped',
            'No publicly disclosed investors found.', 'No publicly disclosed investors found',
            'Angel investors',
          ].includes(t))
      )),
      marketOpportunity: parseNum(row['Market Opportunity']),
      marketOpportunityJustification: row['Market Opportunity Justification'] || '',
      teamExecution: parseNum(row['Team & Execution']),
      teamExecutionJustification: row['Team & Execution Justification'] || '',
      techDifferentiation: parseNum(row['Technology Differentiation']),
      techDifferentiationJustification: row['Technology Differentiation Justification'] || '',
      fundingEfficiency: parseNum(row['Funding Efficiency']),
      fundingEfficiencyJustification: row['Funding Efficiency Justification'] || '',
      growthMetrics: parseNum(row['Growth Metrics']),
      growthMetricsJustification: row['Growth Metrics Justification'] || '',
      industryImpact: parseNum(row['Industry Impact']),
      industryImpactJustification: row['Industry Impact Justification'] || '',
      competitiveMoat: parseNum(row['Competitive Moat']),
      competitiveMoatJustification: row['Competitive Moat Justification'] || '',
      weightedScore: parseNum(row['Weighted Score']),
    }))

    return NextResponse.json({ success: true, count: companies.length, data: companies })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load company data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
