"use client"

import { useEffect, useRef, useState } from "react"
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

export function InvestorStatsChart({ data, className }: InvestorStatsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("byCategory")
  const [sortBy, setSortBy] = useState<"totalFunding" | "count" | "avgScore">("totalFunding")
  const [topN, setTopN] = useState<number>(20)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const margin = { top: 30, right: 120, bottom: 100, left: 220 }
    const barHeight = 28
    const barPad = 6

    // Build groups
    const groupMap = new Map<string, BarEntry>()

    data.forEach((company) => {
      let keys: string[] = []
      if (viewMode === "byInvestor") {
        keys = company.investors ?? []
        if (keys.length === 0) keys = ["Unknown"]
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
      "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
      "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
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
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")

    g.selectAll(".domain, .tick line").attr("stroke", "#334155")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
      .attr("fill", "#e2e8f0")
      .attr("font-size", 11)
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
      .attr("stroke", "#1e293b")
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
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
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
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="30">Top 30</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div ref={containerRef} className="relative w-full overflow-y-auto max-h-[700px]">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  )
}
