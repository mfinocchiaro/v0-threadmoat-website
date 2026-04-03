"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { cn, contrastTextColor } from "@/lib/utils"
import type { Company } from "@/lib/company-data"

interface CorrelationMatrixChartProps {
  data: Company[]
  className?: string
}

interface MetricDef {
  key: keyof Company
  label: string
  shortLabel: string
}

const METRICS: MetricDef[] = [
  { key: "marketOpportunity", label: "Market Opportunity", shortLabel: "Market Opp." },
  { key: "teamExecution", label: "Team Execution", shortLabel: "Team Exec." },
  { key: "techDifferentiation", label: "Tech Differentiation", shortLabel: "Tech Diff." },
  { key: "fundingEfficiency", label: "Funding Efficiency", shortLabel: "Fund. Eff." },
  { key: "growthMetrics", label: "Growth Metrics", shortLabel: "Growth" },
  { key: "industryImpact", label: "Industry Impact", shortLabel: "Industry" },
  { key: "competitiveMoat", label: "Competitive Moat", shortLabel: "Moat" },
  { key: "totalFunding", label: "Total Funding", shortLabel: "Funding" },
  { key: "headcount", label: "Headcount", shortLabel: "Headcount" },
]

function pearson(data: Company[], k1: keyof Company, k2: keyof Company): number {
  const pairs = data
    .map((d) => [d[k1] as number, d[k2] as number])
    .filter(([x, y]) => x != null && y != null && !isNaN(x) && !isNaN(y) && x > 0 && y > 0)

  if (pairs.length < 2) return 0
  const n = pairs.length
  const s1 = d3.sum(pairs, (p) => p[0])
  const s2 = d3.sum(pairs, (p) => p[1])
  const s1q = d3.sum(pairs, (p) => p[0] * p[0])
  const s2q = d3.sum(pairs, (p) => p[1] * p[1])
  const sp = d3.sum(pairs, (p) => p[0] * p[1])
  const num = sp - (s1 * s2) / n
  const den = Math.sqrt((s1q - (s1 * s1) / n) * (s2q - (s2 * s2) / n))
  return den === 0 ? 0 : num / den
}

