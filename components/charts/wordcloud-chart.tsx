"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import cloud from "d3-cloud"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"

interface WordcloudChartProps {
  data: Company[]
  className?: string
}

interface WordEntry {
  text: string
  size: number
  count: number
}

const COLORS = [
  "#2E6DB4", "#8FB3E8", "#2BBFB3", "#D45500",
  "#F4B400", "#F2B38B", "#D642A6", "#7EC8E3",
  "#0B7A20", "#7A3FD1", "#7C3AED", "#64748b",
]

export function WordcloudChart({ data, className }: WordcloudChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    // Theme-aware colors from CSS custom properties
    const rootStyle = getComputedStyle(svgRef.current)
    const bgColor = rootStyle.getPropertyValue('--popover').trim() || '#0f172a'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#334155'
    const fgColor = rootStyle.getPropertyValue('--popover-foreground').trim() || '#f1f5f9'

    // Count tags across all companies
    const tagCounts: Record<string, number> = {}
    data.forEach((company) => {
      const tags = company.tags || []
      tags.forEach((tag) => {
        const clean = tag.trim()
        if (clean) {
          tagCounts[clean] = (tagCounts[clean] || 0) + 1
        }
      })
      // Also add subsegment and investmentList as single-word entries
      if (company.subsegment) {
        const s = company.subsegment.trim()
        if (s) tagCounts[s] = (tagCounts[s] || 0) + 1
      }
    })

    if (Object.keys(tagCounts).length === 0) {
      // Fallback: use company names sized by funding
      data.slice(0, 60).forEach((c) => {
        tagCounts[c.name] = Math.max(1, Math.floor((c.totalFunding || 1000000) / 10000000))
      })
    }

    const maxCount = Math.max(...Object.values(tagCounts))
    const sizeScale = d3.scaleSqrt().domain([1, maxCount]).range([12, 60])

    const words: WordEntry[] = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 120)
      .map(([text, count]) => ({
        text,
        size: sizeScale(count),
        count,
      }))

    const colorScale = d3.scaleOrdinal(COLORS).domain(words.map((w) => w.text))

    const layout = cloud<WordEntry>()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => (Math.random() > 0.6 ? 90 : 0))
      .font("Inter, sans-serif")
      .fontSize((d) => d.size)
      .on("end", draw)

    layout.start()

    function draw(placedWords: (WordEntry & { x?: number; y?: number; rotate?: number })[]) {
      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)

      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "wordcloud-tooltip")
        .style("position", "fixed")
        .style("background", `hsl(${bgColor})`)
        .style("border", `1px solid hsl(${borderColor})`)
        .style("border-radius", "6px")
        .style("padding", "8px 12px")
        .style("font-size", "13px")
        .style("color", `hsl(${fgColor})`)
        .style("pointer-events", "none")
        .style("opacity", "0")
        .style("z-index", "9999")
        .style("transition", "opacity 0.15s")

      g.selectAll("text")
        .data(placedWords)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Inter, sans-serif")
        .style("font-weight", "600")
        .style("fill", (d) => colorScale(d.text))
        .style("cursor", "pointer")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})rotate(${d.rotate ?? 0})`)
        .text((d) => d.text)
        .style("opacity", 0)
        .transition()
        .duration(600)
        .delay((_, i) => i * 8)
        .style("opacity", 1)

      // Attach events after transition
      g.selectAll<SVGTextElement, WordEntry & { x?: number; y?: number; rotate?: number }>("text")
        .on("mouseover", function (event, d) {
          d3.select(this).style("opacity", 0.75)
          tooltip
            .style("opacity", "1")
            .html(
              `<strong>${d.text}</strong><br>Appears in ${d.count} ${d.count === 1 ? "company" : "companies"}`
            )
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.clientX + 12}px`)
            .style("top", `${event.clientY - 10}px`)
        })
        .on("mouseout", function () {
          d3.select(this).style("opacity", 1)
          tooltip.style("opacity", "0")
        })

      return () => {
        tooltip.remove()
      }
    }

    return () => {
      d3.selectAll(".wordcloud-tooltip").remove()
    }
  }, [data])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}
