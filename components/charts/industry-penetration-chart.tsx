"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { parseKnownCustomers } from "@/lib/customer-logos"
import { Card } from "@/components/ui/card"
import { cn, contrastTextColor } from "@/lib/utils"

interface IndustryPenetrationChartProps {
  data: Company[]
  className?: string
  shortlistedIds?: Set<string>
  onCellClick?: (label: string, companyIds: string[]) => void
}

type YAxisKey = "investmentTheses" | "workflowSegment" | "manufacturingType"

const Y_AXES: { value: YAxisKey; label: string }[] = [
  { value: "investmentTheses", label: "Investment Thesis" },
  { value: "workflowSegment", label: "Workflow Segment" },
  { value: "manufacturingType", label: "Manufacturing Type" },
]

type ValueMode = "count" | "avgScore" | "avgFunding" | "customerCount"
const VALUE_MODES: { value: ValueMode; label: string }[] = [
  { value: "count", label: "Startup Count" },
  { value: "avgScore", label: "Avg. Weighted Score" },
  { value: "avgFunding", label: "Avg. Funding ($M)" },
  { value: "customerCount", label: "Customer Count" },
]

interface CellData {
  industry: string
  yGroup: string
  count: number
  avgScore: number
  avgFunding: number
  customerCount: number
  companies: { name: string; id: string }[]
}

