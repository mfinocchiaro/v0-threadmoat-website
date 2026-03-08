"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"
import { formatCurrency } from "@/lib/company-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type ViewMode = "byInvestor" | "byCategory" | "byCountry" | "byRound"

interface InvestorStatsChartProps {
  data: Company[]
  className?: string
}

interface BarEntry {
  label: string
  totalFunding: number
  count: number
  avgScore: number
}

// ── Shared donut color palette ────────────────────────────────────────────────
const DONUT_COLORS = [
  "#2E6DB4", "#2BBFB3", "#D45500", "#F4B400",
  "#D642A6", "#0B7A20", "#7A3FD1", "#8FB3E8",
  "#F2B38B", "#7EC8E3", "#6B7280",
]

interface DonutSlice { label: string; value: number }

// ── Reusable donut chart ──────────────────────────────────────────────────────
function DonutChart({ slices, title }: { slices: DonutSlice[]; title: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const SIZE = 180
  const OUTER_R = 68
  const INNER_R = 40

  // Deterministic color map (index order matches D3 ordinal)
  const colorMap = useMemo(
    () => Object.fromEntries(slices.map((s, i) => [s.label, DONUT_COLORS[i % DONUT_COLORS.length]])),
    [slices],
  )
  const total = useMemo(() => slices.reduce((s, d) => s + d.value, 0), [slices])
  const top6 = useMemo(() => [...slices].sort((a, b) => b.value - a.value).slice(0, 6), [slices])

  useEffect(() => {
    if (!svgRef.current || slices.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", SIZE).attr("height", SIZE)

    const g = svg.append("g").attr("transform", `translate(${SIZE / 2},${SIZE / 2})`)

    const pie = d3.pie<DonutSlice>().value(d => d.value).sort(null)
    const arc = d3.arc<d3.PieArcDatum<DonutSlice>>().innerRadius(INNER_R).outerRadius(OUTER_R)

    const tooltip = d3.select("body").append("div")
      .attr("class", "donut-tip")
      .style("position", "fixed")
      .style("background", "rgba(15,23,42,0.95)")
      .style("border", "1px solid #334155")
      .style("border-radius", "6px")
      .style("padding", "6px 10px")
      .style("font-size", "12px")
      .style("color", "#f1f5f9")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")

    g.selectAll("path")
      .data(pie(slices))
      .join("path")
      .attr("d", arc as never)
      .attr("fill", d => colorMap[d.data.label])
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 1)
      .on("mouseover", function (_, d) {
        d3.select(this).attr("opacity", 0.75)
        tooltip.style("opacity", "1").html(
          `<strong>${d.data.label}</strong><br>${d.data.value} co. &nbsp;(${Math.round((d.data.value / total) * 100)}%)`
        )
      })
      .on("mousemove", (ev: MouseEvent) => {
        tooltip.style("left", `${ev.clientX + 12}px`).style("top", `${ev.clientY - 10}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1)
        tooltip.style("opacity", "0")
      })

    // Center: total count
    g.append("text")
      .attr("text-anchor", "middle").attr("dy", "-0.1em")
      .attr("font-size", 20).attr("font-weight", "700").attr("fill", "#cbd5e1")
      .text(total)
    g.append("text")
      .attr("text-anchor", "middle").attr("dy", "1.2em")
      .attr("font-size", 9).attr("fill", "#64748b")
      .text("companies")

    return () => { d3.selectAll(".donut-tip").remove() }
  }, [slices, colorMap, total])

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{title}</p>
      <svg ref={svgRef} />
      <div className="space-y-1 w-full max-w-[180px]">
        {top6.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="size-2.5 rounded-sm shrink-0"
              style={{ background: colorMap[s.label] }}
            />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
        {slices.length > 6 && (
          <p className="text-[10px] text-muted-foreground pl-4">+{slices.length - 6} more</p>
        )}
      </div>
    </div>
  )
}

// ── Funding donut grid (A + B combined) ──────────────────────────────────────
interface FundingRecord {
  cloudModel: string
  capitalEfficiency: string
}

function FundingDonuts({ data }: { data: Company[] }) {
  const [fundingData, setFundingData] = useState<FundingRecord[]>([])

  useEffect(() => {
    fetch("/api/funding")
      .then(r => r.json())
      .then(json => { if (json.success) setFundingData(json.data) })
      .catch(() => {})
  }, [])

  // Option A — from company data
  const byRound = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, number>()
    data.forEach(c => {
      const key = (c.latestFundingRound || c.startupLifecyclePhase || "").trim()
      if (!key || key.toLowerCase() === "unknown") return
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const byCategory = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, number>()
    data.forEach(c => {
      const key = (c.investmentList || "Other").replace(/^\d+-/, "").trim()
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  // Option B — from /api/funding
  const byCloudModel = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, number>()
    fundingData.forEach(r => {
      const key = r.cloudModel || "Unknown"
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [fundingData])

  const byCapEfficiency = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, number>()
    fundingData.forEach(r => {
      const key = (r.capitalEfficiency || "").trim()
      if (!key || key.toLowerCase() === "unknown") return
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [fundingData])

  return (
    <div className="pt-6 border-t space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Distribution Breakdown
        </h3>
        <span className="text-[10px] text-muted-foreground">
          · A: company data &nbsp;|&nbsp; B: financial health data
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
        <DonutChart slices={byRound} title="Funding Round" />
        <DonutChart slices={byCategory} title="Investment Category" />
        <DonutChart slices={byCloudModel} title="Cloud Model" />
        <DonutChart slices={byCapEfficiency} title="Capital Efficiency" />
      </div>
    </div>
  )
}

// ── Main bar chart ────────────────────────────────────────────────────────────
export function InvestorStatsChart({ data, className }: InvestorStatsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("byCategory")
  const [sortBy, setSortBy] = useState<"totalFunding" | "count" | "avgScore">("totalFunding")
  const [topN, setTopN] = useState<number>(10)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const margin = { top: 30, right: 140, bottom: 100, left: 280 }
    const barHeight = 36
    const barPad = 8

    // Build groups
    const groupMap = new Map<string, BarEntry>()

    data.forEach((company) => {
      let keys: string[] = []
      const EXCLUDED = ["bootstrapped", "angel funded", "undisclosed", "unknown", "n a", "n/a"]
      if (viewMode === "byInvestor") {
        keys = (company.investors ?? []).filter((inv) => !EXCLUDED.includes(inv.toLowerCase().trim()))
        if (keys.length === 0) return
      } else if (viewMode === "byCategory") {
        keys = [(company.investmentList || "Other").replace(/^\d+-/, "").trim()]
      } else if (viewMode === "byCountry") {
        keys = [company.country || "Unknown"]
      } else {
        keys = [company.startupLifecyclePhase || company.latestFundingRound || "Unknown"]
      }

      keys.forEach((key) => {
        const label = key.trim() || "Unknown"
        const existing = groupMap.get(label) ?? { label, totalFunding: 0, count: 0, avgScore: 0 }
        existing.totalFunding += company.totalFunding || 0
        existing.count += 1
        existing.avgScore += company.weightedScore || 0
        groupMap.set(label, existing)
      })
    })

    // Finalize avg scores
    groupMap.forEach((entry) => {
      entry.avgScore = entry.count > 0 ? entry.avgScore / entry.count : 0
    })

    let entries = Array.from(groupMap.values())
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, topN)

    // Re-sort ascending for horizontal bar chart (bottom = largest)
    entries = entries.reverse()

    const height = entries.length * (barHeight + barPad) + margin.top + margin.bottom
    const innerWidth = width - margin.left - margin.right
    const innerHeight = entries.length * (barHeight + barPad)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xMax = d3.max(entries, (d) => d[sortBy]) ?? 1
    const xScale = d3.scaleLinear().domain([0, xMax]).range([0, innerWidth])
    const yScale = d3.scaleBand()
      .domain(entries.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.2)

    const COLORS = [
      "#2E6DB4", "#8FB3E8", "#2BBFB3", "#D45500",
      "#F4B400", "#F2B38B", "#D642A6", "#7EC8E3",
      "#0B7A20", "#7A3FD1", "#7C3AED",
    ]
    const colorScale = d3.scaleOrdinal(COLORS).domain(entries.map((d) => d.label))

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "investor-stats-tooltip")
      .style("position", "fixed")
      .style("background", "rgba(15,23,42,0.95)")
      .style("border", "1px solid #334155")
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("color", "#f1f5f9")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(5)
          .tickFormat((v) => {
            if (sortBy === "totalFunding") return formatCurrency(v as number)
            if (sortBy === "avgScore") return (v as number).toFixed(1)
            return String(v)
          })
      )
      .selectAll("text")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 14)
      .attr("font-weight", "600")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")

    g.selectAll(".domain, .tick line").attr("stroke", "#334155")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 18)
      .attr("font-weight", "600")
      .each(function () {
        const el = d3.select(this)
        const text = el.text()
        if (text.length > 26) el.text(text.slice(0, 24) + "…")
      })

    g.select(".domain").remove()

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickFormat(() => ""))
      .attr("transform", `translate(0,${innerHeight})`)
      .selectAll("line")
      .attr("stroke", "#334155")
      .attr("stroke-dasharray", "3,3")
    g.select(".grid .domain").remove()

    // Bars
    g.selectAll("rect.bar")
      .data(entries)
      .join("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.label) ?? 0)
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", (d) => colorScale(d.label))
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("filter", "brightness(1.2)")
        tooltip.style("opacity", "1").html(
          `<strong>${d.label}</strong><br>Companies: ${d.count}<br>Total Funding: ${formatCurrency(d.totalFunding)}<br>Avg Score: ${d.avgScore.toFixed(2)}`
        )
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 10}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("filter", null)
        tooltip.style("opacity", "0")
      })
      .transition()
      .duration(600)
      .delay((_, i) => i * 20)
      .attr("width", (d) => xScale(d[sortBy]))

    // Value labels
    g.selectAll("text.val-lbl")
      .data(entries)
      .join("text")
      .attr("class", "val-lbl")
      .attr("y", (d) => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
      .attr("x", (d) => xScale(d[sortBy]) + 6)
      .attr("dominant-baseline", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 14)
      .attr("font-weight", "600")
      .text((d) => {
        if (sortBy === "totalFunding") return formatCurrency(d[sortBy])
        if (sortBy === "avgScore") return d[sortBy].toFixed(2)
        return String(d[sortBy])
      })

    return () => {
      d3.selectAll(".investor-stats-tooltip").remove()
    }
  }, [data, viewMode, sortBy, topN])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Group by</Label>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="byCategory">Investment Category</SelectItem>
              <SelectItem value="byCountry">Country</SelectItem>
              <SelectItem value="byRound">Funding Round</SelectItem>
              <SelectItem value="byInvestor">Top Investors</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalFunding">Total Funding</SelectItem>
              <SelectItem value="count">Company Count</SelectItem>
              <SelectItem value="avgScore">Avg Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Show top</Label>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="25">Top 25</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div ref={containerRef} className="relative w-full overflow-y-auto max-h-[700px]">
        <svg ref={svgRef} className="w-full" />
      </div>

      <FundingDonuts data={data} />
    </div>
  )
}
