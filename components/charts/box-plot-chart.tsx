"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BoxPlotChartProps {
  data: Company[]
  className?: string
}

type MetricKey = "totalFunding" | "weightedScore" | "marketOpportunity" | "techDifferentiation" | "teamExecution" | "fundingEfficiency" | "headcount" | "estimatedRevenue"
type GroupByKey = "investmentList" | "country" | "discipline" | "lifecyclePhase" | "latestFundingRound"

const METRICS: { value: MetricKey; label: string }[] = [
  { value: "totalFunding", label: "Total Funding" },
  { value: "weightedScore", label: "Weighted Score" },
  { value: "marketOpportunity", label: "Market Opportunity" },
  { value: "techDifferentiation", label: "Tech Differentiation" },
  { value: "teamExecution", label: "Team Execution" },
  { value: "fundingEfficiency", label: "Funding Efficiency" },
  { value: "headcount", label: "Headcount" },
  { value: "estimatedRevenue", label: "Annual Revenue" },
]

const GROUP_BYS: { value: GroupByKey; label: string }[] = [
  { value: "investmentList", label: "Investment List" },
  { value: "country", label: "Country" },
  { value: "discipline", label: "Discipline" },
  { value: "lifecyclePhase", label: "Lifecycle Phase" },
  { value: "latestFundingRound", label: "Funding Round" },
]

const METRIC_LABELS: Record<string, string> = {
  totalFunding: "Total Funding", weightedScore: "Weighted Score", marketOpportunity: "Market Opportunity",
  techDifferentiation: "Tech Differentiation", teamExecution: "Team Execution", fundingEfficiency: "Funding Efficiency",
  headcount: "Headcount", estimatedRevenue: "Annual Revenue", investmentList: "Investment List",
  country: "Country", discipline: "Discipline", lifecyclePhase: "Lifecycle Phase", latestFundingRound: "Funding Round",
}

function isCurrencyMetric(key: string): boolean {
  return ["totalFunding", "estimatedRevenue", "estimatedMarketValue"].includes(key)
}

