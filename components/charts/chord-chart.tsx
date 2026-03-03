"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"
import { formatCurrency } from "@/lib/company-data"

interface ChordChartProps {
  data: Company[]
  className?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  "Design Intelligence": "#3b82f6",
  "Simulation & Analysis": "#8b5cf6",
  "Manufacturing Intelligence": "#10b981",
  "Supply Chain & Procurement": "#f59e0b",
  "PLM Platforms": "#ef4444",
  "Quality & Compliance": "#06b6d4",
  "Sustainability & ESG": "#ec4899",
  "AI Infrastructure": "#14b8a6",
  "Digital Twin": "#6366f1",
  "Service & MRO": "#84cc16",
}

function getColor(name: string, index: number, investmentLists: string[]): string {
  if (investmentLists.includes(name)) {
    const stripped = name.replace(/^\d+-/, "").trim()
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
      if (stripped.toLowerCase().includes(key.toLowerCase())) return color
    }
    const palette = Object.values(CATEGORY_COLORS)
    return palette[index % palette.length]
  }
  return "#64748b"
}

export function ChordChart({ data, className }: ChordChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 700
    const height = Math.max(600, container.clientHeight || 600)
    const outerRadius = Math.min(width, height) * 0.5 - 110
    const innerRadius = outerRadius - 22

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    // Create tooltip
    if (!tooltipRef.current) {
      tooltipRef.current = document.createElement("div")
      tooltipRef.current.style.cssText =
        "position:fixed;background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:6px;padding:8px 12px;font-size:13px;color:#f1f5f9;pointer-events:none;opacity:0;z-index:9999;transition:opacity 0.15s"
      document.body.appendChild(tooltipRef.current)
    }
    const tooltip = tooltipRef.current

    const investmentLists = Array.from(
      new Set(data.map((d) => (d.investmentList || "Other").replace(/^\d+-/, "").trim()))
    ).slice(0, 12)

    const countries = Array.from(
      new Set(data.map((d) => d.country || "Unknown"))
    )
      .sort()
      .slice(0, 15)

    const names = [...investmentLists, ...countries]
    const n = names.length

    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

    data.forEach((d) => {
      const inv = (d.investmentList || "Other").replace(/^\d+-/, "").trim()
      const country = d.country || "Unknown"
      const i = names.indexOf(inv)
      const j = names.indexOf(country)
      if (i > -1 && j > -1) {
        const value = (d.totalFunding || 1e6) / 1e6
        matrix[i][j] += value
        matrix[j][i] += value
      }
    })

    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix)

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .datum(chord)

    const arc = d3.arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius)

    const group = g
      .append("g")
      .selectAll<SVGGElement, d3.ChordGroup>("g")
      .data((d) => d.groups)
      .join("g")

    group
      .append("path")
      .attr("class", "chord-group-path")
      .attr("fill", (d) => getColor(names[d.index], d.index, investmentLists))
      .attr("stroke", (d) => d3.color(getColor(names[d.index], d.index, investmentLists))?.darker().toString() ?? "#000")
      .attr("d", arc)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", 0.7)
        tooltip.style.opacity = "1"
        tooltip.innerHTML = `<strong>${names[d.index]}</strong><br>${formatCurrency(d.value * 1e6)} total`
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style.left = `${event.clientX + 12}px`
        tooltip.style.top = `${event.clientY - 10}px`
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 1)
        tooltip.style.opacity = "0"
      })

    group
      .append("text")
      .each(function (d) {
        (d as d3.ChordGroup & { angle: number }).angle = (d.startAngle + d.endAngle) / 2
      })
      .attr("dy", "0.35em")
      .attr("transform", (d) => {
        const dExt = d as d3.ChordGroup & { angle: number }
        return `rotate(${(dExt.angle * 180) / Math.PI - 90}) translate(${outerRadius + 8}) ${dExt.angle > Math.PI ? "rotate(180)" : ""}`
      })
      .attr("text-anchor", (d) => {
        const dExt = d as d3.ChordGroup & { angle: number }
        return dExt.angle > Math.PI ? "end" : null
      })
      .text((d) => {
        const name = names[d.index]
        return name.length > 14 ? name.slice(0, 12) + "…" : name
      })
      .style("fill", "#e2e8f0")
      .style("font-size", "10px")
      .style("pointer-events", "none")

    const ribbon = d3.ribbon().radius(innerRadius)

    g.append("g")
      .attr("fill-opacity", 0.65)
      .selectAll<SVGPathElement, d3.Chord>("path")
      .data((d) => d)
      .join("path")
      .attr("class", "ribbon-path")
      .attr("d", ribbon as never)
      .attr("fill", (d) => getColor(names[d.source.index], d.source.index, investmentLists))
      .attr("stroke", (d) =>
        d3.color(getColor(names[d.source.index], d.source.index, investmentLists))?.darker().toString() ?? "#000"
      )
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill-opacity", 1)
        tooltip.style.opacity = "1"
        tooltip.innerHTML = `<strong>${names[d.source.index]} ↔ ${names[d.target.index]}</strong><br>${formatCurrency(d.source.value * 1e6)}`
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style.left = `${event.clientX + 12}px`
        tooltip.style.top = `${event.clientY - 10}px`
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.65)
        tooltip.style.opacity = "0"
      })

    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove()
        tooltipRef.current = null
      }
    }
  }, [data])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}
