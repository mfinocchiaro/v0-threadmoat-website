"use client"

import { useState, useMemo } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface InvestorViewsChartProps {
  data: Company[]
  className?: string
}

interface ViewConfig {
  id: number
  title: string
  chart: string
  chartPath: string
  description: string
  action: string
  filter: (companies: Company[]) => Company[]
}

const VIEWS: ViewConfig[] = [
  {
    id: 1,
    title: "Hidden Gems — High Score, Low Funding",
    chart: "bubbles",
    chartPath: "/dashboard/bubbles",
    description: "Companies with top-quartile weighted scores but relatively low total funding. The ideal seed-stage opportunity: validation without over-valuation.",
    action: "Filter to companies with score > 4.3 and funding < $8M",
    filter: (cs) => cs.filter((c) => c.weightedScore >= 4.3 && c.totalFunding < 8e6).sort((a, b) => b.weightedScore - a.weightedScore),
  },
  {
    id: 2,
    title: "Capital Efficiency Champions",
    chart: "correlation",
    chartPath: "/dashboard/correlation",
    description: "Companies with funding efficiency scores at or above 4.0 — founders who do more with less. Better unit economics, stronger returns.",
    action: "Observe the Funding Efficiency × Weighted Score cell — note the strong positive correlation",
    filter: (cs) => cs.filter((c) => c.fundingEfficiency >= 4.0).sort((a, b) => b.fundingEfficiency - a.fundingEfficiency),
  },
  {
    id: 3,
    title: "Rocket Ships — Growth × Market Opportunity",
    chart: "splom",
    chartPath: "/dashboard/splom",
    description: "Companies with both high growth AND massive market opportunity. The TAM × Execution sweet spot for Series A+ investors.",
    action: "Check the Growth Metrics × Market Opportunity scatter cell in the SPLOM",
    filter: (cs) => cs.filter((c) => c.growthMetrics >= 4.0 && c.marketOpportunity >= 4.0).sort((a, b) => b.weightedScore - a.weightedScore),
  },
  {
    id: 4,
    title: "Pre-Seed Alpha — Early Stage, Top Quartile",
    chart: "spiral",
    chartPath: "/dashboard/spiral",
    description: "Early-stage companies (founded 2020+) scoring 4.3 or higher. Seed-stage valuations with Series A+ quality signals.",
    action: "Filter the spiral timeline to 2020+ and look at the outer edge of the spiral for high-scoring dots",
    filter: (cs) => cs.filter((c) => c.founded >= 2020 && c.weightedScore >= 4.3).sort((a, b) => b.weightedScore - a.weightedScore),
  },
  {
    id: 5,
    title: "Geographic Arbitrage — UK & Germany",
    chart: "marimekko",
    chartPath: "/dashboard/marimekko",
    description: "UK and Germany companies often have scores equivalent to US peers but trade at lower valuations. Premium quality at a discount.",
    action: "Set width to Investment List, height to Country, and hover over UK / Germany cells",
    filter: (cs) => cs.filter((c) => ["United Kingdom", "Germany", "UK", "DE"].includes(c.country ?? "")).sort((a, b) => b.weightedScore - a.weightedScore),
  },
  {
    id: 6,
    title: "Category Killers — Dominant Niche Leaders",
    chart: "correlation",
    chartPath: "/dashboard/correlation",
    description: "Companies with Competitive Moat ≥ 4.5 AND Tech Differentiation ≥ 4.0. These are winner-take-most dynamics with defensible positions.",
    action: "Focus on the Competitive Moat × Tech Differentiation correlation cell",
    filter: (cs) => cs.filter((c) => c.competitiveMoat >= 4.5 && c.techDifferentiation >= 4.0).sort((a, b) => b.competitiveMoat - a.competitiveMoat),
  },
  {
    id: 7,
    title: "Team Quality Signal",
    chart: "correlation",
    chartPath: "/dashboard/correlation",
    description: "Team execution correlates strongly with tech differentiation (r ~0.7) and overall score (r ~0.8). Great teams build great products.",
    action: "Examine the Team Execution row and column for the strongest correlations",
    filter: (cs) => cs.filter((c) => c.teamExecution >= 4.0).sort((a, b) => b.teamExecution - a.teamExecution),
  },
  {
    id: 8,
    title: "Funding Velocity — Momentum Signals",
    chart: "spiral",
    chartPath: "/dashboard/spiral",
    description: "Companies that raised capital quickly show market validation, founder execution, and investor confidence. Momentum attracts momentum.",
    action: "Use the spiral timeline sized by funding to see recent high-raise companies near the outer edge",
    filter: (cs) => cs.filter((c) => c.fundingYear >= 2022 && c.totalFunding >= 5e6).sort((a, b) => b.totalFunding - a.totalFunding),
  },
  {
    id: 9,
    title: "Word Cloud — Technology Tag Analysis",
    chart: "wordcloud",
    chartPath: "/dashboard/wordcloud",
    description: "The most common technology tags across the ecosystem reveal where investment is concentrating and which capabilities are becoming table-stakes.",
    action: "Click any tag to filter to companies with that capability",
    filter: (cs) => cs.sort((a, b) => b.weightedScore - a.weightedScore),
  },
  {
    id: 10,
    title: "Market Concentration — Sector × Country",
    chart: "marimekko",
    chartPath: "/dashboard/marimekko",
    description: "The Marimekko chart reveals which sector × country combinations command the most funding and company density.",
    action: "Set metric to Total Funding and observe which cells dominate the chart",
    filter: (cs) => cs.sort((a, b) => b.totalFunding - a.totalFunding),
  },
]

