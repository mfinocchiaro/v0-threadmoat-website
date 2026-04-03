"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn, contrastTextColor } from "@/lib/utils"

interface IPDependencyChartProps {
  data: Company[]
  className?: string
  shortlistedIds?: Set<string>
  onCellClick?: (label: string, companyIds: string[]) => void
}

type ViewMode = "risk-tier" | "vendor-matrix"
type YAxisKey = "deploymentModel" | "investmentTheses" | "workflowSegment"

const Y_AXES: { value: YAxisKey; label: string }[] = [
  { value: "deploymentModel", label: "Deployment Model" },
  { value: "investmentTheses", label: "Investment Thesis" },
  { value: "workflowSegment", label: "Workflow Segment" },
]

// Inverse risk tiers — higher score = lower risk
function riskTier(score: number): string {
  if (score >= 65) return "Very Low Risk"
  if (score >= 55) return "Low Risk"
  if (score >= 45) return "Medium Risk"
  if (score >= 35) return "High Risk"
  return "Very High Risk"
}

const RISK_TIER_ORDER = [
  "Very High Risk",
  "High Risk",
  "Medium Risk",
  "Low Risk",
  "Very Low Risk",
]

const VENDOR_ORDER = ["Dassault", "Siemens", "Autodesk", "PTC", "Independent"]

