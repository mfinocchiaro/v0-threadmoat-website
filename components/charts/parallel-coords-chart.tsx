"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ParallelCoordsChartProps {
  data: Company[]
  className?: string
}

type MetricPreset = "performance" | "financial"

interface MetricDef {
  key: keyof Company
  label: string
  domain: [number, number] | "auto"
  format?: "currency"
}

const METRIC_PRESETS: Record<MetricPreset, MetricDef[]> = {
  performance: [
    { key: "marketOpportunity", label: "Market\nOpportunity", domain: [0, 5] },
    { key: "teamExecution", label: "Team &\nExecution", domain: [0, 5] },
    { key: "techDifferentiation", label: "Tech\nDifferentiation", domain: [0, 5] },
    { key: "fundingEfficiency", label: "Funding\nEfficiency", domain: [0, 5] },
    { key: "growthMetrics", label: "Growth\nMetrics", domain: [0, 5] },
    { key: "industryImpact", label: "Industry\nImpact", domain: [0, 5] },
    { key: "competitiveMoat", label: "Competitive\nMoat", domain: [0, 5] },
  ],
  financial: [
    { key: "totalFunding", label: "Total\nFunding", domain: "auto", format: "currency" },
    { key: "estimatedMarketValue", label: "Est. Market\nValue", domain: "auto", format: "currency" },
    { key: "estimatedRevenue", label: "Annual\nRevenue", domain: "auto", format: "currency" },
    { key: "headcount", label: "Headcount", domain: "auto" },
    { key: "weightedScore", label: "Weighted\nScore", domain: [0, 5] },
  ],
}

export function ParallelCoordsChart({ data, className }: ParallelCoordsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [preset, setPreset] = useState<MetricPreset>("performance")
  const brushesRef = useRef<Record<string, [number, number] | null>>({})
  const [brushVersion, setBrushVersion] = useState(0)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth - 48
    const height = Math.max(500, containerRef.current.clientHeight - 20)
    const margin = { top: 80, right: 80, bottom: 40, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const metrics = METRIC_PRESETS[preset]
    const validData = data.filter((d) => d.name && d.weightedScore > 0)

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    // Build y scales
    const yScales: Record<string, d3.ScaleLinear<number, number>> = {}
    metrics.forEach((m) => {
      if (m.domain === "auto") {
        const values = validData.map((d) => (d[m.key] as number) || 0).filter((v) => v > 0)
        const maxVal = d3.max(values) || 1
        yScales[m.key as string] = d3.scaleLinear().domain([0, maxVal * 1.1]).range([innerHeight, 0])
      } else {
        yScales[m.key as string] = d3.scaleLinear().domain(m.domain as [number, number]).range([innerHeight, 0])
      }
    })

    const xScale = d3
      .scalePoint()
      .domain(metrics.map((m) => m.key as string))
      .range([0, innerWidth])
      .padding(0.1)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    // Title
    svg.append("text").attr("x", width / 2).attr("y", 28).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "16px").attr("font-weight", "600").text("Multi-Dimensional Company Analysis")
    svg.append("text").attr("x", width / 2).attr("y", 48).attr("text-anchor", "middle").attr("fill", "#94a3b8").attr("font-size", "12px").text(`${validData.length} companies • Drag on axes to filter`)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Line generator
    const line = d3
      .line<[string, number]>()
      .defined(([, v]) => v != null && !isNaN(v))
      .x(([key]) => xScale(key) ?? 0)
      .y(([key, val]) => yScales[key](val))

    // Draw lines
    const linesGroup = g.append("g").attr("class", "lines")

    const paths = linesGroup
      .selectAll<SVGPathElement, Company>(".line-path")
      .data(validData)
      .join("path")
      .attr("class", "line-path")
      .attr("d", (d) => {
        const points = metrics.map((m) => [m.key as string, (d[m.key] as number) || 0] as [string, number])
        return line(points)
      })
      .attr("fill", "none")
      .attr("stroke", (d) => colorScale(d.investmentList || "Other"))
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.4)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke-width", 3).raise()
        if (!tooltipRef.current) return
        tooltipRef.current.style.visibility = "visible"
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
        tooltipRef.current.innerHTML = `
          <strong>${d.name}</strong>
          <div style="margin-top:4px;font-size:11px;color:#94a3b8;">
            Country: ${d.country || "N/A"}<br>
            Score: ${d.weightedScore.toFixed(2)}<br>
            Funding: ${formatCurrency(d.totalFunding)}<br>
            Category: ${(d.investmentList || "").replace(/^\d+-/, "") || "N/A"}
          </div>`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.4).attr("stroke-width", 1.5)
        if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
      })

    // Draw axes with brushes
    const axes = g
      .selectAll<SVGGElement, MetricDef>(".axis")
      .data(metrics)
      .join("g")
      .attr("class", "axis")
      .attr("transform", (d) => `translate(${xScale(d.key as string)},0)`)

    axes.each(function (metric) {
      const axisG = d3.select(this)
      const ys = yScales[metric.key as string]

      axisG.call(
        d3.axisLeft(ys).ticks(5).tickFormat((d) => {
          if (metric.format === "currency") return formatCurrency(d as number)
          return String(d3.format(".1f")(d as number))
        })
      )

      // Style tick labels
      axisG.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "9px")
      axisG.selectAll("line").attr("stroke", "#64748b")
      axisG.select(".domain").attr("stroke", "#64748b")

      // Axis label (multi-line)
      const labelLines = metric.label.split("\n")
      const labelG = axisG.append("g").attr("transform", "translate(0,-30)")
      labelLines.forEach((ln, i) => {
        labelG
          .append("text")
          .attr("y", i * 14)
          .attr("text-anchor", "middle")
          .attr("fill", "#f1f5f9")
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .style("cursor", "pointer")
          .text(ln)
          .on("click", () => {
            brushesRef.current[metric.key as string] = null
            setBrushVersion((v) => v + 1)
          })
      })

      // Brush
      const brush = d3
        .brushY()
        .extent([[-12, 0], [12, innerHeight]])
        .on("brush end", function (event) {
          brushesRef.current[metric.key as string] = event.selection
            ? [event.selection[0] as number, event.selection[1] as number]
            : null

          // Update line visibility
          paths.attr("opacity", (d) => {
            const dimmed = metrics.some((m) => {
              const sel = brushesRef.current[m.key as string]
              if (!sel) return false
              const yPos = yScales[m.key as string]((d[m.key] as number) || 0)
              return yPos < sel[0] || yPos > sel[1]
            })
            return dimmed ? 0.04 : 0.4
          })
        })

      axisG.append("g").attr("class", "brush").call(brush)
    })
  }, [data, preset, brushVersion])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Metrics</label>
          <select
            value={preset}
            onChange={(e) => { brushesRef.current = {}; setPreset(e.target.value as MetricPreset) }}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            <option value="performance">Performance Scores</option>
            <option value="financial">Financial Metrics</option>
          </select>
        </div>
        <button
          onClick={() => { brushesRef.current = {}; setBrushVersion((v) => v + 1) }}
          className="text-xs px-3 py-1 border border-border rounded text-muted-foreground hover:text-foreground"
        >
          Clear Filters
        </button>
        <span className="text-xs text-muted-foreground">Drag vertically on any axis to filter. Click axis label to reset.</span>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          style={{ position: "fixed", visibility: "hidden", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#f1f5f9", pointerEvents: "none", zIndex: 9999 }}
        />
      </div>
    </Card>
  )
}
