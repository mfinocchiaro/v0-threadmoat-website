"use client"

import React, { useEffect, useState, useMemo } from "react"
import { formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn, contrastTextColor } from "@/lib/utils"

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

interface FundingRecord {
  id: string
  company: string
  startupSizeCategory: string
  cloudModel: string
  aiIntensity: string
  aiIntensityScore: number
  totalFunding: number
  estimatedRevenue: number
  estimatedHeadcount: number
  arrPerEmployee: number
  cloudArrEfficiency: number
  cloudArrVsBenchmark: number
  capitalEfficiency: string
  cloudSaasMultiplier: number
  annualBurnProxy: number
  netBurnLevel: string
  enhancedBurnRate: string
  enhancedBurnPerEmployee: number
  runwayProxyMonths: number
  runwayQuality: string
  arrMultiple: number
  estimatedValuation: number
  fundingFloor: number
  estimatedValueFinal: number
  scoreFinancial: number
  financialConfidence: string
  valuationConfidence: string
  reportedValuation: string
  customerSignalScore: number
  weightedStartupQualityScore: number
}

interface FinancialHeatmapChartProps {
  className?: string
  filteredCompanyNames?: Set<string>
}

// ────────────────────────────────────────────────────────
// Column definitions — narrative flow, trimmed to 14 cols
//
// Story: WHO → RAW INPUTS → EFFICIENCY → BURN & RUNWAY → VALUATION → CONFIDENCE
//
// Cuts vs. previous 20-column version:
//   - Removed "vs $200K" (redundant with ARR/HC — can be inferred)
//   - Removed "Burn/mo" (absolute number, Burn Lvl + Adj. Burn cover health)
//   - Removed "Runway months" (Runway Quality covers the same signal qualitatively)
//   - Removed "AI Intensity" from grid (still in tooltip — not a financial metric)
//   - Removed "Funding Floor" (shown in tooltip — Valuation is the main signal)
//   - Removed "Size" (shown in tooltip — not core to financial story)
// ────────────────────────────────────────────────────────

type ColDef =
  | { type: "qual"; key: keyof FundingRecord; label: string; shortLabel: string; tip: string; levels: string[]; group: string }
  | { type: "num"; key: keyof FundingRecord; label: string; shortLabel: string; tip: string; format: (v: number) => string; higherIsGood: boolean; neutral?: boolean; group: string }
  | { type: "desc"; key: keyof FundingRecord; label: string; shortLabel: string; tip: string; levels: string[]; group: string }