function getYValues(company: Company, yAxis: YAxisKey): string[] {
  if (yAxis === "deploymentModel") {
    return company.deploymentModel.length > 0 ? company.deploymentModel : ["Unknown"]
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

function getVendorColumns(company: Company): string[] {
  const deps = company.ecosystemDependencies
  if (!deps || deps.length === 0) return ["Independent"]
  const matched: string[] = []
  for (const vendor of ["Dassault", "Siemens", "Autodesk", "PTC"]) {
    if (deps.some(d => d.toLowerCase().includes(vendor.toLowerCase()))) {
      matched.push(vendor)
    }
  }
  return matched.length > 0 ? matched : ["Independent"]
}

interface CompanyDetail {
  name: string
  id: string
  ecosystemCompatibility: string
  graphicsKernel: string
  modelingParadigms: string[]
  depCount: number
}

interface CellData {
  xGroup: string
  yGroup: string
  count: number
  metric: number // avg dep count (risk mode) or count (vendor mode)
  companies: CompanyDetail[]
}

export function IPDependencyChart({ data, className, shortlistedIds, onCellClick }: IPDependencyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("risk-tier")
  const [yAxis, setYAxis] = useState<YAxisKey>("deploymentModel")

  const { cells, xGroups, yGroups, cellLookup, maxMetric } = useMemo(() => {
    const cellMap = new Map<string, CellData>()
    const xOrder = viewMode === "risk-tier" ? RISK_TIER_ORDER : VENDOR_ORDER

    for (const company of data) {
      const depCount = company.ecosystemDependencies?.length ?? 0
      const detail: CompanyDetail = {
        name: company.name,
        id: company.id,
        ecosystemCompatibility: company.ecosystemCompatibility || "",
        graphicsKernel: company.graphicsKernel || "",
        modelingParadigms: company.modelingParadigms || [],
        depCount,
      }

      // Determine X columns for this company
      let xCols: string[]
      if (viewMode === "risk-tier") {
        if (!company.techIndependenceScore) continue
        xCols = [riskTier(company.techIndependenceScore)]
      } else {
        xCols = getVendorColumns(company)
      }

      const yValues = getYValues(company, yAxis)

      for (const xCol of xCols) {
        for (const yVal of yValues) {
          const key = `${xCol}|||${yVal}`
          const existing = cellMap.get(key)
          if (existing) {
            existing.count++
            existing.metric += depCount
            existing.companies.push(detail)
          } else {
            cellMap.set(key, {
              xGroup: xCol,
              yGroup: yVal,
              count: 1,
              metric: depCount,
              companies: [detail],
            })
          }
        }
      }
    }

    // Finalize metric — for risk mode, metric is average dep count; for vendor mode, metric is count
    const allCells = Array.from(cellMap.values())
    if (viewMode === "risk-tier") {
      for (const cell of allCells) {
        cell.metric = cell.count > 0 ? cell.metric / cell.count : 0
      }
    } else {
      for (const cell of allCells) {
        cell.metric = cell.count
      }
    }

    const usedX = xOrder.filter(x => allCells.some(c => c.xGroup === x))

    const yGroupCounts = new Map<string, number>()
    for (const c of allCells) yGroupCounts.set(c.yGroup, (yGroupCounts.get(c.yGroup) || 0) + c.count)
    const sortedY = Array.from(yGroupCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    const lookup = new Map<string, CellData>()
    for (const cell of allCells) lookup.set(`${cell.xGroup}|||${cell.yGroup}`, cell)

    const mMax = d3.max(allCells, c => c.metric) || 1

    return { cells: allCells, xGroups: usedX, yGroups: sortedY, cellLookup: lookup, maxMetric: mMax }
  }, [data, yAxis, viewMode])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || cells.length === 0) return

    const width = containerRef.current.clientWidth
    if (!width) return

    const rootStyle = getComputedStyle(containerRef.current)
    const axisColor = rootStyle.getPropertyValue("--muted-foreground").trim() || "#64748b"
    const borderColor = rootStyle.getPropertyValue("--border").trim() || "#1e293b"
    const fgColor = rootStyle.getPropertyValue("--foreground").trim() || "#f1f5f9"

    const margin = { top: 10, right: 30, bottom: 100, left: 200 }
    const cellSize = Math.max(28, Math.min(44, (width - margin.left - margin.right) / xGroups.length))
    const innerWidth = xGroups.length * cellSize
    const innerHeight = yGroups.length * cellSize
    const height = innerHeight + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", margin.left + innerWidth + margin.right).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleBand<string>().domain(xGroups).range([0, innerWidth]).padding(0.06)
    const yScale = d3.scaleBand<string>().domain(yGroups).range([0, innerHeight]).padding(0.06)

    const colorScale = d3.scaleSequential(
      viewMode === "risk-tier" ? d3.interpolateOrRd : d3.interpolateBlues
    ).domain([0, maxMetric])

    const gradientId = `ip-dep-legend-grad-${viewMode}`

    for (const xGroup of xGroups) {
      for (const yGroup of yGroups) {
        const cell = cellLookup.get(`${xGroup}|||${yGroup}`)
        const x = xScale(xGroup) ?? 0
        const y = yScale(yGroup) ?? 0
        const w = xScale.bandwidth()
        const h = yScale.bandwidth()

        if (!cell) {
          g.append("rect")
            .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
            .attr("fill", "color-mix(in srgb, var(--muted-foreground) 8%, transparent)")
            .attr("stroke", "color-mix(in srgb, var(--muted-foreground) 15%, transparent)")
            .attr("stroke-width", 0.5).attr("rx", 2)
          continue
        }

        const hasShortlisted = shortlistedIds && cell.companies.some(c => shortlistedIds.has(c.id))

        g.append("rect")
          .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
          .attr("fill", colorScale(cell.metric))
          .attr("stroke", hasShortlisted ? "#f59e0b" : borderColor)
          .attr("stroke-width", hasShortlisted ? 2.5 : 0.5)
          .attr("rx", 2)
          .style("cursor", "pointer")
          .on("click", () => {
            onCellClick?.(`${cell.xGroup} × ${cell.yGroup}`, cell.companies.map(c => c.id))
          })
          .on("mouseover", (event) => {
            if (!tooltipRef.current) return
            const lines: string[] = [
              `<strong>${cell.xGroup}</strong> × <strong>${cell.yGroup}</strong>`,
              `Startups: ${cell.count}`,
            ]
            if (viewMode === "risk-tier") {
              lines.push(`Avg Dependencies: ${cell.metric.toFixed(1)}`)
            }

            // Company detail for small cells
            if (cell.count <= 8) {
              lines.push("<br>")
              for (const c of cell.companies) {
                const isShortlisted = shortlistedIds?.has(c.id)
                const star = isShortlisted ? '<span style="color:#f59e0b">★ </span>' : ""
                const ecoText = c.ecosystemCompatibility
                  ? c.ecosystemCompatibility.length > 80
                    ? c.ecosystemCompatibility.slice(0, 80) + "…"
                    : c.ecosystemCompatibility
                  : ""
                const kernelText = c.graphicsKernel ? ` | Kernel: ${c.graphicsKernel}` : ""
                const paradigmText = c.modelingParadigms.length > 0
                  ? ` | ${c.modelingParadigms.slice(0, 3).join(", ")}`
                  : ""
                lines.push(
                  `${star}<strong>${c.name}</strong>` +
                  (ecoText ? `<br><span style="opacity:0.7;font-size:11px">${ecoText}</span>` : "") +
                  ((kernelText || paradigmText) ? `<br><span style="opacity:0.6;font-size:11px">${kernelText}${paradigmText}</span>` : "")
                )
              }
            }

            // Shortlist summary for larger cells
            if (cell.count > 8 && shortlistedIds) {
              const shortlisted = cell.companies.filter(c => shortlistedIds.has(c.id))
              if (shortlisted.length > 0) {
                lines.push(`<br><span style="color:#f59e0b">★ ${shortlisted.map(c => c.name).join(", ")}</span>`)
              }
            }

            tooltipRef.current.style.visibility = "visible"
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
            tooltipRef.current.innerHTML = lines.filter(Boolean).join("<br>")
          })
          .on("mousemove", (event) => {
            if (!tooltipRef.current) return
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
          })
          .on("mouseout", () => {
            if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
          })

        if (w > 20 && h > 16) {
          g.append("text")
            .attr("x", x + w / 2).attr("y", y + h / 2)
            .attr("text-anchor", "middle").attr("dominant-baseline", "central")
            .attr("fill", contrastTextColor(colorScale(cell.metric)))
            .attr("font-size", "10px").attr("font-weight", "500").attr("pointer-events", "none")
            .text(String(cell.count))
        }
      }
    }

    // X axis
    g.append("g").attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)).selectAll("text")
      .style("text-anchor", "end").attr("dx", "-.8em").attr("dy", ".15em")
      .attr("transform", "rotate(-35)").attr("fill", axisColor).style("font-size", "10px")

    // Y axis
    g.append("g").call(d3.axisLeft(yScale)).selectAll("text")
      .attr("fill", axisColor).style("font-size", "10px")

    g.selectAll(".domain").remove()
    g.selectAll(".tick line").remove()

    // Legend gradient
    const legendWidth = 140
    const legendG = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth - legendWidth - 10},${height - 25})`)
    const defs = svg.append("defs")
    const grad = defs.append("linearGradient").attr("id", gradientId)
    const interpolator = viewMode === "risk-tier" ? d3.interpolateOrRd : d3.interpolateBlues
    ;[0, 0.25, 0.5, 0.75, 1].forEach(s => {
      grad.append("stop").attr("offset", `${s * 100}%`).attr("stop-color", interpolator(s))
    })
    legendG.append("rect").attr("width", legendWidth).attr("height", 8)
      .attr("fill", `url(#${gradientId})`).attr("rx", 2)
    const legendLabel = viewMode === "risk-tier" ? `${maxMetric.toFixed(1)} avg deps` : `${Math.round(maxMetric)} startups`
    legendG.append("text").attr("x", 0).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").text("0")
    legendG.append("text").attr("x", legendWidth).attr("y", 20).attr("fill", axisColor)
      .attr("font-size", "9px").attr("text-anchor", "end").text(legendLabel)
  }, [cells, cellLookup, xGroups, yGroups, shortlistedIds, viewMode, maxMetric, onCellClick])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        {/* View mode toggle */}
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("risk-tier")}
            className={cn(
              "px-3 py-1 text-xs transition-colors",
              viewMode === "risk-tier"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Risk Tier
          </button>
          <button
            onClick={() => setViewMode("vendor-matrix")}
            className={cn(
              "px-3 py-1 text-xs transition-colors",
              viewMode === "vendor-matrix"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            Vendor Matrix
          </button>
        </div>

        {/* Y-axis selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows</label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as YAxisKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {Y_AXES.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        {/* Dimension counts */}
        <div className="text-xs text-muted-foreground">
          {xGroups.length} {viewMode === "risk-tier" ? "risk tiers" : "vendors"} × {yGroups.length} groups
        </div>
      </div>

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
            maxWidth: "380px",
          }}
        />
      </div>
    </Card>
  )
}
