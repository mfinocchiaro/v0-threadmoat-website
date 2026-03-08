"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"
import { formatCurrency } from "@/lib/company-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type DimensionKey = "investmentList" | "country" | "subsegment" | "lifecyclePhase" | "latestFundingRound" | "manufacturingType" | "subcategories" | "startupLifecyclePhase"
type MetricKey = "count" | "totalFunding" | "avgScore"

interface MarimekkoChartProps {
  data: Company[]
  className?: string
}

const FUNDING_ROUND_ORDER = [
  "Stealth", "Bootstrapped", "Angel Round", "Grants", "Corporate Venture",
  "Pre-Seed", "Seed",
  "Series A", "Series B", "Series C", "Series D", "Series E", "Series F",
  "Undisclosed or unknown",
]

function normalizeKey(val: string | undefined, dim: DimensionKey): string {
  if (!val) return dim === "latestFundingRound" ? "Undisclosed or unknown" : "Unknown"
  if (dim === "investmentList") return val.replace(/^\d+-/, "").trim()
  return val.trim()
}

function getDimLabel(dim: DimensionKey): string {
  return {
    investmentList: "Investment List",
    country: "Country",
    subsegment: "Subsegment",
    lifecyclePhase: "Lifecycle Phase",
    latestFundingRound: "Funding Round",
    manufacturingType: "Manufacturing Type",
    subcategories: "Subcategory",
    startupLifecyclePhase: "Startup Lifecycle",
  }[dim]
}

function sortCategories(cats: string[], dim: DimensionKey, totals: Map<string, number>): string[] {
  if (dim === "latestFundingRound") {
    return cats.sort((a, b) => {
      const ai = FUNDING_ROUND_ORDER.indexOf(a)
      const bi = FUNDING_ROUND_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return (totals.get(b) ?? 0) - (totals.get(a) ?? 0)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }
  return cats.sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0))
}

function getMetricLabel(m: MetricKey): string {
  return { count: "Company Count", totalFunding: "Total Funding", avgScore: "Avg Score" }[m]
}

function formatValue(val: number, metric: MetricKey): string {
  if (metric === "totalFunding") return formatCurrency(val)
  if (metric === "avgScore") return val.toFixed(2)
  return String(Math.round(val))
}