function fmtCurrency(v: number): string {
  if (v >= 1e9) {
    const n = v / 1e9
    return n % 1 === 0 ? `$${n.toFixed(0)}B` : `$${n.toFixed(1)}B`
  }
  if (v >= 1e6) {
    const n = v / 1e6
    return n % 1 === 0 ? `$${n.toFixed(0)}M` : `$${n.toFixed(1)}M`
  }
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function fmtBurnPerMonth(annual: number): string {
  const monthly = annual / 12
  if (monthly >= 1e6) {
    const n = monthly / 1e6
    return n % 1 === 0 ? `$${n.toFixed(0)}M/mo` : `$${n.toFixed(1)}M/mo`
  }
  if (monthly >= 1e3) return `$${(monthly / 1e3).toFixed(0)}K/mo`
  return `$${monthly.toFixed(0)}/mo`
}

const COLUMNS: ColDef[] = [
  // ── IDENTITY ──
  { type: "desc", key: "cloudModel", label: "Cloud Model", shortLabel: "Cloud", group: "Identity",
    tip: "Delivery model: Cloud-Native, SaaS, Hybrid, Edge/HW, Traditional",
    levels: ["Cloud-Native", "SaaS", "Hybrid", "Edge/HW", "Traditional", "No Data"] },

  // ── RAW INPUTS ──
  { type: "num", key: "totalFunding", label: "Total Funding", shortLabel: "Funding", group: "Inputs",
    tip: "Total capital raised to date. Denominator for efficiency ratios.",
    format: fmtCurrency, higherIsGood: true, neutral: true },
  { type: "num", key: "estimatedRevenue", label: "Est. Revenue", shortLabel: "Revenue", group: "Inputs",
    tip: "Current estimated annual revenue (ARR proxy). Numerator for efficiency ratios.",
    format: fmtCurrency, higherIsGood: true, neutral: true },
  { type: "num", key: "estimatedHeadcount", label: "Headcount", shortLabel: "HC", group: "Inputs",
    tip: "Estimated employee count. Used to derive ARR/Employee and burn proxies.",
    format: (v: number) => v > 0 ? v.toFixed(0) : "—", higherIsGood: true, neutral: true },

  // ── EFFICIENCY ──
  { type: "num", key: "arrPerEmployee", label: "ARR / Employee", shortLabel: "ARR/HC", group: "Efficiency",
    tip: "= Revenue ÷ Headcount. BVP benchmark: $200K. >$300K = strong.",
    format: fmtCurrency, higherIsGood: true },
  { type: "num", key: "cloudArrEfficiency", label: "ARR Efficiency", shortLabel: "ARR Eff%", group: "Efficiency",
    tip: "= (Revenue ÷ Funding) × 100. How many cents of ARR per dollar raised. >100% = capital-efficient.",
    format: (v: number) => `${v.toFixed(0)}%`, higherIsGood: true },
  { type: "qual", key: "capitalEfficiency", label: "Capital Eff.", shortLabel: "Cap Eff", group: "Efficiency",
    tip: "Qualitative rating: how well funding converts to revenue.",
    levels: ["High", "Medium", "Low"] },

  // ── BURN & RUNWAY ──
  { type: "qual", key: "netBurnLevel", label: "Burn Level", shortLabel: "Burn", group: "Burn",
    tip: "Net burn as % of funding/year. Very Low (<5%) to Very High (60-80%).",
    levels: ["Very Low", "Low", "Moderate", "High", "Very High"] },
  { type: "qual", key: "enhancedBurnRate", label: "Adj. Burn", shortLabel: "Adj Burn", group: "Burn",
    tip: "Enhanced burn: HC + cloud infra + AI compute costs.",
    levels: ["Low", "Medium", "High", "Very High"] },
  { type: "qual", key: "runwayQuality", label: "Runway Quality", shortLabel: "Runway", group: "Burn",
    tip: "Very Strong (36+mo), Healthy (24-36), Comfortable (18-24), Tight (12-18), High Risk (6-12), Critical (<6).",
    levels: ["Very Strong", "Healthy", "Comfortable", "Tight", "High Risk", "Critical"] },

  // ── VALUATION ──
  { type: "num", key: "arrMultiple", label: "ARR Multiple", shortLabel: "Mult", group: "Valuation",
    tip: "Revenue multiple for valuation. Based on sector comps + growth signals.",
    format: (v: number) => v % 1 === 0 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`, higherIsGood: true },
  { type: "num", key: "estimatedValuation", label: "Valuation", shortLabel: "Value", group: "Valuation",
    tip: "= Revenue × ARR Multiple. Enterprise value estimate.",
    format: fmtCurrency, higherIsGood: true, neutral: true },

  // ── CONFIDENCE ──
  { type: "num", key: "scoreFinancial", label: "Fin. Score", shortLabel: "Score", group: "Confidence",
    tip: "Composite 0-40: revenue strength + burn sustainability + funding trajectory.",
    format: (v: number) => v > 0 ? v.toFixed(0) : "—", higherIsGood: true },
  { type: "qual", key: "financialConfidence", label: "Data Confidence", shortLabel: "Conf", group: "Confidence",
    tip: "Strong = verified; Medium = public estimates; Low = sparse data.",
    levels: ["Strong", "Medium", "Low"] },
  { type: "qual", key: "valuationConfidence", label: "Val. Confidence", shortLabel: "Val Conf", group: "Confidence",
    tip: "Confidence level of the valuation estimate: Reported, Inferred, or Estimated.",
    levels: ["Reported", "Inferred", "Estimated"] },
]

// ── Sort ──

type SortKey = "scoreFinancial" | "arrPerEmployee" | "annualBurnProxy" | "runwayProxyMonths"
  | "estimatedValuation" | "cloudArrEfficiency" | "cloudArrVsBenchmark" | "aiIntensityScore"
  | "totalFunding" | "estimatedRevenue"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "scoreFinancial",      label: "Financial Score" },
  { value: "estimatedValuation",  label: "Valuation" },
  { value: "totalFunding",        label: "Total Funding" },
  { value: "estimatedRevenue",    label: "Est. Revenue" },
  { value: "arrPerEmployee",      label: "ARR / Employee" },
  { value: "cloudArrEfficiency",  label: "ARR Efficiency %" },
  { value: "annualBurnProxy",     label: "Annual Burn" },
  { value: "runwayProxyMonths",   label: "Runway Months" },
]

const TOP_N_OPTIONS = [10, 15, 20, 30, 50]

// ────────────────────────────────────────────────────────
// Color ramps
// ────────────────────────────────────────────────────────

const RAMP_STOPS = ["#16a34a", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#dc2626"]

function rampColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (RAMP_STOPS.length - 1)
  const lo = Math.floor(scaled)
  const hi = Math.min(lo + 1, RAMP_STOPS.length - 1)
  return d3Interpolate(RAMP_STOPS[lo], RAMP_STOPS[hi], scaled - lo)
}

function qualColor(levelIndex: number, totalLevels: number): string {
  if (totalLevels <= 1) return RAMP_STOPS[0]
  return rampColor(levelIndex / (totalLevels - 1))
}

const NEUTRAL_STOPS = ["#1e3a5f", "#2563eb", "#60a5fa"]
function neutralColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (NEUTRAL_STOPS.length - 1)
  const lo = Math.floor(scaled)
  const hi = Math.min(lo + 1, NEUTRAL_STOPS.length - 1)
  return d3Interpolate(NEUTRAL_STOPS[lo], NEUTRAL_STOPS[hi], scaled - lo)
}

function descColor(levelIndex: number, totalLevels: number): string {
  if (totalLevels <= 1) return NEUTRAL_STOPS[1]
  return neutralColor(levelIndex / (totalLevels - 1))
}

// Simple RGB interpolation — no d3 dependency needed for just this
function d3Interpolate(a: string, b: string, t: number): string {
  const pa = hexToRgb(a), pb = hexToRgb(b)
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r},${g},${bl})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// Group header band colors
const GROUP_COLORS: Record<string, { bg: string; text: string }> = {
  Identity:   { bg: "bg-muted/60",            text: "text-muted-foreground" },
  Inputs:     { bg: "bg-blue-900/60",    text: "text-blue-200" },
  Efficiency: { bg: "bg-emerald-900/60", text: "text-emerald-200" },
  Burn:       { bg: "bg-amber-900/60",   text: "text-amber-200" },
  Valuation:  { bg: "bg-violet-900/60",  text: "text-violet-200" },
  Confidence: { bg: "bg-muted/60",            text: "text-muted-foreground" },
}

const GROUP_ORDER = ["Identity", "Inputs", "Efficiency", "Burn", "Valuation", "Confidence"]
const GROUP_LABELS: Record<string, string> = {
  Identity: "WHO",
  Inputs: "RAW INPUTS",
  Efficiency: "EFFICIENCY",
  Burn: "BURN & RUNWAY",
  Valuation: "VALUATION",
  Confidence: "CONFIDENCE",
}

// ────────────────────────────────────────────────────────
// Formula entries
// ────────────────────────────────────────────────────────

interface FormulaEntry { metric: string; formula: string; explanation: string }

const FORMULAS: FormulaEntry[] = [
  { metric: "ARR / Employee", formula: "Est. Revenue ÷ Headcount", explanation: "Revenue per person. BVP benchmark = $200K." },
  { metric: "ARR Efficiency", formula: "(Est. Revenue ÷ Total Funding) × 100", explanation: "Cents of ARR per dollar raised. >100% = capital-efficient." },
  { metric: "Valuation", formula: "Est. Revenue × ARR Multiple", explanation: "Enterprise value from revenue multiples." },
  { metric: "Funding Floor", formula: "Total Funding × post-money multiplier", explanation: "Minimum — worth at least what investors put in." },
]

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function contrastClass(bgColor: string): string {
  return contrastTextColor(bgColor) === '#fff' ? 'text-white' : 'text-gray-900'
}

function getCellStyle(col: ColDef, rec: FundingRecord, numScales: Map<string, { min: number; max: number }>): { bg: string; text: string } {
  const noData = { bg: "var(--muted, #1e293b)", text: "text-muted-foreground" }

  if (col.type === "qual") {
    const val = (rec[col.key] as string) || ""
    const levelIdx = col.levels.indexOf(val)
    if (levelIdx < 0 || !val) return noData
    const bg = qualColor(levelIdx, col.levels.length)
    return { bg, text: contrastClass(bg) }
  }

  if (col.type === "desc") {
    const val = (rec[col.key] as string) || ""
    const levelIdx = col.levels.indexOf(val)
    if (levelIdx < 0 || !val) return noData
    const bg = descColor(levelIdx, col.levels.length)
    return { bg, text: contrastClass(bg) }
  }

  // numeric
  const raw = (rec[col.key] as number) || 0
  if (raw === 0) return noData

  const scale = numScales.get(col.key as string)
  if (!scale || scale.max === 0) return noData
  const norm = Math.max(0, Math.min(1, raw / scale.max))

  if (col.neutral) {
    const bg = neutralColor(norm)
    return { bg, text: contrastClass(bg) }
  }
  const t = col.higherIsGood ? 1 - norm : norm
  const bg = rampColor(t)
  return { bg, text: contrastClass(bg) }
}

function getCellText(col: ColDef, rec: FundingRecord): string {
  if (col.type === "qual" || col.type === "desc") {
    return (rec[col.key] as string) || "—"
  }
  const raw = (rec[col.key] as number) || 0
  return raw > 0 ? col.format(raw) : "—"
}

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

export function FinancialHeatmapChart({ className, filteredCompanyNames }: FinancialHeatmapChartProps) {
  const [fundingData, setFundingData] = useState<FundingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>("scoreFinancial")
  const [topN, setTopN] = useState(15)
  const [cloudOnly, setCloudOnly] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/funding")
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setFundingData(result.data)
        else setError(result.error || "Failed to load funding data")
      })
      .catch(() => setError("Network error loading funding data"))
      .finally(() => setIsLoading(false))
  }, [])

  const ranked = useMemo(() => {
    let pool = fundingData
    if (filteredCompanyNames && filteredCompanyNames.size > 0) {
      pool = pool.filter((r) => filteredCompanyNames.has(r.company))
    }
    if (cloudOnly) {
      pool = pool.filter((r) => r.cloudModel === "Cloud-Native" || r.cloudModel === "SaaS")
    }
    return [...pool]
      .filter((r) => (r[sortBy] as number) > 0)
      .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
      .slice(0, topN)
  }, [fundingData, filteredCompanyNames, sortBy, topN, cloudOnly])

  const numScales = useMemo(() => {
    const scales: Map<string, { min: number; max: number }> = new Map()
    for (const col of COLUMNS) {
      if (col.type === "num") {
        let max = 0
        for (const r of ranked) {
          const v = (r[col.key] as number) || 0
          if (v > max) max = v
        }
        scales.set(col.key as string, { min: 0, max: max || 1 })
      }
    }
    return scales
  }, [ranked])

  if (isLoading) {
    return (
      <Card className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <p className="text-sm text-muted-foreground">Loading financial data…</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    )
  }

  // Group columns for the header band
  const groupedCols: { group: string; cols: ColDef[] }[] = []
  for (const gid of GROUP_ORDER) {
    const cols = COLUMNS.filter(c => c.group === gid)
    if (cols.length > 0) groupedCols.push({ group: gid, cols })
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      {/* ── Controls ── */}
      <div className="flex flex-wrap gap-4 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Show top</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={cloudOnly}
            onChange={(e) => setCloudOnly(e.target.checked)}
            className="rounded"
          />
          Cloud &amp; SaaS only
        </label>
        <span className="text-xs text-muted-foreground ml-auto">
          {ranked.length} of {fundingData.length} startups
        </span>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 w-full min-h-0 overflow-x-auto">
        <table className="w-full border-collapse text-xs" style={{ minWidth: "1100px" }}>
          {/* Group header band */}
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-background" style={{ minWidth: "180px" }} />
              {groupedCols.map(({ group, cols }) => {
                const colors = GROUP_COLORS[group]
                return (
                  <th
                    key={group}
                    colSpan={cols.length}
                    className={cn(
                      "text-center text-[11px] font-bold tracking-wider py-1.5 px-1",
                      colors.bg, colors.text
                    )}
                  >
                    {GROUP_LABELS[group]}
                  </th>
                )
              })}
            </tr>
            {/* Column headers */}
            <tr className="border-b border-border/50">
              <th className="sticky left-0 z-20 bg-background text-left text-muted-foreground font-semibold py-2 px-3" style={{ minWidth: "180px" }}>
                Company
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="text-center text-muted-foreground font-semibold py-2 px-1 whitespace-nowrap cursor-help"
                  title={col.tip}
                  style={{ minWidth: "80px" }}
                >
                  {col.shortLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((rec, rowIdx) => (
              <tr
                key={rec.id}
                className={cn(
                  "transition-colors",
                  rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20",
                  hoveredRow === rec.id && "!bg-muted/40"
                )}
                onMouseEnter={() => setHoveredRow(rec.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Sticky company name column */}
                <td
                  className={cn(
                    "sticky left-0 z-10 font-semibold text-sm py-2 px-3 whitespace-nowrap",
                    rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20",
                    hoveredRow === rec.id && "!bg-muted/40",
                    "text-foreground"
                  )}
                >
                  {rec.company}
                </td>
                {COLUMNS.map((col) => {
                  const style = getCellStyle(col, rec, numScales)
                  const text = getCellText(col, rec)
                  return (
                    <td
                      key={col.key}
                      className="py-1.5 px-1 text-center"
                      title={`${col.label}: ${text}`}
                    >
                      <span
                        className={cn(
                          "inline-block w-full rounded px-1.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                          style.text
                        )}
                        style={{ backgroundColor: style.bg }}
                      >
                        {text}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Hover detail (appears below table when a row is hovered) ── */}
      {hoveredRow && (() => {
        const rec = ranked.find(r => r.id === hoveredRow)
        if (!rec) return null
        return (
          <div className="border-t border-border px-4 py-3 bg-muted/30 text-xs leading-relaxed grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5">
            <div className="col-span-2 md:col-span-4 font-semibold text-sm text-foreground mb-1">{rec.company}</div>

            <div><span className="text-muted-foreground">Size:</span> <strong>{rec.startupSizeCategory || "—"}</strong></div>
            <div><span className="text-muted-foreground">AI:</span> <strong>{rec.aiIntensity || "—"}</strong> ({rec.aiIntensityScore})</div>
            <div><span className="text-muted-foreground">Cloud:</span> <strong>{rec.cloudModel}</strong></div>
            <div><span className="text-muted-foreground">Multiplier:</span> <strong>{rec.cloudSaasMultiplier}x</strong></div>

            <div><span className="text-muted-foreground">Funding:</span> <strong>{formatCurrency(rec.totalFunding)}</strong></div>
            <div><span className="text-muted-foreground">Revenue:</span> <strong>{formatCurrency(rec.estimatedRevenue)}</strong></div>
            <div><span className="text-muted-foreground">Headcount:</span> <strong>{rec.estimatedHeadcount > 0 ? rec.estimatedHeadcount : "—"}</strong></div>
            <div><span className="text-muted-foreground">ARR/HC:</span> <strong>{formatCurrency(rec.arrPerEmployee)}</strong></div>

            <div><span className="text-muted-foreground">ARR Eff:</span> <strong>{rec.cloudArrEfficiency.toFixed(0)}%</strong> <span className="text-muted-foreground/70">= Rev÷Fund×100</span></div>
            <div><span className="text-muted-foreground">vs $200K:</span> <strong>{rec.cloudArrVsBenchmark.toFixed(0)}%</strong></div>
            <div><span className="text-muted-foreground">Cap Eff:</span> <strong>{rec.capitalEfficiency || "—"}</strong></div>
            <div><span className="text-muted-foreground">Burn/mo:</span> <strong>{fmtBurnPerMonth(rec.annualBurnProxy)}</strong></div>

            <div><span className="text-muted-foreground">Burn Lvl:</span> <strong>{rec.netBurnLevel || "—"}</strong></div>
            <div><span className="text-muted-foreground">Adj Burn:</span> <strong>{rec.enhancedBurnRate || "—"}</strong></div>
            <div><span className="text-muted-foreground">Runway:</span> <strong>{rec.runwayProxyMonths >= 999 ? "∞" : `${rec.runwayProxyMonths.toFixed(0)}mo`}</strong></div>
            <div><span className="text-muted-foreground">Run. Qual:</span> <strong>{rec.runwayQuality || "—"}</strong></div>

            <div><span className="text-muted-foreground">ARR Mult:</span> <strong>{rec.arrMultiple % 1 === 0 ? rec.arrMultiple.toFixed(0) : rec.arrMultiple.toFixed(1)}x</strong></div>
            <div><span className="text-muted-foreground">Valuation:</span> <strong>{formatCurrency(rec.estimatedValuation)}</strong> <span className="text-muted-foreground/70">= Rev×{rec.arrMultiple % 1 === 0 ? rec.arrMultiple.toFixed(0) : rec.arrMultiple.toFixed(1)}x</span></div>
            <div><span className="text-muted-foreground">Floor:</span> <strong>{formatCurrency(rec.fundingFloor)}</strong></div>
            <div><span className="text-muted-foreground">Score:</span> <strong>{rec.scoreFinancial}/40</strong> · Conf: <strong>{rec.financialConfidence}</strong></div>
          </div>
        )
      })()}

      {/* ── Reading guide ── */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-foreground">How to Read This Chart</h4>
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showFormulas ? "Hide formulas ▲" : "Show formulas ▼"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Read left to right: <strong className="text-foreground">Identity</strong> (who) →{" "}
          <strong className="text-blue-400">Raw Inputs</strong> (funding, revenue, headcount) →{" "}
          <strong className="text-green-400">Efficiency</strong> (how well capital converts to revenue) →{" "}
          <strong className="text-amber-400">Burn &amp; Runway</strong> (cash sustainability) →{" "}
          <strong className="text-purple-400">Valuation</strong> (what it&apos;s worth) →{" "}
          <strong className="text-muted-foreground">Confidence</strong> (how reliable the data is).
          Hover any row for full details including formulas.
        </p>

        <div className="flex flex-wrap gap-4 mb-2">
          <span className="text-xs font-medium text-foreground mr-1">Health columns:</span>
          <span className="text-xs"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: "#16a34a" }} />Green = strong</span>
          <span className="text-xs"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: "#eab308" }} />Yellow = moderate</span>
          <span className="text-xs"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: "#ef4444" }} />Red = weak</span>
          <span className="text-xs font-medium text-foreground ml-2 mr-1">Neutral columns:</span>
          <span className="text-xs"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: "#2563eb" }} />Blue = magnitude (no judgment)</span>
          <span className="text-xs"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: "var(--muted, #1e293b)" }} />Dark = no data</span>
        </div>

        {showFormulas && (
          <div className="border-t border-border/50 pt-3 mt-1">
            <h5 className="text-xs font-semibold text-foreground mb-2">Calculation Logic</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {FORMULAS.map((f) => (
                <div key={f.metric}>
                  <span className="font-semibold text-foreground">{f.metric}</span>
                  <span className="text-blue-400 ml-2 font-mono text-[11px]">= {f.formula}</span>
                  <br />
                  <span className="text-muted-foreground">{f.explanation}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
              <strong className="text-foreground">Sources:</strong>{" "}
              <span className="text-green-400">●</span> Health ratings = Airtable qualitative assessments{" "}
              <span className="text-blue-400">●</span> Blue metrics = derived from numeric fields{" "}
              <span className="text-muted-foreground">●</span> Confidence = data quality rating
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
