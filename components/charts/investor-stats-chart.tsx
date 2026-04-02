"use client"

import { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/company-data"

interface InvestorStatsChartProps {
  data: Company[]
  className?: string
}

interface ListInvestorEntry {
  investmentList: string
  investorCount: number
  companyCount: number
  topInvestors: string[]
}

export function InvestorStatsChart({ data, className }: InvestorStatsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const entries = useMemo(() => {
    // Map: investment list → set of unique investors + set of companies
    const listMap = new Map<string, { investors: Set<string>; companies: Set<string>; investorCounts: Map<string, number> }>()

    const EXCLUDED_INVESTORS = new Set([
      "bootstrapped", "angel funded", "undisclosed", "unknown", "n a", "n/a",
      "self-funded", "self funded", "none", "undisclosed or unknown",
    ])

    data.forEach((company) => {
      const list = (company.investmentList || "").replace(/^\d+-/, "").trim()
      if (!list || list === "Unknown") return

      if (!listMap.has(list)) {
        listMap.set(list, { investors: new Set(), companies: new Set(), investorCounts: new Map() })
      }
      const entry = listMap.get(list)!
      entry.companies.add(company.name)

      ;(company.investors || []).forEach((inv) => {
        if (!EXCLUDED_INVESTORS.has(inv.toLowerCase().trim())) {
          entry.investors.add(inv)
          entry.investorCounts.set(inv, (entry.investorCounts.get(inv) || 0) + 1)
        }
      })
    })

    const result: ListInvestorEntry[] = []
    listMap.forEach((val, key) => {
      const topInvestors = [...val.investorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)
      result.push({
        investmentList: key,
        investorCount: val.investors.size,
        companyCount: val.companies.size,
        topInvestors,
      })
    })

    return result.sort((a, b) => b.investorCount - a.investorCount)
  }, [data])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || entries.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const margin = { top: 30, right: 80, bottom: 40, left: 260 }
    const barHeight = 40
    const barPad = 8

    const innerWidth = width - margin.left - margin.right
    const innerHeight = entries.length * (barHeight + barPad)
    const height = innerHeight + margin.top + margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    // Theme-aware colors from CSS custom properties
    const rootStyle = getComputedStyle(svgRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#94a3b8'
    const labelColor = rootStyle.getPropertyValue('--foreground').trim() || '#cbd5e1'
    const borderColor = rootStyle.getPropertyValue('--border').trim() || '#334155'
    const bgColor = rootStyle.getPropertyValue('--popover').trim() || '#0f172a'
    const fgColor = rootStyle.getPropertyValue('--popover-foreground').trim() || '#f1f5f9'

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xMax = d3.max(entries, (d) => d.investorCount) ?? 1
    const xScale = d3.scaleLinear().domain([0, xMax * 1.15]).range([0, innerWidth])
    const yScale = d3.scaleBand()
      .domain(entries.map((d) => d.investmentList))
      .range([0, innerHeight])
      .padding(0.2)

    const COLORS = [
      "#2E6DB4", "#2BBFB3", "#D45500", "#F4B400",
      "#D642A6", "#0B7A20", "#7A3FD1", "#8FB3E8",
      "#F2B38B", "#7EC8E3", "#6B7280",
    ]
    const colorScale = d3.scaleOrdinal(COLORS).domain(entries.map((d) => d.investmentList))

    const tooltip = d3.select("body").append("div")
      .attr("class", "investor-stats-tooltip")
      .style("position", "fixed")
      .style("background", `hsl(${bgColor})`)
      .style("border", `1px solid hsl(${borderColor})`)
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("color", `hsl(${fgColor})`)
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")
      .style("max-width", "320px")

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => String(d)))
      .selectAll("text")
      .attr("fill", `hsl(${labelColor})`)
      .attr("font-size", 11)

    g.selectAll(".domain, .tick line").attr("stroke", `hsl(${borderColor})`)

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(xScale).ticks(6).tickSize(-innerHeight).tickFormat(() => ""))
      .attr("transform", `translate(0,${innerHeight})`)
      .selectAll("line")
      .attr("stroke", `hsl(${borderColor})`)
      .attr("stroke-dasharray", "3,3")
    g.select(".grid .domain").remove()

    // X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .attr("fill", `hsl(${axisColor})`)
      .attr("font-size", 11)
      .text("Unique Investors")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll("text")
      .attr("fill", `hsl(${labelColor})`)
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .each(function () {
        const el = d3.select(this)
        const text = el.text()
        // Strip investment list abbreviations in parentheses for cleaner labels
        const clean = text.replace(/\s*\(.*\)\s*$/, "")
        if (clean.length > 30) el.text(clean.slice(0, 28) + "…")
        else el.text(clean)
      })

    g.select(".domain").remove()

    // Bars
    g.selectAll("rect.bar")
      .data(entries)
      .join("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.investmentList) ?? 0)
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", (d) => colorScale(d.investmentList))
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function (_, d) {
        d3.select(this).attr("opacity", 0.8)
        tooltip.style("opacity", "1").html(
          `<strong>${d.investmentList}</strong><br>` +
          `${d.investorCount} unique investors<br>` +
          `${d.companyCount} companies<br>` +
          (d.topInvestors.length > 0 ? `<br><em>Top investors:</em><br>${d.topInvestors.join("<br>")}` : "")
        )
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 14}px`).style("top", `${event.clientY - 12}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1)
        tooltip.style("opacity", "0")
      })
      .transition()
      .duration(600)
      .delay((_, i) => i * 40)
      .attr("width", (d) => xScale(d.investorCount))

    // Value labels
    g.selectAll("text.val-lbl")
      .data(entries)
      .join("text")
      .attr("class", "val-lbl")
      .attr("y", (d) => (yScale(d.investmentList) ?? 0) + yScale.bandwidth() / 2)
      .attr("x", (d) => xScale(d.investorCount) + 6)
      .attr("dominant-baseline", "middle")
      .attr("fill", `hsl(${labelColor})`)
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .text((d) => `${d.investorCount}`)

    // Company count as secondary label
    g.selectAll("text.co-lbl")
      .data(entries)
      .join("text")
      .attr("class", "co-lbl")
      .attr("y", (d) => (yScale(d.investmentList) ?? 0) + yScale.bandwidth() / 2 + 1)
      .attr("x", (d) => xScale(d.investorCount) + 40)
      .attr("dominant-baseline", "middle")
      .attr("fill", `hsl(${axisColor})`)
      .attr("font-size", 10)
      .text((d) => `(${d.companyCount} co.)`)

    return () => {
      d3.selectAll(".investor-stats-tooltip").remove()
    }
  }, [entries])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Investment Lists × Unique Investors
        </h3>
        <span className="text-xs text-muted-foreground">
          Hover for top investors per list
        </span>
      </div>
      <div ref={containerRef} className="relative w-full overflow-y-auto max-h-[700px]">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  )
}