export function CorrelationMatrixChart({ data, className }: CorrelationMatrixChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length < 2) return

    const container = containerRef.current
    const size = Math.min(container.clientWidth || 700, 700)
    const margin = { top: 100, right: 130, bottom: 80, left: 110 }
    const innerSize = size - margin.left - margin.right
    const cellSize = Math.floor(innerSize / METRICS.length)
    const height = cellSize * METRICS.length + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", size + margin.right).attr("height", height)

    // Theme-aware colors from CSS custom properties
    const rootStyle = getComputedStyle(svgRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#64748b'
    const labelColor = rootStyle.getPropertyValue('--foreground').trim() || '#f1f5f9'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#334155'
    const bgColor = rootStyle.getPropertyValue('--background').trim() || '#0f172a'

    // Build correlations
    interface CorrCell {
      xi: number; yi: number
      k1: keyof Company; k2: keyof Company
      l1: string; l2: string
      value: number
    }
    const corrs: CorrCell[] = []
    for (let xi = 0; xi < METRICS.length; xi++) {
      for (let yi = 0; yi < METRICS.length; yi++) {
        corrs.push({
          xi, yi,
          k1: METRICS[xi].key, k2: METRICS[yi].key,
          l1: METRICS[xi].label, l2: METRICS[yi].label,
          value: pearson(data, METRICS[xi].key, METRICS[yi].key),
        })
      }
    }

    const colorScale = d3.scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(["#ef4444", bgColor, "#10b981"])

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "corr-tooltip")
      .style("position", "fixed")
      .style("background", `color-mix(in srgb, ${bgColor} 95%, transparent)`)
      .style("border", `1px solid ${borderColor}`)
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("color", labelColor)
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")

    // Cells
    g.selectAll("rect.cell")
      .data(corrs)
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => d.xi * cellSize)
      .attr("y", (d) => d.yi * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => colorScale(d.value))
      .attr("fill-opacity", (d) => Math.abs(d.value) * 0.75 + 0.25)
      .attr("stroke", bgColor)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1)
        const strength = Math.abs(d.value) > 0.7 ? "Strong" : Math.abs(d.value) > 0.4 ? "Moderate" : "Weak"
        const direction = d.value > 0.01 ? "positive" : d.value < -0.01 ? "negative" : "no"
        tooltip.style("opacity", "1").html(
          `<strong>${d.l1}</strong><br>× ${d.l2}<br>r = <span style="font-weight:700;color:${colorScale(d.value)}">${d.value.toFixed(3)}</span><br><em style="font-size:11px;opacity:0.7">${strength} ${direction} correlation</em>`
        )
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 10}px`)
      })
      .on("mouseout", function (_, d) {
        d3.select(this).attr("fill-opacity", Math.abs(d.value) * 0.75 + 0.25)
        tooltip.style("opacity", "0")
      })

    // Value text
    g.selectAll("text.corr-val")
      .data(corrs)
      .join("text")
      .attr("class", "corr-val")
      .attr("x", (d) => d.xi * cellSize + cellSize / 2)
      .attr("y", (d) => d.yi * cellSize + cellSize / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", (d) => contrastTextColor(colorScale(d.value)))
      .attr("font-size", Math.max(8, cellSize * 0.28))
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text((d) => d.value.toFixed(2))

    // X axis labels (top, rotated)
    g.selectAll("text.x-lbl")
      .data(METRICS)
      .join("text")
      .attr("class", "x-lbl")
      .attr("transform", (_, i) => `rotate(-45,${i * cellSize + cellSize / 2},-8) translate(${i * cellSize + cellSize / 2},-8)`)
      .attr("text-anchor", "end")
      .attr("fill", axisColor)
      .attr("font-size", 10)
      .attr("font-weight", "600")
      .text((d) => d.shortLabel)

    // Y axis labels (left)
    g.selectAll("text.y-lbl")
      .data(METRICS)
      .join("text")
      .attr("class", "y-lbl")
      .attr("x", -8)
      .attr("y", (_, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", axisColor)
      .attr("font-size", 10)
      .attr("font-weight", "600")
      .text((d) => d.shortLabel)

    // Title
    svg
      .append("text")
      .attr("x", (size + margin.right) / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("fill", labelColor)
      .attr("font-size", 15)
      .attr("font-weight", "700")
      .text("Performance Metrics — Pearson Correlation Matrix")

    svg
      .append("text")
      .attr("x", (size + margin.right) / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", axisColor)
      .attr("font-size", 11)
      .text(`${data.length} companies · Green = positive · Red = negative`)

    // Legend gradient
    const lgX = size - margin.right + margin.left + 20
    const lgY = margin.top
    const lgW = 14
    const lgH = cellSize * METRICS.length

    const gradId = "corr-gradient"
    const defs = svg.append("defs")
    const grad = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%")
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#ef4444")
    grad.append("stop").attr("offset", "50%").attr("stop-color", bgColor)
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981")

    svg.append("rect").attr("x", lgX).attr("y", lgY).attr("width", lgW).attr("height", lgH).attr("fill", `url(#${gradId})`).attr("stroke", borderColor)
    svg.append("text").attr("x", lgX + lgW + 5).attr("y", lgY + 8).attr("fill", axisColor).attr("font-size", 10).text("+1.0")
    svg.append("text").attr("x", lgX + lgW + 5).attr("y", lgY + lgH / 2).attr("fill", axisColor).attr("font-size", 10).attr("dominant-baseline", "middle").text("0")
    svg.append("text").attr("x", lgX + lgW + 5).attr("y", lgY + lgH - 4).attr("fill", axisColor).attr("font-size", 10).text("-1.0")

    return () => {
      d3.selectAll(".corr-tooltip").remove()
    }
  }, [data])

  return (
    <div ref={containerRef} className={cn("relative w-full overflow-x-auto", className)}>
      <svg ref={svgRef} />
    </div>
  )
}
