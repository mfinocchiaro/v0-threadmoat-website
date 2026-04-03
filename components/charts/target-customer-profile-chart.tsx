"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { parseKnownCustomers } from "@/lib/customer-logos"
import { Card } from "@/components/ui/card"
import { cn, contrastTextColor } from "@/lib/utils"

// --- Axis types ---

type XAxisKey = "buyerPersona" | "startupSizeCategory" | "geoRegion" | "deploymentModel"

const X_AXES: { value: XAxisKey; label: string }[] = [
  { value: "buyerPersona", label: "Buyer Persona" },
  { value: "startupSizeCategory", label: "Company Size" },
  { value: "geoRegion", label: "Geography" },
  { value: "deploymentModel", label: "Deployment Model" },
]

type YAxisKey = "industriesServed" | "investmentTheses" | "workflowSegment" | "manufacturingType"

const Y_AXES: { value: YAxisKey; label: string }[] = [
  { value: "industriesServed", label: "Industries Served" },
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

// --- Cell data ---

interface CellData {
  xGroup: string
  yGroup: string
  count: number
  avgScore: number
  avgFunding: number
  customerCount: number
  companies: { name: string; id: string }[]
}

// --- Props ---

interface TargetCustomerProfileChartProps {
  data: Company[]
  className?: string
  shortlistedIds?: Set<string>
  onCellClick?: (label: string, companyIds: string[]) => void
}

// --- Geo region mapping ---

function getGeoRegion(country: string): string {
  const c = country.replace(/[^\w\s]/g, "").trim().toLowerCase()
  if (c.includes("united states") || c.includes("usa") || c.includes("canada")) return "North America"
  if (c.includes("germany") || c.includes("austria") || c.includes("switzerland")) return "DACH"
  if (c.includes("united kingdom") || c.includes("ireland")) return "UK & Ireland"
  if (c.includes("france") || c.includes("belgium") || c.includes("netherlands") || c.includes("luxembourg")) return "Western Europe"
  if (c.includes("norway") || c.includes("sweden") || c.includes("finland") || c.includes("denmark") || c.includes("iceland")) return "Nordics"
  if (c.includes("israel")) return "Israel"
  if (
    c.includes("india") ||
    c.includes("china") ||
    c.includes("japan") ||
    c.includes("korea") ||
    c.includes("singapore") ||
    c.includes("australia")
  ) return "Asia-Pacific"
  return "Other"
}

// --- X-axis value extraction ---

function getXValues(company: Company, xAxis: XAxisKey): string[] {
  if (xAxis === "buyerPersona") {
    return [company.buyerPersona?.trim() || "Unknown"]
  }
  if (xAxis === "startupSizeCategory") {
    return [company.startupSizeCategory?.trim() || "Unknown"]
  }
  if (xAxis === "geoRegion") {
    const raw = company.country?.trim()
    if (!raw) return ["Unknown"]
    return [getGeoRegion(raw)]
  }
  if (xAxis === "deploymentModel") {
    if (!company.deploymentModel || company.deploymentModel.length === 0) return ["Unknown"]
    return company.deploymentModel.map(d => d.trim()).filter(Boolean)
  }
  return ["Unknown"]
}

// --- Y-axis value extraction ---

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
  if (yAxis === "manufacturingType") {
    const val = company.manufacturingType?.trim()
    if (!val) return ["Unknown"]
    const parsed = val.replace(/[\[\]']/g, "").split(",").map(s => s.trim()).filter(Boolean)
    return parsed.length > 0 ? parsed : ["Unknown"]
  }
  return ["Unknown"]
}

// --- Component ---

export function TargetCustomerProfileChart({ data, className, shortlistedIds, onCellClick }: TargetCustomerProfileChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [xAxis, setXAxis] = useState<XAxisKey>("buyerPersona")
  const [yAxis, setYAxis] = useState<YAxisKey>("industriesServed")
  const [valueMode, setValueMode] = useState<ValueMode>("count")

  // Build cell data
  const { cells, xGroups, yGroups } = useMemo(() => {
    const cellMap = new Map<string, CellData>()

    for (const company of data) {
      const xValues = getXValues(company, xAxis)
      const yValues = getYValues(company, yAxis)

      for (const xVal of xValues) {
        for (const yVal of yValues) {
          const key = `${xVal}|||${yVal}`
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
              xGroup: xVal,
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

    // Sort X groups by total count descending
    const xCounts = new Map<string, number>()
    for (const c of allCells) {
      xCounts.set(c.xGroup, (xCounts.get(c.xGroup) || 0) + c.count)
    }
    const sortedXGroups = Array.from(xCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    // Sort Y groups by total count descending
    const yCounts = new Map<string, number>()
    for (const c of allCells) {
      yCounts.set(c.yGroup, (yCounts.get(c.yGroup) || 0) + c.count)
    }
    const sortedYGroups = Array.from(yCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    return { cells: allCells, xGroups: sortedXGroups, yGroups: sortedYGroups }
  }, [data, xAxis, yAxis])

  // Build lookup
  const cellLookup = useMemo(() => {
    const map = new Map<string, CellData>()
    for (const cell of cells) {
      map.set(`${cell.xGroup}|||${cell.yGroup}`, cell)
    }
    return map
  }, [cells])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || cells.length === 0) return

    const width = containerRef.current.clientWidth
    if (!width) return

    // Theme-aware colors from CSS custom properties
    const rootStyle = getComputedStyle(containerRef.current)
    const axisColor = rootStyle.getPropertyValue("--muted-foreground").trim() || "#64748b"
    const borderColor = rootStyle.getPropertyValue("--border").trim() || "#1e293b"
    const fgColor = rootStyle.getPropertyValue("--foreground").trim() || "#f1f5f9"
    const emptyBg = "color-mix(in srgb, var(--muted-foreground) 8%, transparent)"
    const emptyStroke = "color-mix(in srgb, var(--muted-foreground) 15%, transparent)"

    const margin = { top: 10, right: 30, bottom: 140, left: 200 }
    const cellSize = Math.max(28, Math.min(40, (width - margin.left - margin.right) / xGroups.length))
    const innerWidth = xGroups.length * cellSize
    const innerHeight = yGroups.length * cellSize
    const height = innerHeight + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", margin.left + innerWidth + margin.right).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleBand<string>().domain(xGroups).range([0, innerWidth]).padding(0.06)
    const yScale = d3.scaleBand<string>().domain(yGroups).range([0, innerHeight]).padding(0.06)

    // Color scale
    const valueAccessor = (cell: CellData): number => {
      if (valueMode === "count") return cell.count
      if (valueMode === "avgScore") return cell.avgScore
      if (valueMode === "customerCount") return cell.customerCount
      return cell.avgFunding / 1_000_000
    }

    const maxVal = d3.max(cells, valueAccessor) || 1
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxVal])

    // Draw cells
    for (const xGroup of xGroups) {
      for (const yGroup of yGroups) {
        const cell = cellLookup.get(`${xGroup}|||${yGroup}`)
        const x = xScale(xGroup) ?? 0
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
            onCellClick?.(`${cell.xGroup} × ${cell.yGroup}`, cell.companies.map(c => c.id))
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
              `<strong>${cell.xGroup}</strong> × <strong>${cell.yGroup}</strong>`,
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

        // Cell text — show value if there's room (K004: use '' not null for D3 .style())
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
    const grad = defs.append("linearGradient").attr("id", "target-customer-legend-grad")
    const stops = [0, 0.25, 0.5, 0.75, 1]
    stops.forEach(s => {
      grad.append("stop")
        .attr("offset", `${s * 100}%`)
        .attr("stop-color", d3.interpolateYlOrRd(s))
    })

    legendG.append("rect")
      .attr("width", legendWidth).attr("height", 8)
      .attr("fill", "url(#target-customer-legend-grad)")
      .attr("rx", 2)

    const labelText = valueMode === "count"
      ? "Startups"
      : valueMode === "avgScore"
        ? "Avg Score"
        : valueMode === "customerCount"
          ? "Known Customers"
          : "Avg Funding ($M)"

    legendG.append("text").attr("x", 0).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").text(`0 ${labelText}`)
    legendG.append("text").attr("x", legendWidth).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").attr("text-anchor", "end")
      .text(
        valueMode === "count"
          ? String(Math.round(maxVal))
          : valueMode === "avgScore"
            ? maxVal.toFixed(1)
            : valueMode === "customerCount"
              ? String(Math.round(maxVal))
              : `$${maxVal.toFixed(0)}M`
      )
  }, [cells, cellLookup, xGroups, yGroups, valueMode, shortlistedIds, onCellClick])

  // Summary stats
  const stats = useMemo(() => {
    const hotspots = cells.filter(c => c.count >= 5).sort((a, b) => b.count - a.count).slice(0, 3)
    const whiteSpaces = xGroups
      .flatMap(xg => yGroups.map(yg => ({ xGroup: xg, yGroup: yg, cell: cellLookup.get(`${xg}|||${yg}`) })))
      .filter(x => !x.cell || x.cell.count === 0)
      .length
    return { hotspots, whiteSpaces, totalCells: xGroups.length * yGroups.length }
  }, [cells, cellLookup, xGroups, yGroups])

  const xLabel = X_AXES.find(x => x.value === xAxis)?.label.toLowerCase() || "groups"
  const yLabel = Y_AXES.find(y => y.value === yAxis)?.label.toLowerCase() || "groups"

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Columns</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as XAxisKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {X_AXES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </div>
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
          {xGroups.length} {xLabel} × {yGroups.length} {yLabel}
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
                <span className="text-foreground">{h.xGroup}</span>
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
