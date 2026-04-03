import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'
import type { Company } from './company-data'

/**
 * Parse Python-style list strings from Airtable CSV exports:
 *   "['Physics & Domain AI', 'System of Record Enhancement']"
 * Returns clean string array with no brackets or quotes.
 * Falls back to comma-split for plain CSV values.
 */
function parsePythonList(raw: string | undefined): string[] {
  if (!raw) return []
  const s = raw.trim()
  if (s.startsWith('[') && s.endsWith(']')) {
    // Strip outer brackets, then split on quoted boundaries
    const inner = s.slice(1, -1)
    return inner
      .split(/,\s*/)
      .map(v => v.replace(/^['"]|['"]$/g, '').trim())
      .filter(Boolean)
  }
  // Plain comma-separated
  return s.split(',').map(v => v.trim()).filter(Boolean)
}

const JUNK_VALUES = new Set(['n/a', 'n a', 'na', 'unknown', 'none', 'null', '-', '—'])
function cleanField(value: string | undefined): string {
  const v = (value || '').trim()
  return JUNK_VALUES.has(v.toLowerCase()) ? '' : v
}

const VALID_KERNELS = ['proprietary', 'parasolid', 'opencascade', 'openusd', 'rhino', 'webgl', 'acis', 'cgal']
/**
 * Clean Graphics Kernel values — keep only recognized kernel identifiers.
 * Many rows contain misplaced construction industry data (e.g. "Residential Construction, Homebuilding")
 * which must be rejected.
 */
function cleanGraphicsKernel(raw: string | undefined): string {
  const v = cleanField(raw)
  if (!v) return ''
  const lower = v.toLowerCase()
  return VALID_KERNELS.some(k => lower.includes(k)) ? v : ''
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

function parseBool(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes' || v === 'checked'
}

// Normalize bad city/location values from Airtable
const CITY_FIXES: Record<string, string> = {
  'nowhere': 'Oklahoma City',
  'california': 'San Francisco',
}

function normalizeCity(raw: string): string {
  const trimmed = raw.trim()
  const fixed = CITY_FIXES[trimmed.toLowerCase()]
  return fixed || trimmed
}

function normalizeHqLocation(raw: string): string {
  if (!raw) return ''
  // "Nowhere, OK, USA" → "Oklahoma City, OK, USA"
  if (/\bnowhere\b/i.test(raw)) return raw.replace(/\bnowhere\b/i, 'Oklahoma City')
  // "California, USA" → "San Francisco, California, USA"
  if (/^california,/i.test(raw.trim())) return `San Francisco, ${raw.trim()}`
  return raw
}

// ─── Module-level CSV parse cache ────────────────────────────────────────────
// Persists across requests within the same serverless instance.
// Invalidates when the CSV file's mtime changes (i.e. after a deploy or data sync).
let _cachedCompanies: Company[] | null = null
let _cachedMtimeMs: number = 0
let _cachedEnrichMtimeMs: number = 0

/**
 * Load companies from CSV on the server.
 * Uses a module-level cache keyed on file mtime to avoid re-parsing the 1400+ row
 * CSV on every request within the same serverless cold-start window.
 */
export async function loadCompaniesFromCSV(): Promise<Company[]> {
  const csvPath = path.join(process.cwd(), 'data', 'Startups-Grid Full DB View.csv')

  // Check if cache is still valid by comparing file mtimes
  const enrichPath = path.join(process.cwd(), 'data', 'heatmap_enrichment.csv')
  try {
    const [csvStat, enrichStat] = await Promise.all([
      fs.stat(csvPath),
      fs.stat(enrichPath).catch(() => null),
    ])
    const csvMtime = csvStat.mtimeMs
    const enrichMtime = enrichStat?.mtimeMs ?? 0

    if (
      _cachedCompanies &&
      csvMtime === _cachedMtimeMs &&
      enrichMtime === _cachedEnrichMtimeMs
    ) {
      return _cachedCompanies
    }

    // Store mtimes for next cache check (set before parse so even if parse
    // throws, we don't re-stat on the next call with the same stale mtimes)
    _cachedMtimeMs = csvMtime
    _cachedEnrichMtimeMs = enrichMtime
  } catch {
    // If stat fails, proceed without caching
  }
  let csvContent = await fs.readFile(csvPath, 'utf-8')

  // Strip BOM if present
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1)
  }

  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
  const rawData = parsed.data as Record<string, string>[]

  // Load heatmap enrichment data (semicolon-delimited sidecar file)
  let enrichMap = new Map<string, Record<string, string>>()
  try {
    let enrichContent = await fs.readFile(enrichPath, 'utf-8')
    if (enrichContent.charCodeAt(0) === 0xFEFF) enrichContent = enrichContent.slice(1)
    const enrichParsed = Papa.parse(enrichContent, { header: true, skipEmptyLines: true, delimiter: ';' })
    for (const row of enrichParsed.data as Record<string, string>[]) {
      const name = (row['Name'] || '').trim()
      if (name) enrichMap.set(name.toLowerCase(), row)
    }
  } catch {
    // Enrichment file missing — proceed without it
  }

  const validData = rawData.filter(row => {
    const name = (row['Company'] || '').trim()
    if (!name) return false
    if (/^Tech\s*(XXX|YYY|ZZZ|\d+)/i.test(name)) return false
    if (/^Test\s*Company/i.test(name)) return false
    if ((row['Investment List'] || '').trim() === 'VC') return false
    return true
  })

  const companies = validData.map((row, i) => {
    const companyName = row['Company'] || ''
    const enrich = enrichMap.get(companyName.toLowerCase()) || {}
    return {
    id: String(i + 1),
    name: companyName,
    url: row['Company URL'] || '',
    hqLocation: normalizeHqLocation(row['HQ Location'] || ''),
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
    categoryTags: Array.from(new Set(parsePythonList(row['Category/Function Tags']))),
    differentiationTags: Array.from(new Set(parsePythonList(row['Differentiation Tags']))),
    deploymentModel: Array.from(new Set(parsePythonList(row['Deployment Model']))),
    operatingModelTags: Array.from(new Set(parsePythonList(row['Operating Model Tags']))),
    tags: Array.from(new Set([
      ...parsePythonList(row['Tags']),
      ...parsePythonList(row['Category/Function Tags']),
      ...parsePythonList(row['Differentiation Tags']),
    ])),
    manufacturingType: row['Manufacturing Type'] || '',
    industriesServed: Array.from(new Set(parsePythonList(row['Industries Served']))),
    investmentList: row['Investment List'] || '',
    investmentTheses: parsePythonList(row['Investment Thesis']),
    subcategories: row['Subcategories'] || '',
    companyGroup: row['Company Group'] || '',
    startupLifecyclePhase: row['Startup Lifecycle Phase'] || '',
    latestFundingRound: row['Latest Funding Round']?.trim() || 'Undisclosed or unknown',
    fundingYear: parseInt(row['Lastest Funding Event Year']) || parseInt(row['Latest Funding Event Year']) || 0,
    lastFundingAmount: parseCurrency(row['Latest Event Funding Amount']),
    totalFunding: parseCurrency(row['Total Current Known Funding Level']),
    estimatedRevenue: parseCurrency(row['Current Estimated Annual Revenue']),
    estimatedMarketValue: parseCurrency(row['Best Available Valuation']),
    valuationConfidence: cleanField(row['Valuation Value Confidence']),
    financialConfidence: cleanField(row['Financial Confidence']),
    reportedValuation: parseCurrency(row['Reported Valuation']),
    reportedValuationYear: parseInt(row['Reported Valuation Year']) || 0,
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
    // Financial health
    scoreFinancial: parseNum(row['Score Financial']),
    customerSignalScore: parseNum(row['Customer Signal Score']),
    momentumMultiplier: parseNum(row['Momentum Multiplier']),
    momentumCap: parseNum(row['Momentum Cap']),
    startupSizeCategory: row['Startup Size Category'] || '',
    // City
    city: normalizeCity(row['City'] || ''),
    // Binary flags — CAD ecosystem
    flagSolidWorks: parseBool(row['SolidWorks']),
    flagCATIA: parseBool(row['CATIA']),
    flagSiemens: parseBool(row['Siemens']),
    flagParasolid: parseBool(row['Parasolid']),
    flagSTEP: parseBool(row['STEP']),
    flagNURBS: parseBool(row['NURBS']),
    flagECAD: parseBool(row['ECAD/EDA']),
    flagTextToCAD: parseBool(row['Text-to-CAD']),
    flagProprietary: parseBool(row['Proprietary']),
    // Binary flags — Simulation
    flagFEA: parseBool(row['FEA/FEM']),
    flagCFD: parseBool(row['CFD']),
    // Binary flags — Modeling
    flagGenerative: parseBool(row['Generative']),
    flagImplicit: parseBool(row['Implicit']),
    flagHTE: parseBool(row['HTE']),
    flagQC: parseBool(row['QC']),
    // Binary flags — Industry
    flagAeroDefense: parseBool(row['A&D']),
    flagAutomotive: parseBool(row['Automotive']),
    flagPharma: parseBool(row['Pharma']),
    flagMedDev: parseBool(row['MedDev']),
    flagDiscrete: parseBool(row['Discrete']),
    flagNonDiscrete: parseBool(row['Non-Discrete']),
    flagProcess: parseBool(row['Process']),
    // Binary flags — VC
    flagYCombinator: parseBool(row['Y-Combinator']),
    flagA16Z: parseBool(row['a16z']),
    flagTechstars: parseBool(row['Techstars']),
    flagSequoia: parseBool(row['Sequoia']),
    flagInsightPartners: parseBool(row['Insight Partners']),
    flagEclipseVentures: parseBool(row['Eclipse Ventures']),
    flagBain: parseBool(row['Bain']),
    flagFidelity: parseBool(row['Fidelity']),
    flagBrowserBased: parseBool(row[' Browser-based'] || row['Browser-based']),
    // IP Dependency Analysis columns
    ecosystemCompatibility: cleanField(row['Ecosystem SW/Platform Compatibility']),
    graphicsKernel: cleanGraphicsKernel(row['Graphics Kernel']),
    modelingParadigms: parsePythonList(row['Modeling Paradigms & Protocols']),
    // Heatmap enrichment (from sidecar CSV)
    techIndependenceScore: parseInt(enrich['Technology Independence Score']) || 0,
    ecosystemDependencies: (enrich['Ecosystem Dependencies'] || '').split(',').map(s => s.trim()).filter(s => s && s !== 'None'),
    growthMomentumTier: enrich['Growth Momentum Tier'] || 'Unknown',
    buyerPersona: enrich['Buyer Persona'] || 'Unknown',
  }})

  // Store in module-level cache
  _cachedCompanies = companies
  return companies
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
