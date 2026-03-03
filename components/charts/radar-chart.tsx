"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface RadarChartProps {
  data: Company[]
  className?: string
}

const METRICS = [
  { key: "marketOpportunity" as keyof Company, label: "Market Opportunity" },
  { key: "teamExecution" as keyof Company, label: "Team & Execution" },
  { key: "techDifferentiation" as keyof Company, label: "Tech Differentiation" },
  { key: "fundingEfficiency" as keyof Company, label: "Funding Efficiency" },
  { key: "growthMetrics" as keyof Company, label: "Growth Metrics" },
  { key: "industryImpact" as keyof Company, label: "Industry Impact" },
]

export function RadarChart({ data, className }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const tooltipRef = useRef<HTMLDivElement>(null)

  const sortedData = [...data]
    .filter((d) => d.weightedScore > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore)

  const filtered = sortedData.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleCompany(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name].slice(-8)
    )
  }

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const items = selected
      .map((name) => {
        const d = data.find((c) => c.name === name)
        return d ? { name: d.name, values: METRICS.map((m) => (d[m.key] as number) || 0) } : null
      })
      .filter(Boolean) as { name: string; values: number[] }[]

    if (items.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .text("Select companies from the list to compare")
      return
    }

    const radius = Math.min(width, height) / 2 - 80
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(items.map((i) => i.name))
    const angleSlice = (Math.PI * 2) / METRICS.length
    const maxValue = 5

    // Grid circles
    for (let level = 1; level <= 5; level++) {
      g.append("circle")
        .attr("r", (radius / 5) * level)
        .attr("fill", "none")
        .attr("stroke", "#334155")
        .attr("stroke-dasharray", "2,2")
    }

    // Axes
    METRICS.forEach((metric, i) => {
      const angle = angleSlice * i - Math.PI / 2
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", Math.cos(angle) * radius)
        .attr("y2", Math.sin(angle) * radius)
        .attr("stroke", "#475569")
        .attr("stroke-width", 1)

      g.append("text")
        .attr("x", Math.cos(angle) * (radius + 32))
        .attr("y", Math.sin(angle) * (radius + 32))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("fill", "#94a3b8")
        .text(metric.label)
    })

    // Radar areas
    const radarLine = d3
      .lineRadial<number>()
      .radius((d) => (d / maxValue) * radius)
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed)

    items.forEach((item) => {
      const color = colorScale(item.name)

      g.append("path")
        .datum(item.values)
        .attr("d", radarLine)
        .attr("fill", color)
        .attr("fill-opacity", 0.3)
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .on("mouseover", function () {
          d3.select(this).attr("fill-opacity", 0.5).attr("stroke-width", 3)
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.3).attr("stroke-width", 2)
        })
        .on("mousemove", (event) => {
          if (!tooltipRef.current) return
          tooltipRef.current.style.visibility = "visible"
          tooltipRef.current.style.top = `${event.pageY - 10}px`
          tooltipRef.current.style.left = `${event.pageX + 15}px`
          tooltipRef.current.innerHTML = `<strong>${item.name}</strong><br>${METRICS.map((m, i) => `${m.label}: ${item.values[i].toFixed(1)}`).join("<br>")}`
        })
        .on("mouseleave", () => {
          if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
        })
    })
  }, [data, selected])

  return (
    <Card className={cn("flex flex-col lg:flex-row gap-0 overflow-hidden", className)}>
      {/* Company selector panel */}
      <div className="w-full lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">SELECT COMPANIES (max 8)</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.slice(0, 100).map((company) => {
            const isSelected = selected.includes(company.name)
            return (
              <button
                key={company.id}
                onClick={() => toggleCompany(company.name)}
                className={cn(
                  "w-full text-left text-xs px-2 py-1.5 rounded transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {company.name}
              </button>
            )
          })}
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="m-2 text-xs text-muted-foreground hover:text-destructive border border-border rounded px-2 py-1"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0 relative" style={{ minHeight: 400 }}>
        <svg ref={svgRef} className="w-full h-full" />
        {/* Legend */}
        {selected.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {selected.map((name, i) => (
              <div key={name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ background: d3.schemeTableau10[i % 10] }}
                />
                {name}
              </div>
            ))}
          </div>
        )}
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            visibility: "hidden",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "11px",
            color: "#f1f5f9",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      </div>
    </Card>
  )
}
