"use client"

import { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { INVESTMENT_LIST_COLORS } from "@/lib/investment-colors"

interface PatternsChartProps {
  companies: Company[]
  className?: string
}

// Canonical row order (10 investment lists, no VC)
const INVESTMENT_LISTS = [
  "Design Intelligence (CAD)",
  "Extreme Analysis (CAE, CFD, FEA, QC)",
  "Adaptive Manufacturing (AM, CAM, CNC)",
  "Cognitive Thread (PLM, MBSE, DT)",
  "Factory Futures (MES, IIOT)",
  "Augmented Operations (MOM, CMMS, AR/VR, SLM)",
  "Streamlined Supply Chain (SCM)",
  "Bleeding Edge BIM (AEC/BIM)",
  "SW+HW=Innovation (Robotics, Drones)",
  "Knowledge Engineering (R&D, Learning)",
]

// Canonical column order (logical funding progression)
const FUNDING_STAGES = [
  "Pre-Seed",
  "Angel Round",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Series E",
  "Series F",
  "Bootstrapped",
  "Grants",
  "Corporate Venture",
]

// Short label for x-axis (space is tight)
const STAGE_SHORT: Record<string, string> = {
  "Pre-Seed": "Pre-Seed",
  "Angel Round": "Angel",
  "Seed": "Seed",
  "Series A": "Ser A",
  "Series B": "Ser B",
  "Series C": "Ser C",
  "Series D": "Ser D",
  "Series E": "Ser E",
  "Series F": "Ser F",
  "Bootstrapped": "Bootstrap",
  "Grants": "Grants",
  "Corporate Venture": "Corp VC",
}

export function PatternsChart({ companies, className }: PatternsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Build count matrix + company name lookup
  const { matrix, maxCount } = useMemo(() => {
    const countMap = new Map<string, { count: number; names: string[] }>()
    for (const c of companies) {
      const list = c.investmentList
      const round = c.latestFundingRound
      if (!list || !round || list === "VC") continue
      // Only count known stages
      if (!FUNDING_STAGES.includes(round)) continue
      const key = `${list}||${round}`
      const entry = countMap.get(key) ?? { count: 0, names: [] }
      entry.count++
      entry.names.push(c.name)
      countMap.set(key, entry)
    }
    const matrix: Array<{ list: string; stage: string; count: number; names: string[] }> = []
    let maxCount = 0
    for (const list of INVESTMENT_LISTS) {
      for (const stage of FUNDING_STAGES) {
        const entry = countMap.get(`${list}||${stage}`) ?? { count: 0, names: [] }
        matrix.push({ list, stage, count: entry.count, names: entry.names })
        if (entry.count > maxCount) maxCount = entry.count
      }
    }
    return { matrix, maxCount }
  }, [companies])

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Theme-aware colors from CSS custom properties
    // Values are already complete color functions (e.g. oklch(0.45 0.05 270))
    const rootStyle = getComputedStyle(svgRef.current)
    const axisColor = rootStyle.getPropertyValue('--muted-foreground').trim() || '#64748b'
    const labelColor = rootStyle.getPropertyValue('--foreground').trim() || '#cbd5e1'

    const margin = { top: 40, right: 20, bottom: 90, left: 300 }
    const cellSize = 44
    const innerWidth = FUNDING_STAGES.length * cellSize
    const innerHeight = INVESTMENT_LISTS.length * cellSize
    const width = innerWidth + margin.left + margin.right
    const height = innerHeight + margin.top + margin.bottom

    svg.attr("width", width).attr("height", height)
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Color scale: 0 = transparent, 1..max = blue gradient ending near white
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateBlues)

    // X scale
    const xScale = d3.scaleBand()
      .domain(FUNDING_STAGES)
      .range([0, innerWidth])
      .padding(0.06)

    // Y scale
    const yScale = d3.scaleBand()
      .domain(INVESTMENT_LISTS)
      .range([0, innerHeight])
      .padding(0.06)

    const cellW = xScale.bandwidth()
    const cellH = yScale.bandwidth()

    // Draw cells
    g.selectAll("rect.cell")
      .data(matrix)
      .join("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.stage)!)
      .attr("y", d => yScale(d.list)!)
      .attr("width", cellW)
      .attr("height", cellH)
      .attr("rx", 4)
      .attr("fill", d => d.count === 0 ? "rgba(128,128,128,0.08)" : colorScale(d.count))
      .attr("stroke", "rgba(128,128,128,0.12)")
      .attr("stroke-width", 1)
      .style("cursor", d => d.count > 0 ? "pointer" : "default")
      .on("mouseover", (event, d) => {
        if (!tooltipRef.current || d.count === 0) return
        const tip = tooltipRef.current
        const sample = d.names.slice(0, 5).join(", ")
        const more = d.names.length > 5 ? ` +${d.names.length - 5} more` : ""
        tip.innerHTML = `
          <div class="font-semibold text-sm mb-1">${d.list.replace(/\(.*\)/, "").trim()}</div>
          <div class="text-xs text-slate-400 mb-2">${d.stage}</div>
          <div class="text-lg font-bold text-white">${d.count} <span class="text-xs font-normal text-slate-400">companies</span></div>
          <div class="text-xs text-slate-400 mt-1.5 leading-relaxed">${sample}${more}</div>
        `
        tip.style.display = "block"
        tip.style.left = `${event.pageX + 14}px`
        tip.style.top = `${event.pageY - 10}px`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.left = `${event.pageX + 14}px`
        tooltipRef.current.style.top = `${event.pageY - 10}px`
      })
      .on("mouseout", () => {
        if (tooltipRef.current) tooltipRef.current.style.display = "none"
      })

    // Count labels inside cells
    g.selectAll("text.cell-label")
      .data(matrix.filter(d => d.count > 0))
      .join("text")
      .attr("class", "cell-label")
      .attr("x", d => xScale(d.stage)! + cellW / 2)
      .attr("y", d => yScale(d.list)! + cellH / 2 + 1)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .attr("fill", d => d.count >= maxCount * 0.7 ? "#0f172a" : "#e2e8f0")
      .attr("pointer-events", "none")
      .text(d => d.count)

    // Y axis — row labels with category color dot
    const yAxis = g.append("g")
    INVESTMENT_LISTS.forEach(list => {
      const color = INVESTMENT_LIST_COLORS[list] ?? "#64748b"
      const y = yScale(list)! + cellH / 2
      // color dot
      yAxis.append("circle")
        .attr("cx", -12)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", color)
      // label
      yAxis.append("text")
        .attr("x", -22)
        .attr("y", y)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 12)
        .attr("fill", labelColor)
        .text(list)
    })

    // X axis — stage labels (rotated)
    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight + 8})`)
    FUNDING_STAGES.forEach(stage => {
      xAxis.append("text")
        .attr("x", xScale(stage)! + cellW / 2)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .attr("transform", `rotate(-40, ${xScale(stage)! + cellW / 2}, 0)`)
        .attr("font-size", 11)
        .attr("fill", axisColor)
        .text(STAGE_SHORT[stage] ?? stage)
    })

    // Legend (top right)
    const legendW = 120
    const legendG = svg.append("g").attr("transform", `translate(${width - legendW - 10}, 8)`)
    const legendScale = d3.scaleSequential().domain([0, maxCount]).interpolator(d3.interpolateBlues)
    const legendSteps = 6
    for (let i = 0; i < legendSteps; i++) {
      const val = (maxCount / (legendSteps - 1)) * i
      legendG.append("rect")
        .attr("x", (legendW / legendSteps) * i)
        .attr("y", 0)
        .attr("width", legendW / legendSteps)
        .attr("height", 10)
        .attr("fill", val === 0 ? "rgba(128,128,128,0.08)" : legendScale(val))
    }
    legendG.append("text").attr("x", 0).attr("y", 22).attr("font-size", 9).attr("fill", axisColor).text("0")
    legendG.append("text").attr("x", legendW).attr("y", 22).attr("text-anchor", "end").attr("font-size", 9).attr("fill", axisColor).text(maxCount)
    legendG.append("text").attr("x", legendW / 2).attr("y", 22).attr("text-anchor", "middle").attr("font-size", 9).attr("fill", axisColor).text("companies")

  }, [matrix, maxCount])

  return (
    <div className={`relative overflow-x-auto ${className ?? ""}`}>
      <svg ref={svgRef} className="block" />
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden pointer-events-none bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2.5 shadow-xl max-w-xs"
      />
    </div>
  )
}