interface ResultModalProps {
  view: ViewConfig
  companies: Company[]
  open: boolean
  onClose: () => void
}

function ResultModal({ view, companies, open, onClose }: ResultModalProps) {
  const results = useMemo(() => view.filter(companies).slice(0, 12), [view, companies])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{view.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground text-xs">{view.description}</p>
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-3">
            <span className="text-xs font-semibold uppercase text-emerald-400 mr-2">Action</span>
            <span className="text-xs">{view.action}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{results.length} companies shown (top of filtered set)</span>
            <Link href={view.chartPath}>
              <Button variant="default" size="sm" className="h-7 text-xs" onClick={onClose}>
                Open {view.chart} chart
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((c) => (
              <div key={c.id} className="bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-xs">{c.name}</span>
                  <span className="text-xs font-bold text-primary flex-shrink-0">{c.weightedScore?.toFixed(1)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.country} &middot; {formatCurrency(c.totalFunding)}
                  {c.fundingEfficiency ? ` &middot; Eff: ${c.fundingEfficiency.toFixed(1)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InvestorViewsChart({ data, className }: InvestorViewsChartProps) {
  const [query, setQuery] = useState("")
  const [activeView, setActiveView] = useState<ViewConfig | null>(null)
  const [queryResults, setQueryResults] = useState<Company[] | null>(null)
  const [queryDesc, setQueryDesc] = useState("")

  function handleQuery() {
    const q = query.toLowerCase().trim()
    if (!q) return

    let results = [...data]
    const desc: string[] = []

    // Funding round
    const rounds = ["pre-seed", "seed", "series a", "series b", "series c", "growth", "ipo"]
    const round = rounds.find((r) => q.includes(r))
    if (round) {
      results = results.filter((d) => (d.latestFundingRound ?? d.startupLifecyclePhase ?? "").toLowerCase().includes(round))
      desc.push(`Round: ${round}`)
    }

    // Revenue match
    const revMatch = q.match(/revenue.*?(>|<|more than|less than)\s*\$?([0-9.]+[mbk]?)/i)
    if (revMatch) {
      const op = revMatch[1]
      const raw = revMatch[2]
      const m = raw.match(/b/i) ? 1e9 : raw.match(/m/i) ? 1e6 : raw.match(/k/i) ? 1e3 : 1
      const val = parseFloat(raw) * m
      if ([">", "more than"].includes(op)) {
        results = results.filter((d) => d.estimatedRevenue > val)
        desc.push(`Revenue > ${formatCurrency(val)}`)
      } else {
        results = results.filter((d) => d.estimatedRevenue < val)
        desc.push(`Revenue < ${formatCurrency(val)}`)
      }
    }

    // Score filter
    const scoreMatch = q.match(/score.*?(>|>=|above|at least)\s*([0-9.]+)/i)
    if (scoreMatch) {
      const val = parseFloat(scoreMatch[2])
      results = results.filter((d) => d.weightedScore >= val)
      desc.push(`Score >= ${val}`)
    }

    // Country
    const countryMatch = q.match(/\b(us|usa|united states|uk|united kingdom|germany|france|india|canada|israel|australia|singapore)\b/i)
    if (countryMatch) {
      const c = countryMatch[1].toUpperCase()
      const countryMap: Record<string, string[]> = {
        US: ["United States", "USA"],
        USA: ["United States", "USA"],
        "UNITED STATES": ["United States", "USA"],
        UK: ["United Kingdom", "UK"],
        "UNITED KINGDOM": ["United Kingdom", "UK"],
        GERMANY: ["Germany"],
        FRANCE: ["France"],
        INDIA: ["India"],
        CANADA: ["Canada"],
        ISRAEL: ["Israel"],
        AUSTRALIA: ["Australia"],
        SINGAPORE: ["Singapore"],
      }
      const targets = countryMap[c] ?? [countryMatch[1]]
      results = results.filter((d) => targets.some((t) => (d.country ?? "").toLowerCase() === t.toLowerCase()))
      desc.push(`Country: ${targets[0]}`)
    }

    // Sorting
    if (q.includes("grow")) results.sort((a, b) => b.growthMetrics - a.growthMetrics)
    else if (q.includes("revenue") || q.includes("revenue")) results.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    else if (q.includes("fund")) results.sort((a, b) => b.totalFunding - a.totalFunding)
    else results.sort((a, b) => b.weightedScore - a.weightedScore)

    setQueryResults(results.slice(0, 12))
    setQueryDesc(desc.join(" · ") || "Sorted by score")
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Chat-style query */}
      <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-card/40">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-semibold text-sm">Ask the Data</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 'Series A startups with score > 4.2' or 'UK companies'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            className="h-9 text-sm"
          />
          <Button size="sm" className="h-9 px-4" onClick={handleQuery}>Ask</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Faster growing startups", "UK companies", "Score > 4.3", "Series A startups"].map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); setTimeout(handleQuery, 50) }}
              className="text-xs bg-muted/60 hover:bg-muted px-3 py-1 rounded-full border border-border/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        {queryResults && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Found {queryResults.length} matches</span>
              {queryDesc && <span>{queryDesc}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {queryResults.map((c) => (
                <div key={c.id} className="bg-background/60 border border-border/40 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold">{c.name}</span>
                    <span className="text-xs text-primary font-bold">{c.weightedScore?.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.latestFundingRound ?? c.startupLifecyclePhase ?? "N/A"} &middot; {formatCurrency(c.totalFunding)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pre-built views */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {VIEWS.map((view) => (
          <div
            key={view.id}
            className="border border-border/60 rounded-xl p-4 bg-card/40 flex flex-col gap-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold border border-primary/20">
                #{view.id}
              </span>
            </div>
            <div className="font-semibold text-sm leading-snug">{view.title}</div>
            <span className="text-xs font-mono bg-muted/60 px-2 py-0.5 rounded w-fit">{view.chart}</span>
            <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{view.description}</p>
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded p-2 text-xs">
              <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wide mr-1.5">Action</span>
              {view.action}
            </div>
            <Button
              size="sm"
              className="h-7 text-xs mt-auto"
              onClick={() => setActiveView(view)}
            >
              Generate View
            </Button>
          </div>
        ))}
      </div>

      {activeView && (
        <ResultModal
          view={activeView}
          companies={data}
          open={!!activeView}
          onClose={() => setActiveView(null)}
        />
      )}
    </div>
  )
}
