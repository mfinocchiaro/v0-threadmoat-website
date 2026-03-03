"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SlopeChartProps {
  data: Company[]
  className?: string
}

type LeftMetric = "totalFunding" | "headcount" | "founded"
type RightMetric = "weightedScore" | "estimatedMarketValue" | "estimatedRevenue" | "marketOpportunity"

const LEFT_METRICS: { value: LeftMetric; label: string }[] = [
  { value: "totalFunding", label: "Total Funding" },
  { value: "headcount", label: "Headcount" },
  { value: "founded", label: "Founded Year" },
]

const RIGHT_METRICS: { value: RightMetric; label: string }[] = [
  { value: "weightedScore", label: "Weighted Score" },
  { value: "estimatedMarketValue", label: "Estimated Value" },
  { value: "estimatedRevenue", label: "Annual Revenue" },
  { value: "marketOpportunity", label: "Market Opportunity" },
]

const LABELS: Record<string, string> = {
  totalFunding: "Total Funding", headcount: "Headcount", founded: "Founded Year",
  weightedScore: "Weighted Score", estimatedMarketValue: "Estimated Value",
  estimatedRevenue: "Annual Revenue", marketOpportunity: "Market Opportunity",
}

function isCurrency(key: string) {
  return ["totalFunding", "estimatedMarketValue", "estimatedRevenue"].includes(key)
}

function formatVal(value: number, key: string): string {
  if (isCurrency(key)) return formatCurrency(value)
  if (key === "founded") return String(Math.round(value))
  return d3.format(".2f")(value)
}

