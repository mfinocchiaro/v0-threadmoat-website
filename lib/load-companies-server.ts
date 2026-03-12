import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'
import type { Company } from './company-data'

const JUNK_VALUES = new Set(['n/a', 'n a', 'na', 'unknown', 'none', 'null', '-', '—'])
function cleanField(value: string | undefined): string {
  const v = (value || '').trim()
  return JUNK_VALUES.has(v.toLowerCase()) ? '' : v
}

/**
 * Airtable AI fields are stored as Python dict strings:
 *   {'state': 'generated', 'value': 'actual text here', 'isStale': False}
 * This extracts the 'value' field, or returns the original string if not a dict.
 */
function extractAirtableValue(raw: string | undefined): string {
  if (!raw) return ''
  const s = raw.trim()
  if (!s.startsWith('{') || !s.endsWith('}')) return s
  // Extract value between 'value': ' and the next unescaped '
  const match = s.match(/'value':\s*'((?:[^'\\]|\\.)*)'/)
  if (match) return match[1].replace(/\\'/g, "'")
  // Try double quotes
  const match2 = s.match(/'value':\s*"((?:[^"\\]|\\.)*)"/)
  if (match2) return match2[1]
  // Try multiline: value spans multiple lines — grab everything between 'value': ' and ', 'isStale
  const match3 = s.match(/'value':\s*'([\s\S]*)',\s*'isStale/)
  if (match3) return match3[1].replace(/\\'/g, "'")
  return s
}

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

/**
 * Load companies from CSV on the server.
 * Used by both the API route and server components (homepage).
 */
export async function loadCompaniesFromCSV(): Promise<Company[]> {
  const csvPath = path.join(process.cwd(), 'data', 'Startups-Grid view.csv')
  let csvContent = await fs.readFile(csvPath, 'utf-8')

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
    if ((row['Investment List'] || '').trim() === 'VC') return false
    return true
  })

  return validData.map((row, i) => ({
    id: String(i + 1),
    name: row['Company'] || '',
    url: row['Company URL'] || '',
    hqLocation: row['HQ Location'] || '',
    country: row['Country'] || '',
    founded: parseInt(row['Founded']) || 0,
    headcount: parseInt(row['Estimated Headcount']) || 0,
    knownCustomers: row['Known Customers'] || '',
    strengths: extractAirtableValue(row['Strengths']),
    weaknesses: extractAirtableValue(row['Weaknesses']),
    discipline: row['Discipline'] || '',
    lifecyclePhase: cleanField(row['Lifecycle Phase']),
    workflowSegment: row['Workflow Segment'] || '',
    subsegment: row['Subsegment'] || '',
    sectorFocus: row['Sector Focus'] || '',
    categoryTags: Array.from(new Set(
      (row['Category/Function Tags'] || '').split(',').map(t => t.trim()).filter(Boolean)
    )),
    differentiationTags: Array.from(new Set(
      (row['Differentiation Tags'] || '').split(',').map(t => t.trim()).filter(Boolean)
    )),
    operatingModelTags: Array.from(new Set(
      (row['Operating Model Tags'] || '').split(',').map(t => t.trim()).filter(Boolean)
    )),
    tags: Array.from(new Set([
      ...(row['Tags'] || '').split(','),
      ...(row['Category/Function Tags'] || '').split(','),
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
    latestFundingRound: row['Latest Funding Round']?.trim() || 'Undisclosed or unknown',
    fundingYear: parseInt(row['Lastest Funding Event Year']) || parseInt(row['Latest Funding Event Year']) || 0,
    lastFundingAmount: parseCurrency(row['Latest Event Funding Amount']),
    totalFunding: parseCurrency(row['Total Current Known Funding Level']),
    estimatedRevenue: parseCurrency(row['Current Estimated Annual Revenue']),
    estimatedMarketValue: parseCurrency(row['Estimated Market Value']),
    financialNotes: extractAirtableValue(row['Financials Notes']),
    investors: Array.from(new Set(
      extractAirtableValue(row['Investors and VCs'])
        .split(/[\n,]+/)
        .map(t => t.trim())
        .filter(t => t && ![
          'Undisclosed', 'Unknown or Undisclosed', 'Undisclosed or unknown', 'Unknown', 'N A', 'N/A', 'None',
          'Bootstrapped', 'Self-funded', 'Self-Funded',
          'No publicly disclosed investors found.', 'No publicly disclosed investors found',
          'Angel investors',
        ].includes(t))
    )),
    marketOpportunity: parseNum(row['Market Opportunity']),
    marketOpportunityJustification: extractAirtableValue(row['Market Opportunity Justification']),
    teamExecution: parseNum(row['Team & Execution']),
    teamExecutionJustification: extractAirtableValue(row['Team & Execution Justification']),
    techDifferentiation: parseNum(row['Technology Differentiation']),
    techDifferentiationJustification: extractAirtableValue(row['Technology Differentiation Justification']),
    fundingEfficiency: parseNum(row['Funding Efficiency']),
    fundingEfficiencyJustification: extractAirtableValue(row['Funding Efficiency Justification']),
    growthMetrics: parseNum(row['Growth Metrics']),
    growthMetricsJustification: extractAirtableValue(row['Growth Metrics Justification']),
    industryImpact: parseNum(row['Industry Impact']),
    industryImpactJustification: extractAirtableValue(row['Industry Impact Justification']),
    competitiveMoat: parseNum(row['Competitive Moat']),
    competitiveMoatJustification: extractAirtableValue(row['Competitive Moat Justification']),
    weightedScore: parseNum(row['Weighted Score']),
  }))
}

/**
 * Strip sensitive fields for public/unauthenticated display.
 * Keeps what charts need, removes competitive intelligence.
 */
export function stripSensitiveFields(companies: Company[]): Company[] {
  return companies.map(c => ({
    ...c,
    strengths: '',
    weaknesses: '',
    knownCustomers: '',
    financialNotes: '',
    investors: [],
    marketOpportunityJustification: '',
    teamExecutionJustification: '',
    techDifferentiationJustification: '',
    fundingEfficiencyJustification: '',
    growthMetricsJustification: '',
    industryImpactJustification: '',
    competitiveMoatJustification: '',
  }))
}
