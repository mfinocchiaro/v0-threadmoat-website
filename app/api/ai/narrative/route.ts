import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rate-limit'
import { loadCompaniesFromCSV } from '@/lib/load-companies-server'
import { formatCurrency } from '@/lib/company-data'
import type { Company } from '@/lib/company-data'

export const maxDuration = 60

// ─── Prompt construction ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior investment analyst specializing in industrial technology startups. You have deep expertise in PLM, CAD/CAM, simulation, manufacturing software, and the broader engineering software ecosystem.

Your task is to produce a concise but insightful narrative assessment of a startup company based on structured data. Write for an audience of fellow analysts and M&A strategists who already understand the industrial tech landscape.

Produce exactly four clearly labeled markdown sections:

## Impressions
Your initial read on the company — what stands out, how it positions within its segment, and the general signal quality from the data. Be specific and opinionated.

## Conclusions
Key takeaways about the company's investability, strategic value, and trajectory. Synthesize the score dimensions, financials, and competitive positioning into actionable conclusions.

## Beware
Risks, red flags, and concerns. Look at funding efficiency, team execution gaps, weak moats, unfavorable market dynamics, or anything in the data that signals caution. Be direct.

## Overlooked Opportunities
Non-obvious angles — potential synergies, adjacencies, partnership plays, or underappreciated strengths that the raw scores might not surface. Think like a strategic acquirer.

Guidelines:
- Be concrete: reference specific data points, scores, and comparisons
- Be concise: each section should be 2-4 short paragraphs maximum
- Avoid generic filler — every sentence should carry signal
- Use markdown formatting (bold, lists) sparingly and only where it aids readability`

function buildUserPrompt(company: Company): string {
  const scores = [
    { name: 'Market Opportunity', score: company.marketOpportunity, justification: company.marketOpportunityJustification },
    { name: 'Team & Execution', score: company.teamExecution, justification: company.teamExecutionJustification },
    { name: 'Technology Differentiation', score: company.techDifferentiation, justification: company.techDifferentiationJustification },
    { name: 'Funding Efficiency', score: company.fundingEfficiency, justification: company.fundingEfficiencyJustification },
    { name: 'Growth Metrics', score: company.growthMetrics, justification: company.growthMetricsJustification },
    { name: 'Industry Impact', score: company.industryImpact, justification: company.industryImpactJustification },
    { name: 'Competitive Moat', score: company.competitiveMoat, justification: company.competitiveMoatJustification },
  ]

  const scoreBlock = scores
    .map(s => `- **${s.name}**: ${s.score}/10${s.justification ? `\n  Justification: ${s.justification}` : ''}`)
    .join('\n')

  const sections: string[] = [
    `# Company: ${company.name}`,
    '',
    `**Website**: ${company.url || 'N/A'}`,
    `**HQ**: ${company.hqLocation || 'N/A'}`,
    `**Founded**: ${company.founded || 'N/A'}`,
    `**Headcount**: ${company.headcount || 'N/A'}`,
    `**Lifecycle Phase**: ${company.startupLifecyclePhase || company.lifecyclePhase || 'N/A'}`,
    `**Investment List**: ${company.investmentList || 'N/A'}`,
    `**Weighted Score**: ${company.weightedScore}/10`,
    '',
    '## Score Dimensions',
    scoreBlock,
    '',
    '## Strengths',
    company.strengths || 'No data available.',
    '',
    '## Weaknesses',
    company.weaknesses || 'No data available.',
    '',
    '## Financials',
    `- Latest Funding Round: ${company.latestFundingRound || 'N/A'}`,
    `- Total Funding: ${company.totalFunding ? formatCurrency(company.totalFunding) : 'N/A'}`,
    `- Last Funding Amount: ${company.lastFundingAmount ? formatCurrency(company.lastFundingAmount) : 'N/A'}`,
    `- Estimated Revenue: ${company.estimatedRevenue ? formatCurrency(company.estimatedRevenue) : 'N/A'}`,
    `- Estimated Market Value: ${company.estimatedMarketValue ? formatCurrency(company.estimatedMarketValue) : 'N/A'}`,
    `- Financial Score: ${company.scoreFinancial}/10`,
    company.financialNotes ? `- Notes: ${company.financialNotes}` : '',
    '',
    '## Industry & Tags',
    `- Discipline: ${company.discipline || 'N/A'}`,
    `- Workflow Segment: ${company.workflowSegment || 'N/A'}`,
    `- Sector Focus: ${company.sectorFocus || 'N/A'}`,
    `- Industries Served: ${company.industriesServed.length ? company.industriesServed.join(', ') : 'N/A'}`,
    `- Category Tags: ${company.categoryTags.length ? company.categoryTags.join(', ') : 'N/A'}`,
    `- Differentiation Tags: ${company.differentiationTags.length ? company.differentiationTags.join(', ') : 'N/A'}`,
    '',
    '## Competitive Positioning',
    `- Known Customers: ${company.knownCustomers || 'N/A'}`,
    `- Customer Signal Score: ${company.customerSignalScore}/10`,
    `- Key Investors: ${company.investors.length ? company.investors.join(', ') : 'None disclosed'}`,
    `- Deployment Model: ${company.deploymentModel.length ? company.deploymentModel.join(', ') : 'N/A'}`,
    '',
    'Produce your assessment based on this data.',
  ]

  return sections.filter(line => line !== undefined).join('\n')
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    console.error('[ai/narrative] Unauthorized request — no session')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit: 10 requests per hour per user
  const rl = await rateLimit(`ai:narrative:${session.user.id}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    console.error(`[ai/narrative] Rate limit exceeded for user ${session.user.id}`)
    return Response.json(
      { error: 'Rate limit exceeded', retryAfterMs: rl.retryAfterMs },
      { status: 429 },
    )
  }

  // 3. Validate input
  let body: { companyId?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { companyId } = body
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    return Response.json(
      { error: 'Missing or invalid companyId — must be a non-empty string' },
      { status: 400 },
    )
  }

  // 4. Load company data
  let companies: Company[]
  try {
    companies = await loadCompaniesFromCSV()
  } catch (error) {
    console.error('[ai/narrative] Failed to load company data:', error)
    return Response.json({ error: 'Failed to load company data' }, { status: 500 })
  }

  const company = companies.find(c => c.id === companyId.trim())
  if (!company) {
    console.error(`[ai/narrative] Company not found: ${companyId}`)
    return Response.json({ error: `Company not found: ${companyId}` }, { status: 404 })
  }

  // 5. Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[ai/narrative] ANTHROPIC_API_KEY is not configured')
    return Response.json({ error: 'AI generation failed' }, { status: 500 })
  }

  // 6. Stream AI response
  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(company),
      maxOutputTokens: 2000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error(`[ai/narrative] AI generation failed for company ${companyId}:`, error)
    return Response.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
