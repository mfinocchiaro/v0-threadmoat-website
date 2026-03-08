"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Sparkles, ChevronRight } from "lucide-react"

interface ReportGeneratorProps {
  data: Company[]
  className?: string
}

interface ScoreRow {
  label: string
  value: number
  justification?: string
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function ICReport({ company }: { company: Company }) {
  const scoreRows: ScoreRow[] = [
    { label: "Market Opportunity", value: company.marketOpportunity, justification: company.marketOpportunityJustification },
    { label: "Team & Execution", value: company.teamExecution, justification: company.teamExecutionJustification },
    { label: "Tech Differentiation", value: company.techDifferentiation, justification: company.techDifferentiationJustification },
    { label: "Funding Efficiency", value: company.fundingEfficiency, justification: company.fundingEfficiencyJustification },
    { label: "Growth Metrics", value: company.growthMetrics, justification: company.growthMetricsJustification },
    { label: "Industry Impact", value: company.industryImpact, justification: company.industryImpactJustification },
    { label: "Competitive Moat", value: company.competitiveMoat, justification: company.competitiveMoatJustification },
  ]

  return (
    <div className="space-y-5 text-sm">
      {/* Header */}
      <div className="border-b pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-bold">{company.name}</div>
            <div className="text-muted-foreground text-xs mt-0.5">
              {company.hqLocation || company.country} &middot; Founded {company.founded || "N/A"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{company.weightedScore?.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Weighted Score</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {company.investmentList && (
            <Badge variant="secondary">{company.investmentList.replace(/^\d+-/, "")}</Badge>
          )}
          {company.country && <Badge variant="outline">{company.country}</Badge>}
          {company.startupLifecyclePhase && <Badge variant="outline">{company.startupLifecyclePhase}</Badge>}
          {company.latestFundingRound && <Badge variant="outline">{company.latestFundingRound}</Badge>}
        </div>
      </div>

      {/* Financials */}
      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Financials</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Total Funding", formatCurrency(company.totalFunding)],
            ["Est. Revenue", formatCurrency(company.estimatedRevenue)],
            ["Est. Market Value", formatCurrency(company.estimatedMarketValue)],
            ["Headcount", company.headcount?.toLocaleString() ?? "N/A"],
          ].map(([label, val]) => (
            <div key={label} className="bg-muted/40 rounded-lg p-2.5">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="font-semibold text-primary mt-0.5">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown */}
      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Score Breakdown</div>
        <div className="space-y-2.5">
          {scoreRows.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{row.label}</span>
              </div>
              <ScoreBar value={row.value} />
              {row.justification && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{row.justification}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {(company.strengths || company.weaknesses) && (
        <div className="grid grid-cols-1 gap-3">
          {company.strengths && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-3">
              <div className="text-xs font-semibold uppercase text-emerald-400 mb-1.5">Strengths</div>
              <p className="text-xs leading-relaxed">{company.strengths}</p>
            </div>
          )}
          {company.weaknesses && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3">
              <div className="text-xs font-semibold uppercase text-red-400 mb-1.5">Risks / Weaknesses</div>
              <p className="text-xs leading-relaxed">{company.weaknesses}</p>
            </div>
          )}
        </div>
      )}

      {/* Industries */}
      {company.industriesServed && company.industriesServed.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Industries Served</div>
          <div className="flex flex-wrap gap-1.5">
            {company.industriesServed.map((ind) => (
              <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Website */}
      {company.url && (
        <a
          href={company.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          {company.url}
        </a>
      )}
    </div>
  )
}

// ─── Intelligence Report Generator ───────────────────────────────────────────

const REPORT_TYPES = [
  { value: "deep-dive",     label: "Startup Deep Dive Case Study" },
  { value: "executive",     label: "Executive Briefing" },
  { value: "moat",          label: "Competitive Moat Analysis" },
  { value: "financial",     label: "Investment & Financial Profile" },
  { value: "tech",          label: "Technology & Innovation Audit" },
  { value: "market",        label: "Market Opportunity Index" },
  { value: "pmf",           label: "Product-Market Fit Analysis" },
]

function score5(val: number) {
  const bars = Math.round(val)
  return "█".repeat(bars) + "░".repeat(Math.max(0, 5 - bars)) + `  ${val.toFixed(1)}/5`
}

function generateReport(company: Company, type: string): string {
  const sep = "─".repeat(60)
  const header = [
    `${company.name.toUpperCase()}`,
    `${company.hqLocation || company.country}  ·  Founded ${company.founded || "N/A"}  ·  ${company.investmentList?.replace(/\(.*\)/, "").trim() ?? ""}`,
    `Overall Score: ${company.weightedScore?.toFixed(2) ?? "N/A"} / 5.00`,
    sep,
  ].join("\n")

  if (type === "deep-dive") {
    return [
      header,
      `\n## OVERVIEW`,
      company.strengths ? `Strengths: ${company.strengths}` : "",
      company.weaknesses ? `Risks: ${company.weaknesses}` : "",
      `\n## FINANCIALS`,
      `Total Funding:       ${formatCurrency(company.totalFunding)}`,
      `Est. Revenue:        ${formatCurrency(company.estimatedRevenue)}`,
      `Est. Market Value:   ${formatCurrency(company.estimatedMarketValue)}`,
      `Headcount:           ${company.headcount?.toLocaleString() ?? "N/A"}`,
      `Funding Round:       ${company.latestFundingRound || "N/A"}`,
      `\n## SCORE BREAKDOWN`,
      `Market Opportunity   ${score5(company.marketOpportunity)}`,
      company.marketOpportunityJustification ? `  → ${company.marketOpportunityJustification}` : "",
      `Team & Execution     ${score5(company.teamExecution)}`,
      company.teamExecutionJustification ? `  → ${company.teamExecutionJustification}` : "",
      `Tech Differentiation ${score5(company.techDifferentiation)}`,
      company.techDifferentiationJustification ? `  → ${company.techDifferentiationJustification}` : "",
      `Funding Efficiency   ${score5(company.fundingEfficiency)}`,
      company.fundingEfficiencyJustification ? `  → ${company.fundingEfficiencyJustification}` : "",
      `Growth Metrics       ${score5(company.growthMetrics)}`,
      company.growthMetricsJustification ? `  → ${company.growthMetricsJustification}` : "",
      `Industry Impact      ${score5(company.industryImpact)}`,
      company.industryImpactJustification ? `  → ${company.industryImpactJustification}` : "",
      `Competitive Moat     ${score5(company.competitiveMoat)}`,
      company.competitiveMoatJustification ? `  → ${company.competitiveMoatJustification}` : "",
      company.industriesServed?.length ? `\n## INDUSTRIES SERVED\n${company.industriesServed.join(", ")}` : "",
      company.url ? `\n${company.url}` : "",
    ].filter(Boolean).join("\n")
  }

  if (type === "executive") {
    return [
      header,
      `\n## INVESTMENT THESIS`,
      company.strengths || "No summary available.",
      `\n## KEY METRICS`,
      `Total Funding:  ${formatCurrency(company.totalFunding)}   |   Est. Revenue: ${formatCurrency(company.estimatedRevenue)}`,
      `Headcount:      ${company.headcount?.toLocaleString() ?? "N/A"}   |   Round: ${company.latestFundingRound || "N/A"}`,
      `Score:          ${company.weightedScore?.toFixed(2) ?? "N/A"}/5   |   Lifecycle: ${company.startupLifecyclePhase || "N/A"}`,
      `\n## KEY RISK`,
      company.weaknesses || "Not identified.",
    ].filter(Boolean).join("\n")
  }

  if (type === "moat") {
    return [
      header,
      `\n## COMPETITIVE MOAT SCORE`,
      `${score5(company.competitiveMoat)}`,
      company.competitiveMoatJustification ? `\n${company.competitiveMoatJustification}` : "",
      `\n## DIFFERENTIATION TAGS`,
      company.differentiationTags?.join(", ") || "None recorded.",
      `\n## OPERATING MODEL`,
      company.operatingModelTags?.join(", ") || "None recorded.",
      `\n## COMPETITIVE CONTEXT`,
      `Segment: ${company.subsegment || company.workflowSegment || "N/A"}`,
      `Investment List: ${company.investmentList || "N/A"}`,
    ].filter(Boolean).join("\n")
  }

  if (type === "financial") {
    return [
      header,
      `\n## FUNDING PROFILE`,
      `Latest Round:        ${company.latestFundingRound || "N/A"} (${company.fundingYear || "N/A"})`,
      `Last Event Amount:   ${formatCurrency(company.lastFundingAmount)}`,
      `Total Funding:       ${formatCurrency(company.totalFunding)}`,
      `\n## REVENUE & VALUATION`,
      `Est. Annual Revenue: ${formatCurrency(company.estimatedRevenue)}`,
      `Est. Market Value:   ${formatCurrency(company.estimatedMarketValue)}`,
      company.financialNotes ? `\nNotes: ${company.financialNotes}` : "",
      `\n## FUNDING EFFICIENCY SCORE`,
      `${score5(company.fundingEfficiency)}`,
      company.fundingEfficiencyJustification ? `\n${company.fundingEfficiencyJustification}` : "",
      company.investors?.length ? `\n## INVESTORS\n${company.investors.slice(0, 10).join(", ")}` : "",
    ].filter(Boolean).join("\n")
  }

  if (type === "tech") {
    return [
      header,
      `\n## TECHNOLOGY DIFFERENTIATION SCORE`,
      `${score5(company.techDifferentiation)}`,
      company.techDifferentiationJustification ? `\n${company.techDifferentiationJustification}` : "",
      `\n## DIFFERENTIATION TAGS`,
      company.differentiationTags?.join(", ") || "None recorded.",
      `\n## CATEGORY TAGS`,
      company.categoryTags?.join(", ") || "None recorded.",
      `\n## OPERATING MODEL`,
      company.operatingModelTags?.join(", ") || "None recorded.",
      `\n## TECH STRENGTHS`,
      company.strengths || "Not assessed.",
    ].filter(Boolean).join("\n")
  }

  if (type === "market") {
    return [
      header,
      `\n## MARKET OPPORTUNITY SCORE`,
      `${score5(company.marketOpportunity)}`,
      company.marketOpportunityJustification ? `\n${company.marketOpportunityJustification}` : "",
      `\n## INDUSTRY IMPACT SCORE`,
      `${score5(company.industryImpact)}`,
      company.industryImpactJustification ? `\n${company.industryImpactJustification}` : "",
      company.industriesServed?.length ? `\n## TARGET INDUSTRIES\n${company.industriesServed.join(", ")}` : "",
      `\n## MARKET CONTEXT`,
      `Sector Focus: ${company.sectorFocus || "N/A"}`,
      `Subsegment: ${company.subsegment || "N/A"}`,
      `Manufacturing Type: ${company.manufacturingType || "N/A"}`,
    ].filter(Boolean).join("\n")
  }

  if (type === "pmf") {
    return [
      header,
      `\n## GROWTH METRICS SCORE`,
      `${score5(company.growthMetrics)}`,
      company.growthMetricsJustification ? `\n${company.growthMetricsJustification}` : "",
      `\n## TEAM & EXECUTION SCORE`,
      `${score5(company.teamExecution)}`,
      company.teamExecutionJustification ? `\n${company.teamExecutionJustification}` : "",
      `\n## CUSTOMER SIGNALS`,
      company.knownCustomers ? `Known Customers: ${company.knownCustomers}` : "No customers recorded.",
      `\n## LIFECYCLE STAGE`,
      `Phase: ${company.startupLifecyclePhase || "N/A"}`,
      `Funding Round: ${company.latestFundingRound || "N/A"}`,
      `Headcount: ${company.headcount?.toLocaleString() ?? "N/A"}`,
    ].filter(Boolean).join("\n")
  }

  return `${header}\n\nReport type not recognized.`
}

function IntelligenceReportTab({ data }: { data: Company[] }) {
  const [reportType, setReportType] = useState("deep-dive")
  const [companySearch, setCompanySearch] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [reportOutput, setReportOutput] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!companySearch.trim()) return []
    const q = companySearch.toLowerCase()
    return data.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [data, companySearch])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectCompany = (c: Company) => {
    setSelectedCompany(c)
    setCompanySearch(c.name)
    setShowSuggestions(false)
    setReportOutput(null)
  }

  const generate = () => {
    if (!selectedCompany) return
    setReportOutput(generateReport(selectedCompany, reportType))
  }

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        {/* Report type */}
        <div className="flex flex-col gap-1 min-w-[260px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report Type</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[240px]" ref={containerRef}>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Startup</label>
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Type company name..."
              value={companySearch}
              onChange={e => {
                setCompanySearch(e.target.value)
                setSelectedCompany(null)
                setShowSuggestions(true)
                setReportOutput(null)
              }}
              onFocus={() => { if (companySearch) setShowSuggestions(true) }}
              className="h-9"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
                {suggestions.map(c => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                    onMouseDown={() => selectCompany(c)}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{c.investmentList?.replace(/\(.*\)/, "").trim()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={generate}
          disabled={!selectedCompany}
          className="h-9 gap-2 shrink-0 sm:self-end"
        >
          <Sparkles className="h-4 w-4" />
          Generate Intelligence
        </Button>
      </div>

      {/* Output */}
      {reportOutput && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ChevronRight className="h-4 w-4 text-primary" />
              {REPORT_TYPES.find(r => r.value === reportType)?.label}
              {selectedCompany && <span className="text-muted-foreground font-normal">— {selectedCompany.name}</span>}
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigator.clipboard.writeText(reportOutput)}>
              Copy
            </Button>
          </div>
          <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground/90 overflow-x-auto">
            {reportOutput}
          </pre>
        </div>
      )}

      {!reportOutput && (
        <div className="rounded-xl border border-dashed border-border/50 h-48 flex items-center justify-center text-muted-foreground text-sm">
          Select a report type and startup, then click Generate Intelligence
        </div>
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ReportGenerator({ data, className }: ReportGeneratorProps) {
  const [search, setSearch] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [sortField, setSortField] = useState<"weightedScore" | "totalFunding" | "name">("weightedScore")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.country ?? "").toLowerCase().includes(q) || (c.investmentList ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortField === "name") return a.name.localeCompare(b.name)
        return ((b[sortField] as number) || 0) - ((a[sortField] as number) || 0)
      })
  }, [data, search, sortField])

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs defaultValue="ic-memos">
        <TabsList className="mb-4">
          <TabsTrigger value="ic-memos">IC Memos</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence">
          <IntelligenceReportTab data={data} />
        </TabsContent>

        <TabsContent value="ic-memos">
      {/* Search + sort bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search companies, countries, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm h-8 text-sm"
        />
        <div className="flex gap-2 ml-auto">
          {(["weightedScore", "totalFunding", "name"] as const).map((f) => (
            <Button
              key={f}
              variant={sortField === f ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSortField(f)}
            >
              {f === "weightedScore" ? "Score" : f === "totalFunding" ? "Funding" : "Name"}
            </Button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} companies</span>
      </div>

      {/* Company list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 60).map((company) => (
          <div
            key={company.id}
            className="border border-border/60 rounded-xl p-3.5 bg-card/40 flex flex-col gap-2 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm leading-tight">{company.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {company.country} &middot; {company.investmentList?.replace(/^\d+-/, "") ?? "N/A"}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-base font-bold text-primary">{company.weightedScore?.toFixed(1)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatCurrency(company.totalFunding)}</span>
              {company.startupLifecyclePhase && (
                <>
                  <span>&middot;</span>
                  <span>{company.startupLifecyclePhase}</span>
                </>
              )}
            </div>
            <Button
              size="sm"
              className="mt-auto h-7 text-xs"
              onClick={() => setSelectedCompany(company)}
            >
              Generate IC Report
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12 text-sm">
            No companies match your search.
          </div>
        )}
      </div>

      {/* IC Report Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Investment Committee Memo</DialogTitle>
              </DialogHeader>
              <ICReport company={selectedCompany} />
            </>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
