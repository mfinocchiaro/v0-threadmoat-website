"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GrowthMomentumChartProps {
  data: Company[]
  className?: string
  shortlistedIds?: Set<string>
  onCellClick?: (label: string, companyIds: string[]) => void
}

type YAxisKey = "industriesServed" | "investmentTheses" | "workflowSegment"

const Y_AXES: { value: YAxisKey; label: string }[] = [
  { value: "industriesServed", label: "Industries Served" },
  { value: "investmentTheses", label: "Investment Thesis" },
  { value: "workflowSegment", label: "Workflow Segment" },
]

const TIER_ORDER = ["Accelerating", "High Growth", "Steady", "Early/Pre-revenue", "Stalled", "Unknown"]

function getYValues(company: Company, yAxis: YAxisKey): string[] {
  if (yAxis === "industriesServed") {
    return company.industriesServed.length > 0 ? company.industriesServed : ["Unknown"]
  }
  if (yAxis === "investmentTheses") {
    return company.investmentTheses.length > 0 ? company.investmentTheses : ["Unclassified"]
  }
  if (yAxis === "workflowSegment") {
    const val = company.workflowSegment?.trim()
    return val ? [val] : ["Unknown"]
  }
  return ["Unknown"]
}

interface CellData {
  tier: string
  yGroup: string
  count: number
  avgFunding: number
  companies: { name: string; id: string }[]
}