export function BoxPlotChart({ data, className }: BoxPlotChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [metric, setMetric] = useState<MetricKey>("weightedScore")
  const [groupBy, setGroupBy] = useState<GroupByKey>("investmentList")
  const [showOutliers, setShowOutliers] = useState(true)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const margin = { top: 50, right: 40, bottom: 100, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const grouped = d3.group(data, (d) => {
      let key = (d[groupBy] as string) || "Unknown"
      if (groupBy === "investmentList") key = key.replace(/^\d+-/, "") || "Unknown"
      return key
    })

    const categories = Array.from(grouped.keys()).sort()

    interface BoxDatum {
      category: string
      q1: number
      median: number
      q3: number
      min: number
      max: number
      outlierPoints: Company[]
      count: number
    }

    const boxData: BoxDatum[] = categories.flatMap((category) => {
      const values = (grouped.get(category) ?? [])
        .map((d) => (d[metric] as number))
        .filter((v) => v != null && !isNaN(v) && v > 0)
        .sort(d3.ascending)

      if (values.length === 0) return []

      const q1 = d3.quantile(values, 0.25)!
      const median = d3.quantile(values, 0.5)!
      const q3 = d3.quantile(values, 0.75)!
      const iqr = q3 - q1
      const whiskerMin = Math.max(values[0], q1 - 1.5 * iqr)
      const whiskerMax = Math.min(values[values.length - 1], q3 + 1.5 * iqr)
      const outlierPoints = (grouped.get(category) ?? []).filter((d) => {
        const v = d[metric] as number
        return v != null && !isNaN(v) && v > 0 && (v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr)
      })

      return [{ category, q1, median, q3, min: whiskerMin, max: whiskerMax, outlierPoints, count: values.length }]
    })

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    if (boxData.length === 0) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "#94a3b8").text("No data available")
      return
    }

    const xScale = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.3)
    const allVals = boxData.flatMap((d) => [d.min, d.max])
    const yScale = d3.scaleLinear().domain([0, (d3.max(allVals) ?? 1) * 1.1]).range([innerHeight, 0])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Title
    svg.append("text").attr("x", width / 2).attr("y", 28).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "15px").attr("font-weight", "600")
      .text(`${METRIC_LABELS[metric] || metric} Distribution by ${METRIC_LABELS[groupBy] || groupBy}`)

    // Grid
    g.append("g").call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""))
      .selectAll("line").attr("stroke", "#334155").attr("stroke-dasharray", "2,2")
    g.select(".domain").remove()

    // Axes
    const fmt = isCurrencyMetric(metric) ? (d: d3.NumberValue) => formatCurrency(d as number) : (d: d3.NumberValue) => String(d3.format(".1f")(d as number))
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale))
      .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end").attr("fill", "#94a3b8").style("font-size", "10px")
    g.append("g").call(d3.axisLeft(yScale).tickFormat(fmt)).selectAll("text").attr("fill", "#94a3b8")

    // Draw boxes
    boxData.forEach((box) => {
      const x = xScale(box.category)!
      const bw = xScale.bandwidth()
      const color = colorScale(box.category)
      const bg = g.append("g")

      // Whisker lines
      bg.append("line").attr("x1", x + bw / 2).attr("x2", x + bw / 2).attr("y1", yScale(box.min)).attr("y2", yScale(box.q1)).attr("stroke", color).attr("stroke-width", 2)
      bg.append("line").attr("x1", x + bw / 2).attr("x2", x + bw / 2).attr("y1", yScale(box.q3)).attr("y2", yScale(box.max)).attr("stroke", color).attr("stroke-width", 2)
      // Caps
      bg.append("line").attr("x1", x + bw * 0.3).attr("x2", x + bw * 0.7).attr("y1", yScale(box.min)).attr("y2", yScale(box.min)).attr("stroke", color).attr("stroke-width", 2)
      bg.append("line").attr("x1", x + bw * 0.3).attr("x2", x + bw * 0.7).attr("y1", yScale(box.max)).attr("y2", yScale(box.max)).attr("stroke", color).attr("stroke-width", 2)
      // Box
      bg.append("rect")
        .attr("x", x).attr("y", yScale(box.q3))
        .attr("width", bw).attr("height", Math.max(0, yScale(box.q1) - yScale(box.q3)))
        .attr("fill", color).attr("fill-opacity", 0.3).attr("stroke", color).attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", (event) => {
          if (!tooltipRef.current) return
          tooltipRef.current.style.visibility = "visible"
          tooltipRef.current.style.top = `${event.pageY - 10}px`
          tooltipRef.current.style.left = `${event.pageX + 15}px`
          tooltipRef.current.innerHTML = `<strong>${box.category}</strong><br>Count: ${box.count}<br>Median: ${fmt(box.median)}<br>Q1: ${fmt(box.q1)}<br>Q3: ${fmt(box.q3)}<br>Min: ${fmt(box.min)}<br>Max: ${fmt(box.max)}`
        })
        .on("mousemove", (event) => {
          if (!tooltipRef.current) return
          tooltipRef.current.style.top = `${event.pageY - 10}px`
          tooltipRef.current.style.left = `${event.pageX + 15}px`
        })
        .on("mouseout", () => { if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden" })
      // Median line
      bg.append("line").attr("x1", x).attr("x2", x + bw).attr("y1", yScale(box.median)).attr("y2", yScale(box.median)).attr("stroke", "#f1f5f9").attr("stroke-width", 3)

      // Outliers
      if (showOutliers) {
        bg.selectAll<SVGCircleElement, Company>(".outlier")
          .data(box.outlierPoints)
          .join("circle")
          .attr("class", "outlier")
          .attr("cx", x + bw / 2 + (Math.random() - 0.5) * bw * 0.4)
          .attr("cy", (d) => yScale((d[metric] as number)))
          .attr("r", 4)
          .attr("fill", "#ef4444").attr("stroke", "#dc2626").attr("fill-opacity", 0.7).style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            if (!tooltipRef.current) return
            tooltipRef.current.style.visibility = "visible"
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
            tooltipRef.current.innerHTML = `<strong>${d.name}</strong><br>${metric}: ${fmt(d[metric] as number)}<br>Category: ${box.category}`
          })
          .on("mousemove", (event) => {
            if (!tooltipRef.current) return
            tooltipRef.current.style.top = `${event.pageY - 10}px`
            tooltipRef.current.style.left = `${event.pageX + 15}px`
          })
          .on("mouseout", () => { if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden" })
      }
    })
  }, [data, metric, groupBy, showOutliers])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Metric</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className="text-xs bg-background border border-border rounded px-2 py-1">
            {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Group By</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByKey)} className="text-xs bg-background border border-border rounded px-2 py-1">
            {GROUP_BYS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showOutliers} onChange={(e) => setShowOutliers(e.target.checked)} className="rounded" />
          Show Outliers
        </label>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div ref={tooltipRef} style={{ position: "fixed", visibility: "hidden", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#f1f5f9", pointerEvents: "none", zIndex: 9999 }} />
      </div>
    </Card>
  )
}
