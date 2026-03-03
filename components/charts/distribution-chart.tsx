"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DistributionChartProps {
  data: Company[]
  className?: string
}

interface CategorySummary {
  key: string
  q1: number
  median: number
  q3: number
  min: number
  max: number
  values: Company[]
}

interface CategoryModal {
  summary: CategorySummary
}

function getInvestmentColor(key: string): string {
  const scale = d3.scaleOrdinal(d3.schemeTableau10)
  return scale(key)
}

export function DistributionChart({ data, className }: DistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [modal, setModal] = useState<CategoryModal | null>(null)
  const [sortBy, setSortBy] = useState<"funding" | "score" | "name" | "headcount">("funding")

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const margin = { top: 50, right: 40, bottom: 120, left: 100 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const fundingData = data.filter((d) => d.totalFunding > 0)
    const groupedData = d3.group(fundingData, (d) => d.investmentList || "Unknown")

    const summaryData: CategorySummary[] = Array.from(groupedData, ([key, values]) => {
      const fv = values.map((d) => d.totalFunding).sort(d3.ascending)
      return {
        key,
        q1: d3.quantile(fv, 0.25)!,
        median: d3.quantile(fv, 0.5)!,
        q3: d3.quantile(fv, 0.75)!,
        min: d3.min(fv)!,
        max: d3.max(fv)!,
        values,
      }
    }).sort((a, b) => b.median - a.median)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    if (summaryData.length === 0) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "#94a3b8").text("No data matches the current filters")
      return
    }

    const xScale = d3.scaleBand()
      .domain(summaryData.map((d) => d.key.replace(/^\d+-/, "")))
      .range([0, innerWidth])
      .padding(0.4)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(summaryData, (d) => d.max) ?? 1])
      .range([innerHeight, 0])
      .nice()

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Title
    svg.append("text").attr("x", width / 2).attr("y", 28).attr("text-anchor", "middle").attr("fill", "#f1f5f9").attr("font-size", "15px").attr("font-weight", "600").text("Funding Distribution by Investment Category")

    // Axes
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale))
      .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end").attr("fill", "#94a3b8").style("font-size", "10px")
    g.append("g").call(d3.axisLeft(yScale).tickFormat((d) => formatCurrency(d as number))).selectAll("text").attr("fill", "#94a3b8")

    // Labels
    g.append("text").attr("x", innerWidth / 2).attr("y", innerHeight + 95).attr("text-anchor", "middle").attr("fill", "#64748b").attr("font-size", "11px").text("Investment List")
    g.append("text").attr("transform", "rotate(-90)").attr("x", -innerHeight / 2).attr("y", -75).attr("text-anchor", "middle").attr("fill", "#64748b").attr("font-size", "11px").text("Total Funding")

    const boxWidth = xScale.bandwidth()
    const tooltip = d3.select(tooltipRef.current!)

    const boxes = g.selectAll<SVGGElement, CategorySummary>(".box")
      .data(summaryData)
      .join("g")
      .attr("class", "box")
      .attr("transform", (d) => `translate(${xScale(d.key.replace(/^\d+-/, ""))},0)`)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).select("rect").attr("stroke-width", 3)
        tooltip.style("visibility", "visible").style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`)
          .html(`<strong>${d.key.replace(/^\d+-/, "")}</strong><br>Companies: ${d.values.length}<br>Median: ${formatCurrency(d.median)}<br>Q3: ${formatCurrency(d.q3)}<br>Q1: ${formatCurrency(d.q1)}<br>Max: ${formatCurrency(d.max)}<br>Min: ${formatCurrency(d.min)}<br><em style="font-size:0.8em;color:#94a3b8;">Click to explore</em>`)
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`)
      })
      .on("mouseout", function () {
        d3.select(this).select("rect").attr("stroke-width", 2)
        tooltip.style("visibility", "hidden")
      })
      .on("click", (_, d) => setModal({ summary: d }))

    // Whisker
    boxes.append("line").attr("x1", boxWidth / 2).attr("x2", boxWidth / 2).attr("y1", (d) => yScale(d.min)).attr("y2", (d) => yScale(d.max)).attr("stroke", "#94a3b8").attr("stroke-width", 1.5)

    // Box rect
    boxes.append("rect")
      .attr("x", 0).attr("y", (d) => yScale(d.q3))
      .attr("width", boxWidth).attr("height", (d) => Math.max(0, yScale(d.q1) - yScale(d.q3)))
      .attr("fill", (d) => getInvestmentColor(d.key)).attr("stroke", "white").attr("stroke-width", 2)

    // Median
    boxes.append("line").attr("x1", 0).attr("x2", boxWidth).attr("y1", (d) => yScale(d.median)).attr("y2", (d) => yScale(d.median)).attr("stroke", "white").attr("stroke-width", 2)

    // Min/max caps
    boxes.append("line").attr("x1", boxWidth * 0.25).attr("x2", boxWidth * 0.75).attr("y1", (d) => yScale(d.min)).attr("y2", (d) => yScale(d.min)).attr("stroke", "#94a3b8").attr("stroke-width", 1.5)
    boxes.append("line").attr("x1", boxWidth * 0.25).attr("x2", boxWidth * 0.75).attr("y1", (d) => yScale(d.max)).attr("y2", (d) => yScale(d.max)).attr("stroke", "#94a3b8").attr("stroke-width", 1.5)
  }, [data])

  const sortedCompanies = modal
    ? [...modal.summary.values].sort((a, b) => {
        if (sortBy === "funding") return b.totalFunding - a.totalFunding
        if (sortBy === "score") return b.weightedScore - a.weightedScore
        if (sortBy === "name") return a.name.localeCompare(b.name)
        return (b.headcount || 0) - (a.headcount || 0)
      })
    : []

  return (
    <Card className={cn("flex flex-col", className)}>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div ref={tooltipRef} style={{ position: "fixed", visibility: "hidden", background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "#f1f5f9", pointerEvents: "none", zIndex: 9999 }} />
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card to-background">
              <div>
                <h2 className="text-xl font-bold text-primary">{modal.summary.key.replace(/^\d+-/, "")}</h2>
                <p className="text-sm text-muted-foreground">{modal.summary.values.length} companies in this category</p>
              </div>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:bg-primary hover:text-white rounded-full w-9 h-9 flex items-center justify-center text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-5 gap-3 p-4 bg-background border-b border-border">
              {[
                { label: "Companies", val: String(modal.summary.values.length) },
                { label: "Total Funding", val: formatCurrency(d3.sum(modal.summary.values, (c) => c.totalFunding)) },
                { label: "Median Funding", val: formatCurrency(modal.summary.median) },
                { label: "Avg Score", val: (d3.mean(modal.summary.values, (c) => c.weightedScore) ?? 0).toFixed(2) },
                { label: "Avg Headcount", val: String(Math.round(d3.mean(modal.summary.values, (c) => c.headcount) ?? 0)) },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-bold text-primary">{s.val}</div>
                  <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-3 border-b border-border flex-wrap">
              {(["funding", "score", "name", "headcount"] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)} className={cn("text-xs px-3 py-1 rounded border", sortBy === s ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                  Sort by {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedCompanies.map((c) => (
                <div key={c.id} className="bg-background border border-border rounded-lg p-3 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-primary font-bold text-sm">{formatCurrency(c.totalFunding)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex justify-between"><span>Score:</span><span className="bg-primary text-primary-foreground px-1.5 rounded text-xs">{c.weightedScore.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>{c.country || "N/A"}</span><span>{c.headcount || "N/A"} people</span></div>
                    {c.industriesServed && c.industriesServed.length > 0 && <div className="truncate">{c.industriesServed.slice(0, 2).join(", ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
