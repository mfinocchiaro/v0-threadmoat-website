"use client"

import { useState, useMemo } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
    </div>
  )
}