export function GrowthMomentumChart({ data, className, shortlistedIds, onCellClick }: GrowthMomentumChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [yAxis, setYAxis] = useState<YAxisKey>("industriesServed")

  const { cells, tiers, yGroups, cellLookup } = useMemo(() => {
    const cellMap = new Map<string, CellData>()

    for (const company of data) {
      const tier = company.growthMomentumTier || "Unknown"
      const yValues = getYValues(company, yAxis)

      for (const yVal of yValues) {
        const key = `${tier}|||${yVal}`
        const existing = cellMap.get(key)
        if (existing) {
          existing.count++
          existing.avgFunding += company.totalFunding || 0
          existing.companies.push({ name: company.name, id: company.id })
        } else {
          cellMap.set(key, {
            tier, yGroup: yVal, count: 1,
            avgFunding: company.totalFunding || 0,
            companies: [{ name: company.name, id: company.id }],
          })
        }
      }
    }

    for (const cell of cellMap.values()) {
      cell.avgFunding = cell.count > 0 ? cell.avgFunding / cell.count : 0
    }

    const allCells = Array.from(cellMap.values())
    const usedTiers = TIER_ORDER.filter(t => allCells.some(c => c.tier === t))

    const yGroupCounts = new Map<string, number>()
    for (const c of allCells) yGroupCounts.set(c.yGroup, (yGroupCounts.get(c.yGroup) || 0) + c.count)
    const sortedYGroups = Array.from(yGroupCounts.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name)

    const lookup = new Map<string, CellData>()
    for (const cell of allCells) lookup.set(`${cell.tier}|||${cell.yGroup}`, cell)

    return { cells: allCells, tiers: usedTiers, yGroups: sortedYGroups, cellLookup: lookup }
  }, [data, yAxis])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || cells.length === 0) return

    const width = containerRef.current.clientWidth
    if (!width) return

    const rootStyle = getComputedStyle(containerRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#64748b'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#1e293b'
    const fgColor = rootStyle.getPropertyValue('--foreground').trim() || '#f1f5f9'

    const margin = { top: 10, right: 30, bottom: 100, left: 200 }
    const cellSize = Math.max(28, Math.min(50, (width - margin.left - margin.right) / tiers.length))
    const innerWidth = tiers.length * cellSize
    const innerHeight = yGroups.length * cellSize
    const height = innerHeight + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", margin.left + innerWidth + margin.right).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleBand<string>().domain(tiers).range([0, innerWidth]).padding(0.06)
    const yScale = d3.scaleBand<string>().domain(yGroups).range([0, innerHeight]).padding(0.06)

    const maxVal = d3.max(cells, c => c.count) || 1
    const colorScale = d3.scaleSequential(d3.interpolateYlGn).domain([0, maxVal])

    for (const tier of tiers) {
      for (const yGroup of yGroups) {
        const cell = cellLookup.get(`${tier}|||${yGroup}`)
        const x = xScale(tier) ?? 0
        const y = yScale(yGroup) ?? 0
        const w = xScale.bandwidth()
        const h = yScale.bandwidth()

        if (!cell) {
          g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h)
            .attr("fill", "color-mix(in srgb, var(--muted-foreground) 8%, transparent)")
            .attr("stroke", "color-mix(in srgb, var(--muted-foreground) 15%, transparent)")
            .attr("stroke-width", 0.5).attr("rx", 2)
          continue
        }

        const hasShortlisted = shortlistedIds && cell.companies.some(c => shortlistedIds.has(c.id))
        const fundingStr = `$${(cell.avgFunding / 1_000_000).toFixed(1)}M`

        g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h)
          .attr("fill", colorScale(cell.count))
          .attr("stroke", hasShortlisted ? "#f59e0b" : borderColor)
          .attr("stroke-width", hasShortlisted ? 2.5 : 0.5)
          .attr("rx", 2)
          .style("cursor", "pointer")
          .on("click", () => {
            onCellClick?.(`${cell.tier} × ${cell.yGroup}`, cell.companies.map(c => c.id))
          })
          .on("mouseover", (event) => {
            if (!tooltipRef.current) return
            const shortlistedNames = shortlistedIds
              ? cell.companies.filter(c => shortlistedIds.has(c.id)).map(c => c.name) : []
            tooltipRef.current.style.visibility = "visible"
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
            tooltipRef.current.innerHTML = [
              `<strong>${cell.tier}</strong> × <strong>${cell.yGroup}</strong>`,
              `Startups: ${cell.count}`,
              `Avg Funding: ${fundingStr}`,
              shortlistedNames.length > 0 ? `<br><span style="color:#f59e0b">★ ${shortlistedNames.join(", ")}</span>` : "",
              cell.count <= 8 ? `<br><span style="opacity:0.6">${cell.companies.map(c => c.name).join(", ")}</span>` : "",
            ].filter(Boolean).join("<br>")
          })
          .on("mousemove", (event) => {
            if (!tooltipRef.current) return
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
          })
          .on("mouseout", () => { if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden" })

        if (w > 20 && h > 16) {
          g.append("text").attr("x", x + w / 2).attr("y", y + h / 2)
            .attr("text-anchor", "middle").attr("dominant-baseline", "central")
            .attr("fill", cell.count > maxVal * 0.6 ? fgColor : axisColor)
            .attr("font-size", "10px").attr("font-weight", "500").attr("pointer-events", "none")
            .text(String(cell.count))
        }
      }
    }

    g.append("g").attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)).selectAll("text")
      .style("text-anchor", "end").attr("dx", "-.8em").attr("dy", ".15em")
      .attr("transform", "rotate(-35)").attr("fill", axisColor).style("font-size", "10px")

    g.append("g").call(d3.axisLeft(yScale)).selectAll("text")
      .attr("fill", axisColor).style("font-size", "10px")

    g.selectAll(".domain").remove()
    g.selectAll(".tick line").remove()

    const legendWidth = 140
    const legendG = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth - legendWidth - 10},${height - 25})`)
    const defs = svg.append("defs")
    const grad = defs.append("linearGradient").attr("id", "growth-momentum-legend-grad")
    ;[0, 0.25, 0.5, 0.75, 1].forEach(s => {
      grad.append("stop").attr("offset", `${s * 100}%`).attr("stop-color", d3.interpolateYlGn(s))
    })
    legendG.append("rect").attr("width", legendWidth).attr("height", 8)
      .attr("fill", "url(#growth-momentum-legend-grad)").attr("rx", 2)
    legendG.append("text").attr("x", 0).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").text("0")
    legendG.append("text").attr("x", legendWidth).attr("y", 20).attr("fill", axisColor)
      .attr("font-size", "9px").attr("text-anchor", "end").text(`${Math.round(maxVal)} startups`)
  }, [cells, cellLookup, tiers, yGroups, shortlistedIds, onCellClick])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows</label>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value as YAxisKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1">
            {Y_AXES.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground">
          {tiers.length} momentum tiers × {yGroups.length} groups
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 overflow-auto">
        <svg ref={svgRef} className="w-full" />
        <div ref={tooltipRef} style={{
          position: "fixed", visibility: "hidden",
          background: "var(--popover, #1e293b)", border: "1px solid var(--border, #334155)",
          borderRadius: "6px", padding: "8px 12px", fontSize: "12px",
          color: "var(--popover-foreground, #f1f5f9)", pointerEvents: "none",
          zIndex: 9999, maxWidth: "320px",
        }} />
      </div>
    </Card>
  )
}
