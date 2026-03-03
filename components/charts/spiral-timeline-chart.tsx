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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type SizeMetric = "funding" | "score" | "headcount"
type Density = "tight" | "medium" | "loose"

interface SpiralTimelineChartProps {
  data: Company[]
  className?: string
}

const CATEGORY_COLORS: string[] = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
  "#6366f1", "#84cc16", "#f97316", "#a78bfa",
]

export function SpiralTimelineChart({ data, className }: SpiralTimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMetric, setSizeMetric] = useState<SizeMetric>("funding")
  const [density, setDensity] = useState<Density>("medium")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = Math.max(680, container.clientHeight || 680)

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const validData = data.filter((d) => d.founded && d.founded > 1990 && d.founded <= 2026)
    if (validData.length === 0) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").attr("fill", "#94a3b8").text("No companies with founding year data")
      return
    }

    const sorted = [...validData].sort((a, b) => a.founded - b.founded)
    const minYear = d3.min(sorted, (d) => d.founded) ?? 2000
    const maxYear = d3.max(sorted, (d) => d.founded) ?? 2024

    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.42

    const densityMap: Record<Density, { spacing: number; rotations: number }> = {
      tight: { spacing: 12, rotations: 5 },
      medium: { spacing: 20, rotations: 4 },
      loose: { spacing: 30, rotations: 3 },
    }
    const { spacing, rotations } = densityMap[density]

    // Size scale
    let sizeScale: d3.ScalePower<number, number> | d3.ScaleLinear<number, number>
    if (sizeMetric === "funding") {
      sizeScale = d3.scaleSqrt().domain([0, d3.max(sorted, (d) => d.totalFunding) ?? 1e8]).range([4, 20])
    } else if (sizeMetric === "score") {
      sizeScale = d3.scaleLinear().domain([d3.min(sorted, (d) => d.weightedScore) ?? 0, d3.max(sorted, (d) => d.weightedScore) ?? 5]).range([4, 20])
    } else {
      sizeScale = d3.scaleSqrt().domain([0, d3.max(sorted, (d) => d.headcount) ?? 1000]).range([4, 20])
    }

    const categories = Array.from(new Set(sorted.map((d) => d.investmentList || "Other")))
    const colorScale = d3.scaleOrdinal(CATEGORY_COLORS).domain(categories)

    const g = svg.append("g")

    // Draw spiral guide
    const spiralPts: [number, number][] = []
    for (let i = 0; i <= 500; i++) {
      const p = i / 500
      const angle = p * rotations * 2 * Math.PI
      const r = p * maxRadius
      spiralPts.push([centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)])
    }
    g.append("path")
      .datum(spiralPts)
      .attr("d", d3.line().curve(d3.curveNatural))
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.4)

    // Year labels
    const yearStep = Math.max(1, Math.floor((maxYear - minYear) / 7))
    for (let yr = minYear; yr <= maxYear; yr += yearStep) {
      const p = (maxYear > minYear) ? (yr - minYear) / (maxYear - minYear) : 0
      const angle = p * rotations * 2 * Math.PI
      const r = p * maxRadius
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)
      g.append("text")
        .attr("x", x)
        .attr("y", y - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 11)
        .attr("font-weight", "600")
        .text(yr)
    }

    // Center dot
    g.append("circle").attr("cx", centerX).attr("cy", centerY).attr("r", 5).attr("fill", "#3b82f6").attr("opacity", 0.6)

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "spiral-tooltip")
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

    const yearGroups = d3.group(sorted, (d) => d.founded)

    sorted.forEach((company, idx) => {
      const p = (maxYear > minYear) ? (company.founded - minYear) / (maxYear - minYear) : 0
      const baseAngle = p * rotations * 2 * Math.PI
      const baseRadius = p * maxRadius

      const yearCompanies = yearGroups.get(company.founded) ?? []
      const yearIdx = yearCompanies.indexOf(company)
      const jitter = (yearIdx / Math.max(1, yearCompanies.length - 1) - 0.5) * spacing * 0.8
      const angle = baseAngle + (Math.random() - 0.5) * 0.15
      const radius = baseRadius + jitter

      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      const size = sizeMetric === "funding"
        ? (sizeScale as d3.ScalePower<number, number>)(company.totalFunding || 0)
        : sizeMetric === "score"
          ? (sizeScale as d3.ScaleLinear<number, number>)(company.weightedScore || 0)
          : (sizeScale as d3.ScalePower<number, number>)(company.headcount || 0)

      const color = colorScale(company.investmentList || "Other")

      const circle = g
        .append("circle")
        .attr("class", "spiral-point")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", 0)
        .attr("fill", color)
        .attr("fill-opacity", 0.8)
        .style("cursor", "pointer")

      circle
        .transition()
        .duration(800)
        .delay(idx * 4)
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)

      circle
        .on("mouseover", function (event) {
          d3.select(this).attr("fill-opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2)
          const metricText =
            sizeMetric === "funding" ? `Funding: ${formatCurrency(company.totalFunding)}`
            : sizeMetric === "score" ? `Score: ${company.weightedScore?.toFixed(2)}`
            : `Headcount: ${company.headcount ?? 0}`
          tooltip.style("opacity", "1").html(
            `<strong>${company.name}</strong><br>Founded: ${company.founded}<br>${metricText}<br><em style="font-size:11px;color:#64748b">Click for details</em>`
          )
        })
        .on("mousemove", (event: MouseEvent) => {
          tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 10}px`)
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.8).attr("stroke", null)
          tooltip.style("opacity", "0")
        })
        .on("click", () => setSelectedCompany(company))
    })

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 26)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", 16)
      .attr("font-weight", "700")
      .text("Startup Ecosystem Evolution — Spiral Through Time")

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 5]).on("zoom", (event) => {
      g.attr("transform", event.transform.toString())
    })
    svg.call(zoom)

    return () => {
      d3.selectAll(".spiral-tooltip").remove()
    }
  }, [data, sizeMetric, density])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Size by</Label>
          <Select value={sizeMetric} onValueChange={(v) => setSizeMetric(v as SizeMetric)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="funding">Funding</SelectItem>
              <SelectItem value="score">Weighted Score</SelectItem>
              <SelectItem value="headcount">Headcount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Density</Label>
          <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">Tight</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="loose">Loose</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground self-end pb-1">Scroll to zoom, drag to pan.</p>
      </div>
      <div ref={containerRef} className="relative w-full h-[620px] border border-border/40 rounded-xl overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

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
                  <Badge variant="outline">Founded {selectedCompany.founded}</Badge>
                  <Badge variant="outline">{selectedCompany.investmentList?.replace(/^\d+-/, "")}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Weighted Score", selectedCompany.weightedScore?.toFixed(2)],
                    ["Total Funding", formatCurrency(selectedCompany.totalFunding)],
                    ["Market Opportunity", selectedCompany.marketOpportunity?.toFixed(2)],
                    ["Team Execution", selectedCompany.teamExecution?.toFixed(2)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-semibold text-primary">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