export function SlopeChart({ data, className }: SlopeChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [leftMetric, setLeftMetric] = useState<LeftMetric>("totalFunding")
  const [rightMetric, setRightMetric] = useState<RightMetric>("weightedScore")
  const [topN, setTopN] = useState(20)
  const [showLabels, setShowLabels] = useState(true)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const margin = { top: 70, right: 160, bottom: 40, left: 160 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const validData = data
      .filter((d) => {
        const lv = d[leftMetric] as number
        const rv = d[rightMetric] as number
        return lv != null && !isNaN(lv) && lv > 0 && rv != null && !isNaN(rv) && rv > 0
      })
      .sort((a, b) => (b[rightMetric] as number) - (a[rightMetric] as number))
      .slice(0, topN)

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    if (validData.length === 0) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "#94a3b8").text("No data available for selected metrics")
      return
    }

    // Title
    svg.append("text").attr("x", width / 2).attr("y", 28).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "16px").attr("font-weight", "600").text(`${LABELS[leftMetric]} → ${LABELS[rightMetric]}`)
    svg.append("text").attr("x", width / 2).attr("y", 48).attr("text-anchor", "middle").attr("fill", "#94a3b8").attr("font-size", "12px").text(`Top ${validData.length} companies by ${LABELS[rightMetric]}`)

    const leftScale = d3.scaleLinear().domain([0, (d3.max(validData, (d) => d[leftMetric] as number) ?? 1) * 1.1]).range([innerHeight, 0])
    const rightScale = d3.scaleLinear().domain([0, (d3.max(validData, (d) => d[rightMetric] as number) ?? 1) * 1.1]).range([innerHeight, 0])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Grid
    g.append("g").call(d3.axisLeft(leftScale).tickSize(-innerWidth).tickFormat(() => ""))
      .selectAll("line").attr("stroke", "#334155").attr("stroke-dasharray", "2,2")
    g.select(".domain").remove()

    // Left axis
    g.append("g").call(d3.axisLeft(leftScale).tickFormat((d) => formatVal(d as number, leftMetric))).selectAll("text").attr("fill", "#94a3b8").style("font-size", "10px")
    g.append("text").attr("x", -margin.left / 2).attr("y", -20).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "13px").attr("font-weight", "600").text(LABELS[leftMetric])

    // Right axis
    g.append("g").attr("transform", `translate(${innerWidth},0)`).call(d3.axisRight(rightScale).tickFormat((d) => formatVal(d as number, rightMetric))).selectAll("text").attr("fill", "#94a3b8").style("font-size", "10px")
    g.append("text").attr("x", innerWidth + margin.right / 2).attr("y", -20).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "13px").attr("font-weight", "600").text(LABELS[rightMetric])

    // Draw slope lines
    const lines = g.selectAll<SVGLineElement, Company>(".slope-line")
      .data(validData)
      .join("line")
      .attr("class", "slope-line")
      .attr("x1", 0)
      .attr("y1", (d) => leftScale(d[leftMetric] as number))
      .attr("x2", innerWidth)
      .attr("y2", (d) => rightScale(d[rightMetric] as number))
      .attr("stroke", (d) => colorScale(d.investmentList || "Other"))
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        lines.attr("opacity", 0.1)
        d3.select(this).attr("opacity", 1).attr("stroke-width", 4).raise()
        if (!tooltipRef.current) return
        tooltipRef.current.style.visibility = "visible"
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
        tooltipRef.current.innerHTML = `<strong>${d.name}</strong><br>${LABELS[leftMetric]}: ${formatVal(d[leftMetric] as number, leftMetric)}<br>${LABELS[rightMetric]}: ${formatVal(d[rightMetric] as number, rightMetric)}<br>Country: ${d.country || "N/A"}<br>Category: ${(d.investmentList || "").replace(/^\d+-/, "") || "N/A"}`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
      })
      .on("mouseout", function () {
        lines.attr("opacity", 0.6).attr("stroke-width", 2)
        if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
      })

    // Left points
    g.selectAll<SVGCircleElement, Company>(".left-point")
      .data(validData)
      .join("circle")
      .attr("class", "left-point")
      .attr("cx", 0)
      .attr("cy", (d) => leftScale(d[leftMetric] as number))
      .attr("r", 4)
      .attr("fill", (d) => colorScale(d.investmentList || "Other"))
      .attr("stroke", (d) => colorScale(d.investmentList || "Other"))

    // Right points
    g.selectAll<SVGCircleElement, Company>(".right-point")
      .data(validData)
      .join("circle")
      .attr("class", "right-point")
      .attr("cx", innerWidth)
      .attr("cy", (d) => rightScale(d[rightMetric] as number))
      .attr("r", 4)
      .attr("fill", (d) => colorScale(d.investmentList || "Other"))
      .attr("stroke", (d) => colorScale(d.investmentList || "Other"))

    // Labels for top 10
    if (showLabels) {
      const top10 = validData.slice(0, 10)
      g.selectAll<SVGTextElement, Company>(".left-label")
        .data(top10)
        .join("text")
        .attr("class", "left-label")
        .attr("x", -8)
        .attr("y", (d) => leftScale(d[leftMetric] as number))
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "#cbd5e1")
        .attr("font-size", "10px")
        .text((d) => d.name.length > 15 ? d.name.slice(0, 13) + "…" : d.name)

      g.selectAll<SVGTextElement, Company>(".right-label")
        .data(top10)
        .join("text")
        .attr("class", "right-label")
        .attr("x", innerWidth + 8)
        .attr("y", (d) => rightScale(d[rightMetric] as number))
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("fill", "#cbd5e1")
        .attr("font-size", "10px")
        .text((d) => d.name.length > 15 ? d.name.slice(0, 13) + "…" : d.name)
    }
  }, [data, leftMetric, rightMetric, topN, showLabels])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Left Axis</label>
          <select value={leftMetric} onChange={(e) => setLeftMetric(e.target.value as LeftMetric)} className="text-xs bg-background border border-border rounded px-2 py-1">
            {LEFT_METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Right Axis</label>
          <select value={rightMetric} onChange={(e) => setRightMetric(e.target.value as RightMetric)} className="text-xs bg-background border border-border rounded px-2 py-1">
            {RIGHT_METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Top N</label>
          <input type="number" value={topN} onChange={(e) => setTopN(Math.max(5, Math.min(50, parseInt(e.target.value) || 20)))} min={5} max={50} className="w-16 text-xs bg-background border border-border rounded px-2 py-1" />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          Labels
        </label>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div ref={tooltipRef} style={{ position: "fixed", visibility: "hidden", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#f1f5f9", pointerEvents: "none", zIndex: 9999 }} />
      </div>
    </Card>
  )
}
