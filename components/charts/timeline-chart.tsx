"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TimelineChartProps {
  data: Company[]
  className?: string
}

interface YearModal {
  year: number
  companies: Company[]
}

export function TimelineChart({ data, className }: TimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [modal, setModal] = useState<YearModal | null>(null)
  const [sortBy, setSortBy] = useState<"funding" | "score" | "name" | "headcount">("funding")

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const yearData = d3.rollup(
      data.filter((d) => d.founded && d.founded >= 2010),
      (v) => v.length,
      (d) => d.founded
    )

    const aggregatedData = Array.from(yearData, ([year, count]) => ({ year: +year, count })).sort(
      (a, b) => a.year - b.year
    )

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    if (aggregatedData.length === 0) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "hsl(var(--muted-foreground))").text("No data matches the current filters")
      return
    }

    const xScale = d3.scaleBand().domain(aggregatedData.map((d) => String(d.year))).range([0, innerWidth]).padding(0.2)
    const yScale = d3.scaleLinear().domain([0, (d3.max(aggregatedData, (d) => d.count) ?? 0) * 1.1]).range([innerHeight, 0])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % 2 === 0)))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("fill", "hsl(var(--muted-foreground))")

    // Y axis
    g.append("g").call(d3.axisLeft(yScale)).selectAll("text").attr("fill", "hsl(var(--muted-foreground))")

    // Axis labels
    g.append("text").attr("x", innerWidth / 2).attr("y", innerHeight + 50).attr("text-anchor", "middle").attr("fill", "hsl(var(--muted-foreground))").attr("font-size", "11px").text("Year Founded")
    g.append("text").attr("transform", "rotate(-90)").attr("x", -innerHeight / 2).attr("y", -42).attr("text-anchor", "middle").attr("fill", "hsl(var(--muted-foreground))").attr("font-size", "11px").text("Number of Companies")

    // Title
    svg.append("text").attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle").attr("fill", "hsl(var(--foreground))").attr("font-size", "14px").attr("font-weight", "600").text("AI PLM Startups Founded Per Year")

    // Grid
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""))
      .selectAll("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-dasharray", "2,2")

    g.select(".grid .domain").remove()

    // Bars
    g.selectAll<SVGRectElement, { year: number; count: number }>(".bar")
      .data(aggregatedData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(String(d.year)) ?? 0)
      .attr("y", (d) => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.count))
      .attr("fill", "hsl(var(--primary))")
      .attr("rx", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "hsl(var(--primary) / 0.8)")
        if (!tooltipRef.current) return
        tooltipRef.current.style.visibility = "visible"
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 10}px`
        tooltipRef.current.innerHTML = `<strong>Year:</strong> ${d.year}<br><strong>Companies:</strong> ${d.count}<br><em style="font-size:0.8em;color:hsl(var(--muted-foreground));">Click for details</em>`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 10}px`
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "hsl(var(--primary))")
        if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
      })
      .on("click", (_, d) => {
        const companies = data.filter((c) => c.founded === d.year)
        setModal({ year: d.year, companies })
      })
  }, [data])

  const sortedModalCompanies = modal
    ? [...modal.companies].sort((a, b) => {
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
        <div
          ref={tooltipRef}
          style={{ position: "fixed", visibility: "hidden", background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "hsl(var(--popover-foreground))", pointerEvents: "none", zIndex: 9999 }}
        />
      </div>

      {/* Year detail modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">Companies Founded in {modal.year}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4 bg-background border-b border-border">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{modal.companies.length}</div>
                <div className="text-xs text-muted-foreground uppercase">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{formatCurrency(d3.sum(modal.companies, (c) => c.totalFunding))}</div>
                <div className="text-xs text-muted-foreground uppercase">Total Funding</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{formatCurrency(d3.mean(modal.companies, (c) => c.totalFunding) ?? 0)}</div>
                <div className="text-xs text-muted-foreground uppercase">Avg Funding</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{(d3.mean(modal.companies, (c) => c.weightedScore) ?? 0).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground uppercase">Avg Score</div>
              </div>
            </div>
            <div className="flex gap-2 p-3 border-b border-border flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Sort:</span>
              {(["funding", "score", "name", "headcount"] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)} className={cn("text-xs px-3 py-1 rounded border", sortBy === s ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedModalCompanies.map((c) => (
                <div key={c.id} className="bg-background border border-border rounded-lg p-3 text-sm">
                  <div className="font-semibold mb-1">{c.name}</div>
                  <div className="text-muted-foreground text-xs space-y-0.5">
                    <div className="flex justify-between"><span>Funding:</span><span className="text-primary font-medium">{formatCurrency(c.totalFunding)}</span></div>
                    <div className="flex justify-between"><span>Score:</span><span>{c.weightedScore.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Country:</span><span>{c.country || "N/A"}</span></div>
                    <div className="flex justify-between"><span>Headcount:</span><span>{c.headcount || "N/A"}</span></div>
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