function getYValues(company: Company, yAxis: YAxisKey): string[] {
  if (yAxis === "investmentTheses") {
    return company.investmentTheses.length > 0 ? company.investmentTheses : ["Unclassified"]
  }
  if (yAxis === "workflowSegment") {
    const val = company.workflowSegment?.trim()
    return val ? [val] : ["Unknown"]
  }
  if (yAxis === "manufacturingType") {
    const val = company.manufacturingType?.trim()
    if (!val) return ["Unknown"]
    // manufacturingType can be a Python list string or comma-separated
    const parsed = val.replace(/[\[\]']/g, "").split(",").map(s => s.trim()).filter(Boolean)
    return parsed.length > 0 ? parsed : ["Unknown"]
  }
  return ["Unknown"]
}

export function IndustryPenetrationChart({ data, className, shortlistedIds, onCellClick }: IndustryPenetrationChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [yAxis, setYAxis] = useState<YAxisKey>("investmentTheses")
  const [valueMode, setValueMode] = useState<ValueMode>("count")

  // Build cell data
  const { cells, industries, yGroups } = useMemo(() => {
    const cellMap = new Map<string, CellData>()

    for (const company of data) {
      const companyIndustries = company.industriesServed.length > 0 ? company.industriesServed : ["Unknown"]
      const yValues = getYValues(company, yAxis)

      for (const industry of companyIndustries) {
        for (const yVal of yValues) {
          const key = `${industry}|||${yVal}`
          const existing = cellMap.get(key)
          const custCount = parseKnownCustomers(company.knownCustomers).length
          if (existing) {
            existing.count++
            existing.avgScore += company.weightedScore || 0
            existing.avgFunding += company.totalFunding || 0
            existing.customerCount += custCount
            existing.companies.push({ name: company.name, id: company.id })
          } else {
            cellMap.set(key, {
              industry,
              yGroup: yVal,
              count: 1,
              avgScore: company.weightedScore || 0,
              avgFunding: company.totalFunding || 0,
              customerCount: custCount,
              companies: [{ name: company.name, id: company.id }],
            })
          }
        }
      }
    }

    // Compute averages
    for (const cell of cellMap.values()) {
      cell.avgScore = cell.count > 0 ? cell.avgScore / cell.count : 0
      cell.avgFunding = cell.count > 0 ? cell.avgFunding / cell.count : 0
    }

    const allCells = Array.from(cellMap.values())
    // Sort industries by total count descending
    const industryCounts = new Map<string, number>()
    for (const c of allCells) {
      industryCounts.set(c.industry, (industryCounts.get(c.industry) || 0) + c.count)
    }
    const sortedIndustries = Array.from(industryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    // Sort Y groups by total count descending
    const yGroupCounts = new Map<string, number>()
    for (const c of allCells) {
      yGroupCounts.set(c.yGroup, (yGroupCounts.get(c.yGroup) || 0) + c.count)
    }
    const sortedYGroups = Array.from(yGroupCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    return { cells: allCells, industries: sortedIndustries, yGroups: sortedYGroups }
  }, [data, yAxis])

  // Build lookup
  const cellLookup = useMemo(() => {
    const map = new Map<string, CellData>()
    for (const cell of cells) {
      map.set(`${cell.industry}|||${cell.yGroup}`, cell)
    }
    return map
  }, [cells])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || cells.length === 0) return

    const width = containerRef.current.clientWidth
    if (!width) return

    // Theme-aware colors from CSS custom properties
    // Values are already complete color functions (e.g. oklch(0.45 0.05 270))
    const rootStyle = getComputedStyle(containerRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#64748b'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#1e293b'
    const fgColor = rootStyle.getPropertyValue('--foreground').trim() || '#f1f5f9'
    const emptyBg = 'color-mix(in srgb, var(--muted-foreground) 8%, transparent)'
    const emptyStroke = 'color-mix(in srgb, var(--muted-foreground) 15%, transparent)'

    const margin = { top: 10, right: 30, bottom: 140, left: 200 }
    const cellSize = Math.max(28, Math.min(40, (width - margin.left - margin.right) / industries.length))
    const innerWidth = industries.length * cellSize
    const innerHeight = yGroups.length * cellSize
    const height = innerHeight + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", margin.left + innerWidth + margin.right).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleBand<string>().domain(industries).range([0, innerWidth]).padding(0.06)
    const yScale = d3.scaleBand<string>().domain(yGroups).range([0, innerHeight]).padding(0.06)

    // Color scale
    const valueAccessor = (cell: CellData): number => {
      if (valueMode === "count") return cell.count
      if (valueMode === "avgScore") return cell.avgScore
      if (valueMode === "customerCount") return cell.customerCount
      return cell.avgFunding / 1_000_000 // in millions
    }

    const maxVal = d3.max(cells, valueAccessor) || 1
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxVal])

    // Draw cells
    for (const industry of industries) {
      for (const yGroup of yGroups) {
        const cell = cellLookup.get(`${industry}|||${yGroup}`)
        const x = xScale(industry) ?? 0
        const y = yScale(yGroup) ?? 0
        const w = xScale.bandwidth()
        const h = yScale.bandwidth()

        if (!cell) {
          // Empty cell
          g.append("rect")
            .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
            .attr("fill", emptyBg)
            .attr("stroke", emptyStroke)
            .attr("stroke-width", 0.5)
            .attr("rx", 2)
          continue
        }

        const val = valueAccessor(cell)
        const hasShortlisted = shortlistedIds && cell.companies.some(c => shortlistedIds.has(c.id))

        g.append("rect")
          .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
          .attr("fill", colorScale(val))
          .attr("stroke", hasShortlisted ? "#f59e0b" : borderColor)
          .attr("stroke-width", hasShortlisted ? 2.5 : 0.5)
          .attr("rx", 2)
          .style("cursor", "pointer")
          .on("click", () => {
            onCellClick?.(`${cell.industry} × ${cell.yGroup}`, cell.companies.map(c => c.id))
          })
          .on("mouseover", (event) => {
            if (!tooltipRef.current) return
            const shortlistedNames = shortlistedIds
              ? cell.companies.filter(c => shortlistedIds.has(c.id)).map(c => c.name)
              : []
            const fundingStr = `$${(cell.avgFunding / 1_000_000).toFixed(1)}M`
            tooltipRef.current.style.visibility = "visible"
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
            tooltipRef.current.innerHTML = [
              `<strong>${cell.industry}</strong> × <strong>${cell.yGroup}</strong>`,
              `Startups: ${cell.count}`,
              `Avg Score: ${cell.avgScore.toFixed(1)}`,
              `Avg Funding: ${fundingStr}`,
              `Known Customers: ${cell.customerCount}`,
              shortlistedNames.length > 0 ? `<br><span style="color:#f59e0b">★ ${shortlistedNames.join(", ")}</span>` : "",
              cell.count <= 8 ? `<br><span style="opacity:0.6">${cell.companies.map(c => c.name).join(", ")}</span>` : "",
            ].filter(Boolean).join("<br>")
          })
          .on("mousemove", (event) => {
            if (!tooltipRef.current) return
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
          })
          .on("mouseout", () => {
            if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
          })

        // Cell text — show count if there's room
        if (w > 20 && h > 16 && cell.count > 0) {
          const displayVal = valueMode === "count"
            ? String(cell.count)
            : valueMode === "avgScore"
              ? cell.avgScore.toFixed(1)
              : valueMode === "customerCount"
                ? String(cell.customerCount)
                : `${(cell.avgFunding / 1_000_000).toFixed(0)}`

          g.append("text")
            .attr("x", x + w / 2)
            .attr("y", y + h / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("fill", contrastTextColor(colorScale(val)))
            .attr("font-size", "10px")
            .attr("font-weight", "500")
            .attr("pointer-events", "none")
            .text(displayVal)
        }
      }
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-55)")
      .attr("fill", axisColor)
      .style("font-size", "10px")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", axisColor)
      .style("font-size", "10px")

    // Remove axis lines
    g.selectAll(".domain").remove()
    g.selectAll(".tick line").remove()

    // Color legend
    const legendWidth = 140
    const legendG = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth - legendWidth - 10},${height - 30})`)

    const defs = svg.append("defs")
    const grad = defs.append("linearGradient").attr("id", "industry-penetration-legend-grad")
    const stops = [0, 0.25, 0.5, 0.75, 1]
    stops.forEach(s => {
      grad.append("stop")
        .attr("offset", `${s * 100}%`)
        .attr("stop-color", d3.interpolateYlOrRd(s))
    })

    legendG.append("rect")
      .attr("width", legendWidth).attr("height", 8)
      .attr("fill", "url(#industry-penetration-legend-grad)")
      .attr("rx", 2)

    const labelText = valueMode === "count" ? "Startups" : valueMode === "avgScore" ? "Avg Score" : valueMode === "customerCount" ? "Known Customers" : "Avg Funding ($M)"
    legendG.append("text").attr("x", 0).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").text(`0 ${labelText}`)
    legendG.append("text").attr("x", legendWidth).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").attr("text-anchor", "end")
      .text(valueMode === "count" ? String(Math.round(maxVal)) : valueMode === "avgScore" ? maxVal.toFixed(1) : `$${maxVal.toFixed(0)}M`)
  }, [cells, cellLookup, industries, yGroups, valueMode, shortlistedIds, onCellClick])

  // Summary stats
  const stats = useMemo(() => {
    const hotspots = cells.filter(c => c.count >= 5).sort((a, b) => b.count - a.count).slice(0, 3)
    const whiteSpaces = industries
      .flatMap(ind => yGroups.map(yg => ({ industry: ind, yGroup: yg, cell: cellLookup.get(`${ind}|||${yg}`) })))
      .filter(x => !x.cell || x.cell.count === 0)
      .length
    return { hotspots, whiteSpaces, totalCells: industries.length * yGroups.length }
  }, [cells, cellLookup, industries, yGroups])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows</label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as YAxisKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {Y_AXES.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Value</label>
          <select
            value={valueMode}
            onChange={(e) => setValueMode(e.target.value as ValueMode)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {VALUE_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground">
          {industries.length} industries × {yGroups.length} {Y_AXES.find(y => y.value === yAxis)?.label.toLowerCase() || "groups"}
          {stats.whiteSpaces > 0 && <span className="ml-2">({stats.whiteSpaces} white spaces)</span>}
        </div>
      </div>

      {/* Insight bar */}
      {stats.hotspots.length > 0 && (
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Hotspots:</span>{" "}
            {stats.hotspots.map((h, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <span className="text-foreground">{h.industry}</span>
                <span className="text-muted-foreground"> × </span>
                <span className="text-foreground">{h.yGroup}</span>
                <span className="text-amber-500 ml-1">({h.count})</span>
              </span>
            ))}
          </p>
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full min-h-0 overflow-auto">
        <svg ref={svgRef} className="w-full" />
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            visibility: "hidden",
            background: "var(--popover, #1e293b)",
            border: "1px solid var(--border, #334155)",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            color: "var(--popover-foreground, #f1f5f9)",
            pointerEvents: "none",
            zIndex: 9999,
            maxWidth: "320px",
          }}
        />
      </div>
    </Card>
  )
}