export function MarimekkoChart({ data, className }: MarimekkoChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [widthDim, setWidthDim] = useState<DimensionKey>("investmentList")
  const [heightDim, setHeightDim] = useState<DimensionKey>("country")
  const [metric, setMetric] = useState<MetricKey>("count")

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 900
    const height = Math.max(600, container.clientHeight || 600)
    const margin = { top: 80, right: 40, bottom: 120, left: 130 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    if (widthDim === heightDim) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .text("Width and Height dimensions must be different")
      return
    }

    // Build nested rollup
    const nested = d3.rollup(
      data,
      (v) => {
        if (metric === "count") return v.length
        if (metric === "totalFunding") return d3.sum(v, (d) => d.totalFunding || 0)
        return d3.mean(v, (d) => d.weightedScore || 0) ?? 0
      },
      (d) => normalizeKey(d[widthDim] as string | undefined, widthDim),
      (d) => normalizeKey(d[heightDim] as string | undefined, heightDim)
    )

    const widthTotals = new Map<string, number>()
    const heightTotals = new Map<string, number>()
    let grandTotal = 0

    nested.forEach((heightMap, wKey) => {
      let wTotal = 0
      heightMap.forEach((val, hKey) => {
        wTotal += val
        heightTotals.set(hKey, (heightTotals.get(hKey) ?? 0) + val)
        grandTotal += val
      })
      widthTotals.set(wKey, wTotal)
    })

    if (grandTotal === 0) return

    const widthCats = sortCategories(Array.from(widthTotals.keys()), widthDim, widthTotals).slice(0, 14)
    const heightCats = sortCategories(Array.from(heightTotals.keys()), heightDim, heightTotals).slice(0, 12)

    // Cells
    interface Cell {
      wCat: string; hCat: string; value: number
      x: number; y: number; w: number; h: number
    }

    const widthSubtotal = widthCats.reduce((s, k) => s + (widthTotals.get(k) ?? 0), 0)
    const heightSubtotal = heightCats.reduce((s, k) => s + (heightTotals.get(k) ?? 0), 0)
    const denomW = widthSubtotal || 1
    const denomH = heightSubtotal || 1

    const cells: Cell[] = []
    let xPos = 0
    widthCats.forEach((wCat) => {
      const wVal = widthTotals.get(wCat) ?? 0
      const cellW = (wVal / denomW) * innerWidth
      let yPos = 0
      heightCats.forEach((hCat) => {
        const hVal = heightTotals.get(hCat) ?? 0
        const cellH = (hVal / denomH) * innerHeight
        const value = nested.get(wCat)?.get(hCat) ?? 0
        cells.push({ wCat, hCat, value, x: xPos, y: yPos, w: cellW, h: cellH })
        yPos += cellH
      })
      xPos += cellW
    })

    const maxVal = d3.max(cells, (c) => c.value) ?? 1
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "marimekko-tooltip")
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

    g.selectAll("rect.cell")
      .data(cells.filter((c) => c.value > 0))
      .join("rect")
      .attr("class", "cell")
      .attr("x", (c) => c.x)
      .attr("y", (c) => c.y)
      .attr("width", (c) => c.w)
      .attr("height", (c) => c.h)
      .attr("fill", (c) => colorScale(c.value))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseover", function (event, c) {
        d3.select(this).attr("opacity", 1)
        tooltip.style("opacity", "1").html(
          `<strong>${c.wCat} × ${c.hCat}</strong><br>${getMetricLabel(metric)}: ${formatValue(c.value, metric)}<br>${((c.value / grandTotal) * 100).toFixed(1)}% of total`
        )
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 10}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.85)
        tooltip.style("opacity", "0")
      })

    // Cell labels
    g.selectAll("text.cell-lbl")
      .data(cells.filter((c) => c.value > 0 && c.w > 45 && c.h > 28))
      .join("text")
      .attr("class", "cell-lbl")
      .attr("x", (c) => c.x + c.w / 2)
      .attr("y", (c) => c.y + c.h / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", 10)
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text((c) => formatValue(c.value, metric))

    // Width labels
    let xLbl = 0
    widthCats.forEach((cat) => {
      const catW = ((widthTotals.get(cat) ?? 0) / denomW) * innerWidth
      g.append("text")
        .attr("x", xLbl + catW / 2)
        .attr("y", innerHeight + 14)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(cat.length > 14 ? cat.slice(0, 12) + "…" : cat)
      g.append("text")
        .attr("x", xLbl + catW / 2)
        .attr("y", innerHeight + 28)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", 9)
        .text(formatValue(widthTotals.get(cat) ?? 0, metric))
      xLbl += catW
    })

    // Height labels
    let yLbl = 0
    heightCats.forEach((cat) => {
      const catH = ((heightTotals.get(cat) ?? 0) / denomH) * innerHeight
      g.append("text")
        .attr("x", -10)
        .attr("y", yLbl + catH / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(cat.length > 14 ? cat.slice(0, 12) + "…" : cat)
      yLbl += catH
    })

    // Axis titles
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .text(getDimLabel(widthDim))

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .text(getDimLabel(heightDim))

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", 15)
      .attr("font-weight", "700")
      .text(`Market Concentration: ${getDimLabel(widthDim)} × ${getDimLabel(heightDim)}`)

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 42)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 11)
      .text(`Cell size = ${getMetricLabel(metric).toLowerCase()} · ${data.length} companies`)

    return () => {
      d3.selectAll(".marimekko-tooltip").remove()
    }
  }, [data, widthDim, heightDim, metric])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Width dimension</Label>
          <Select value={widthDim} onValueChange={(v) => setWidthDim(v as DimensionKey)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="investmentList">Investment List</SelectItem>
              <SelectItem value="latestFundingRound">Funding Round</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="subsegment">Subsegment</SelectItem>
              <SelectItem value="lifecyclePhase">Lifecycle Phase</SelectItem>
              <SelectItem value="manufacturingType">Manufacturing Type</SelectItem>
              <SelectItem value="subcategories">Subcategory</SelectItem>
              <SelectItem value="startupLifecyclePhase">Startup Lifecycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Height dimension</Label>
          <Select value={heightDim} onValueChange={(v) => setHeightDim(v as DimensionKey)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="investmentList">Investment List</SelectItem>
              <SelectItem value="latestFundingRound">Funding Round</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="subsegment">Subsegment</SelectItem>
              <SelectItem value="lifecyclePhase">Lifecycle Phase</SelectItem>
              <SelectItem value="manufacturingType">Manufacturing Type</SelectItem>
              <SelectItem value="subcategories">Subcategory</SelectItem>
              <SelectItem value="startupLifecyclePhase">Startup Lifecycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Metric</Label>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Company Count</SelectItem>
              <SelectItem value="totalFunding">Total Funding</SelectItem>
              <SelectItem value="avgScore">Avg Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div ref={containerRef} className="relative w-full h-[580px]">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  )
}
