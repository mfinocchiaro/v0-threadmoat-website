"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"
import { formatCurrency } from "@/lib/company-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface SplomChartProps {
  data: Company[]
  className?: string
}

interface Column {
  name: string
  key: keyof Company
}

const ALL_COLUMNS: Column[] = [
  { name: "Weighted Score", key: "weightedScore" },
  { name: "Total Funding", key: "totalFunding" },
  { name: "Market Opp.", key: "marketOpportunity" },
  { name: "Tech Diff.", key: "techDifferentiation" },
  { name: "Fund. Efficiency", key: "fundingEfficiency" },
  { name: "Headcount", key: "headcount" },
]

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
]

export function SplomChart({ data, className }: SplomChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const columns = ALL_COLUMNS
    const n = columns.length
    const padding = 20
    const size = Math.floor((width - 60) / n)
    const height = size * n + 60

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const investmentCategories = Array.from(new Set(data.map((d) => d.investmentList || "Other")))
    const colorScale = d3.scaleOrdinal(COLORS).domain(investmentCategories)

    const xScales = columns.map((c) =>
      d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[c.key] as number) as [number, number])
        .nice()
        .range([padding / 2, size - padding / 2])
    )
    const yScales = columns.map((c) =>
      d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[c.key] as number) as [number, number])
        .nice()
        .range([size - padding / 2, padding / 2])
    )

    const g = svg.append("g").attr("transform", "translate(30,30)")

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "splom-tooltip")
      .style("position", "fixed")
      .style("background", "rgba(15,23,42,0.95)")
      .style("border", "1px solid #334155")
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("color", "#f1f5f9")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")

    const pairs = d3.cross(d3.range(n), d3.range(n))

    const cell = g
      .selectAll<SVGGElement, [number, number]>("g.cell")
      .data(pairs)
      .join("g")
      .attr("class", "cell")
      .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`)

    cell
      .append("rect")
      .attr("fill", "rgba(30,41,59,0.4)")
      .attr("stroke", "#334155")
      .attr("x", padding / 2)
      .attr("y", padding / 2)
      .attr("width", size - padding)
      .attr("height", size - padding)

    // Diagonal: histograms
    cell
      .filter(([i, j]) => i === j)
      .each(function ([i]) {
        const colKey = columns[i].key
        const values = data.map((d) => (d[colKey] as number) || 0)
        const histScale = xScales[i]
        const bins = d3
          .bin()
          .domain(histScale.domain() as [number, number])
          .thresholds(histScale.ticks(8))(values)

        const maxBin = d3.max(bins, (b) => b.length) ?? 1
        const histY = d3
          .scaleLinear()
          .domain([0, maxBin])
          .range([size - padding / 2, padding / 2])

        d3.select(this)
          .selectAll("rect.bin")
          .data(bins)
          .join("rect")
          .attr("class", "bin")
          .attr("x", (b) => histScale(b.x0 ?? 0) + 1)
          .attr("width", (b) => Math.max(0, histScale(b.x1 ?? 0) - histScale(b.x0 ?? 0) - 1))
          .attr("y", (b) => histY(b.length))
          .attr("height", (b) => size - padding / 2 - histY(b.length))
          .attr("fill", "#3b82f6")
          .attr("fill-opacity", 0.7)
      })

    // Off-diagonal: scatter
    cell
      .filter(([i, j]) => i !== j)
      .each(function ([i, j]) {
        d3.select(this)
          .selectAll<SVGCircleElement, Company>("circle")
          .data(data)
          .join("circle")
          .attr("cx", (d) => xScales[i]((d[columns[i].key] as number) || 0))
          .attr("cy", (d) => yScales[j]((d[columns[j].key] as number) || 0))
          .attr("r", 2.5)
          .attr("fill", (d) => colorScale(d.investmentList || "Other"))
          .attr("fill-opacity", 0.7)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 4).attr("fill-opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1.5)
            tooltip.style("opacity", "1").html(
              `<strong>${d.name}</strong><br>${columns[i].name}: ${((d[columns[i].key] as number) || 0).toFixed(2)}<br>${columns[j].name}: ${((d[columns[j].key] as number) || 0).toFixed(2)}`
            )
          })
          .on("mousemove", (event: MouseEvent) => {
            tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 10}px`)
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", 2.5).attr("fill-opacity", 0.7).attr("stroke", "none")
            tooltip.style("opacity", "0")
          })
          .on("click", (_, d) => setSelectedCompany(d))
      })

    // Column labels (top)
    g.selectAll("text.col-label")
      .data(columns)
      .join("text")
      .attr("class", "col-label")
      .attr("transform", (_, i) => `translate(${i * size + size / 2},-8)`)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 9)
      .attr("font-weight", "600")
      .text((d) => d.name)

    // Row labels (left)
    g.selectAll("text.row-label")
      .data(columns)
      .join("text")
      .attr("class", "row-label")
      .attr("transform", (_, j) => `translate(-8,${j * size + size / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 9)
      .attr("font-weight", "600")
      .text((d) => d.name)

    return () => {
      d3.selectAll(".splom-tooltip").remove()
    }
  }, [data])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <svg ref={svgRef} className="w-full h-full" />

      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-lg">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCompany.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedCompany.country}</Badge>
                  <Badge variant="outline">{selectedCompany.investmentList?.replace(/^\d+-/, "")}</Badge>
                  {selectedCompany.startupLifecyclePhase && (
                    <Badge variant="outline">{selectedCompany.startupLifecyclePhase}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Weighted Score", selectedCompany.weightedScore?.toFixed(2)],
                    ["Total Funding", formatCurrency(selectedCompany.totalFunding)],
                    ["Market Opportunity", selectedCompany.marketOpportunity?.toFixed(2)],
                    ["Tech Differentiation", selectedCompany.techDifferentiation?.toFixed(2)],
                    ["Funding Efficiency", selectedCompany.fundingEfficiency?.toFixed(2)],
                    ["Headcount", selectedCompany.headcount?.toString() ?? "N/A"],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-semibold text-primary">{value}</div>
                    </div>
                  ))}
                </div>
                {selectedCompany.strengths && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Strengths</div>
                    <p className="text-sm">{selectedCompany.strengths}</p>
                  </div>
                )}
                {selectedCompany.weaknesses && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Weaknesses</div>
                    <p className="text-sm">{selectedCompany.weaknesses}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
