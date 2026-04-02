"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeatmapChartProps {
  data: Company[]
  className?: string
}

type MetricKey = "totalFunding" | "weightedScore" | "headcount"
type XAxisKey = "startupLifecyclePhase" | "country"

const METRICS: { value: MetricKey; label: string }[] = [
  { value: "totalFunding", label: "Total Funding" },
  { value: "weightedScore", label: "Weighted Score" },
  { value: "headcount", label: "Headcount" },
]

const X_AXES: { value: XAxisKey; label: string }[] = [
  { value: "startupLifecyclePhase", label: "Startup Phase" },
  { value: "country", label: "Country" },
]

export function HeatmapChart({ data, className }: HeatmapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [metric, setMetric] = useState<MetricKey>("weightedScore")
  const [xAxis, setXAxis] = useState<XAxisKey>("startupLifecyclePhase")
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    if (!width) return

    // Theme-aware colors from CSS custom properties
    // Values are already complete color functions (e.g. oklch(0.45 0.05 270))
    const rootStyle = getComputedStyle(containerRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#64748b'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#1e293b'

    const margin = { top: 40, right: 30, bottom: 80, left: 160 }

    const xGroups = Array.from(new Set(data.map((d) => (d[xAxis] as string) || "Unknown"))).sort()
    const yGroups = Array.from(new Set(data.map((d) => d.investmentList || "Unknown"))).sort()

    const cellSize = 32
    const height = yGroups.length * cellSize + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const innerWidth = width - margin.left - margin.right

    const xScale = d3
      .scaleBand()
      .domain(xGroups)
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3
      .scaleBand()
      .domain(yGroups)
      .range([0, yGroups.length * cellSize])
      .padding(0.05)

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, (d) => (d[metric] as number) || 0) ?? 1])

    // Draw cells
    g.selectAll<SVGRectElement, Company>(".cell")
      .data(data)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale((d[xAxis] as string) || "Unknown") ?? 0)
      .attr("y", (d) => yScale(d.investmentList || "Unknown") ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale((d[metric] as number) || 0))
      .attr("stroke", borderColor)
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        if (!tooltipRef.current) return
        const val = metric === "totalFunding"
          ? formatCurrency((d[metric] as number) || 0)
          : String((d[metric] as number) || 0)
        tooltipRef.current.style.visibility = "visible"
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
        tooltipRef.current.innerHTML = `<strong>${d.name}</strong><br>${metric}: ${val}`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
      })
      .on("mouseout", () => {
        if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
      })

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${yGroups.length * cellSize})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
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
    const legendWidth = 120
    const legendX = innerWidth - legendWidth
    const legendSvg = svg.append("g").attr("transform", `translate(${margin.left + legendX},8)`)

    const defs = svg.append("defs")
    const linearGrad = defs.append("linearGradient").attr("id", "heatmap-legend-grad")
    linearGrad.append("stop").attr("offset", "0%").attr("stop-color", d3.interpolateBlues(0))
    linearGrad.append("stop").attr("offset", "100%").attr("stop-color", d3.interpolateBlues(1))

    legendSvg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", 8)
      .attr("fill", "url(#heatmap-legend-grad)")
      .attr("rx", 2)

    legendSvg.append("text").attr("x", 0).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").text("Low")
    legendSvg.append("text").attr("x", legendWidth).attr("y", 20).attr("fill", axisColor).attr("font-size", "9px").attr("text-anchor", "end").text("High")
  }, [data, metric, xAxis])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">X Axis</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as XAxisKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {X_AXES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 overflow-y-auto">
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
          }}
        />
      </div>
    </Card>
  )
}
