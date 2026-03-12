"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw } from "lucide-react"
import { INVESTMENT_LIST_COLORS, getInvestmentColor } from "@/lib/investment-colors"

interface MaturityMatrixChartProps {
  data: Company[]
  className?: string
}

// ─── Quadrant definitions ──────────────────────────────────────────
const QUADRANT_LABELS = [
  { label: "DISRUPTOR",     sub: "Blue Ocean",   row: 0, col: 0, bg: "rgba(30, 100, 200, 0.06)" },
  { label: "INNOVATOR",     sub: "New Frontier",  row: 0, col: 1, bg: "rgba(40, 170, 100, 0.06)" },
  { label: "CHALLENGER",    sub: "Emerging",       row: 1, col: 0, bg: "rgba(200, 160, 40, 0.06)" },
  { label: "FAST FOLLOWER", sub: "Red Ocean",      row: 1, col: 1, bg: "rgba(200, 50, 50, 0.06)" },
]

// ─── Incumbent vendors per category ────────────────────────────────
const INCUMBENTS: Record<string, string[]> = {
  "Design Intelligence (CAD)":                     ["Siemens NX", "Dassault CATIA", "PTC Creo", "Autodesk Fusion"],
  "Extreme Analysis (CAE, CFD, FEA, QC)":          ["ANSYS", "Altair", "Dassault SIMULIA", "Siemens Simcenter"],
  "Adaptive Manufacturing (AM, CAM, CNC)":         ["Siemens", "Hexagon", "Mastercam", "Stratasys"],
  "Cognitive Thread (PLM, MBSE, DT)":              ["Siemens Teamcenter", "Dassault ENOVIA", "PTC Windchill", "Aras"],
  "Factory Futures (MES, IIOT)":                   ["Siemens Opcenter", "Rockwell PLEX", "AVEVA", "GE Digital"],
  "Augmented Operations (MOM, CMMS, AR/VR, SLM)": ["SAP PM", "IBM Maximo", "Hexagon EAM", "IFS"],
  "Streamlined Supply Chain (SCM)":                ["SAP SCM", "Oracle SCM", "Kinaxis", "Blue Yonder"],
  "Bleeding Edge BIM (AEC/BIM)":                   ["Autodesk Revit", "Bentley", "Trimble", "Nemetschek"],
  "SW+HW=Innovation (Robotics, Drones)":           ["ABB", "FANUC", "Universal Robots", "Kuka"],
  "Knowledge Engineering (R&D, Learning)":         ["Siemens Xcelerator", "PTC University", "Dassault 3DX"],
}

// Short labels for categories
const SHORT_LABELS: Record<string, string> = {
  "Design Intelligence (CAD)":                     "Design Intelligence",
  "Extreme Analysis (CAE, CFD, FEA, QC)":          "Extreme Analysis",
  "Adaptive Manufacturing (AM, CAM, CNC)":         "Adaptive Mfg",
  "Cognitive Thread (PLM, MBSE, DT)":              "Cognitive Thread",
  "Factory Futures (MES, IIOT)":                   "Factory Futures",
  "Augmented Operations (MOM, CMMS, AR/VR, SLM)": "Augmented Ops",
  "Streamlined Supply Chain (SCM)":                "Supply Chain",
  "Bleeding Edge BIM (AEC/BIM)":                   "Bleeding Edge BIM",
  "SW+HW=Innovation (Robotics, Drones)":           "SW+HW Innovation",
  "Knowledge Engineering (R&D, Learning)":         "Knowledge Eng",
}

type ViewMode = "categories" | "startups" | "both"

export function MaturityMatrixChart({ data, className }: MaturityMatrixChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("both")
  const [showIncumbents, setShowIncumbents] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Compute category aggregates
  const categoryData = useMemo(() => {
    if (!data || data.length === 0) return []

    const groups: Record<string, Company[]> = {}
    for (const c of data) {
      const cat = c.investmentList || "Other"
      if (!INVESTMENT_LIST_COLORS[cat]) continue
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(c)
    }

    return Object.entries(groups).map(([category, companies]) => {
      const avg = (field: keyof Company) =>
        companies.reduce((s, c) => s + ((c[field] as number) || 0), 0) / companies.length

      const avgTech = avg("techDifferentiation")
      const avgMarket = avg("marketOpportunity")
      const avgMoat = avg("competitiveMoat")
      const avgExec = avg("teamExecution")
      const totalFunding = companies.reduce((s, c) => s + (c.totalFunding || 0), 0)

      // X-axis: Market Disruption = techDifferentiation weighted by competitiveMoat
      // Higher = more disruptive / blue ocean
      const disruptionScore = (avgTech * 0.6 + avgMoat * 0.4)

      // Y-axis: Innovation Intensity = marketOpportunity weighted by execution
      // Higher = more innovative
      const innovationScore = (avgMarket * 0.5 + avgExec * 0.3 + avgTech * 0.2)

      return {
        category,
        shortLabel: SHORT_LABELS[category] || category,
        companies,
        count: companies.length,
        avgTech,
        avgMarket,
        avgMoat,
        avgExec,
        totalFunding,
        disruptionScore,
        innovationScore,
        color: INVESTMENT_LIST_COLORS[category],
        incumbents: INCUMBENTS[category] || [],
      }
    })
  }, [data])

  // Filter startups for individual view
  const filteredStartups = useMemo(() => {
    if (selectedCategory === "all") return data.filter(c => INVESTMENT_LIST_COLORS[c.investmentList])
    return data.filter(c => c.investmentList === selectedCategory)
  }, [data, selectedCategory])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || categoryData.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const margin = { top: 50, right: 30, bottom: 60, left: 60 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const tooltip = d3.select(tooltipRef.current)

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .extent([[0, 0], [width, height]])
      .on("zoom", event => g.attr("transform", event.transform))
    svg.call(zoom)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales — 0-10 range for all scores
    const xScale = d3.scaleLinear().domain([2, 9]).range([0, innerWidth])
    const yScale = d3.scaleLinear().domain([2, 9]).range([innerHeight, 0])

    const midX = innerWidth / 2
    const midY = innerHeight / 2

    // ─── Quadrant backgrounds ──────────────────────────────────
    for (const q of QUADRANT_LABELS) {
      const x = q.col === 0 ? 0 : midX
      const y = q.row === 0 ? 0 : midY
      const w = q.col === 0 ? midX : innerWidth - midX
      const h = q.row === 0 ? midY : innerHeight - midY

      g.append("rect")
        .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
        .attr("fill", q.bg)
        .attr("stroke", "none")

      // Quadrant label
      g.append("text")
        .attr("x", x + w / 2).attr("y", y + 28)
        .attr("text-anchor", "middle")
        .text(q.label)
        .attr("font-size", "22px")
        .attr("font-weight", 900)
        .attr("fill", "var(--muted-foreground)")
        .attr("opacity", 0.12)
        .style("pointer-events", "none")

      // Sub-label (Red/Blue Ocean)
      g.append("text")
        .attr("x", x + w / 2).attr("y", y + 48)
        .attr("text-anchor", "middle")
        .text(q.sub)
        .attr("font-size", "11px")
        .attr("font-weight", 600)
        .attr("fill", "var(--muted-foreground)")
        .attr("opacity", 0.1)
        .style("pointer-events", "none")
    }

    // ─── Grid lines (dividers) ────────────────────────────────
    g.append("line")
      .attr("x1", midX).attr("y1", 0).attr("x2", midX).attr("y2", innerHeight)
      .attr("stroke", "var(--border)").attr("stroke-width", 2).attr("stroke-dasharray", "6,4")
    g.append("line")
      .attr("x1", 0).attr("y1", midY).attr("x2", innerWidth).attr("y2", midY)
      .attr("stroke", "var(--border)").attr("stroke-width", 2).attr("stroke-dasharray", "6,4")
    g.append("rect")
      .attr("width", innerWidth).attr("height", innerHeight)
      .attr("fill", "none").attr("stroke", "var(--border)").attr("stroke-width", 1)

    // ─── Axis labels ──────────────────────────────────────────
    // X-axis
    g.append("text")
      .attr("x", innerWidth / 2).attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .text("Market Disruption Potential →")
      .attr("font-size", "12px").attr("font-weight", 600)
      .attr("fill", "var(--muted-foreground)")
    g.append("text")
      .attr("x", 0).attr("y", innerHeight + 40)
      .attr("text-anchor", "start")
      .text("Red Ocean")
      .attr("font-size", "10px").attr("font-weight", 500)
      .attr("fill", "rgba(200, 50, 50, 0.6)")
    g.append("text")
      .attr("x", innerWidth).attr("y", innerHeight + 40)
      .attr("text-anchor", "end")
      .text("Blue Ocean")
      .attr("font-size", "10px").attr("font-weight", 500)
      .attr("fill", "rgba(30, 100, 200, 0.6)")

    // Y-axis
    g.append("text")
      .attr("transform", `translate(-40, ${innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .text("Innovation Intensity →")
      .attr("font-size", "12px").attr("font-weight", 600)
      .attr("fill", "var(--muted-foreground)")

    // ─── Incumbent markers (diamonds) ─────────────────────────
    if (showIncumbents) {
      const incumbentNodes: { name: string; category: string; x: number; y: number; color: string }[] = []
      for (const cat of categoryData) {
        if (selectedCategory !== "all" && cat.category !== selectedCategory) continue
        // Place incumbents slightly offset from their category, lower-right (Red Ocean / Fast Follower)
        for (let i = 0; i < cat.incumbents.length; i++) {
          const jitter = (i - cat.incumbents.length / 2) * 0.15
          incumbentNodes.push({
            name: cat.incumbents[i],
            category: cat.category,
            x: Math.max(2.5, cat.disruptionScore - 1.2 + jitter),
            y: Math.max(2.5, cat.innovationScore - 0.8 + (i % 2) * 0.3),
            color: cat.color,
          })
        }
      }

      const diamonds = g.selectAll(".incumbent")
        .data(incumbentNodes)
        .join("g")
        .attr("class", "incumbent")
        .attr("transform", d => `translate(${xScale(d.x)},${yScale(d.y)})`)

      diamonds.append("rect")
        .attr("width", 10).attr("height", 10)
        .attr("x", -5).attr("y", -5)
        .attr("transform", "rotate(45)")
        .attr("fill", d => d.color)
        .attr("fill-opacity", 0.3)
        .attr("stroke", d => d.color)
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("fill-opacity", 0.7).attr("stroke-width", 2.5)
          tooltip
            .style("opacity", 1)
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 10}px`)
            .html(`<strong>${d.name}</strong><br/><span style="color:${d.color}">${SHORT_LABELS[d.category] || d.category}</span><br/><em>Incumbent</em>`)
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.3).attr("stroke-width", 1.5)
          tooltip.style("opacity", 0)
        })

      diamonds.append("text")
        .text(d => d.name)
        .attr("dy", 16).attr("text-anchor", "middle")
        .style("font-size", "8px").style("fill", "var(--muted-foreground)")
        .style("pointer-events", "none").attr("opacity", 0.6)
    }

    // ─── Category bubbles ─────────────────────────────────────
    if (viewMode === "categories" || viewMode === "both") {
      const catNodes = selectedCategory === "all"
        ? categoryData
        : categoryData.filter(c => c.category === selectedCategory)

      const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(catNodes, d => d.count) || 1])
        .range([20, 55])

      const catGroups = g.selectAll(".cat-bubble")
        .data(catNodes)
        .join("g")
        .attr("class", "cat-bubble")
        .attr("transform", d => `translate(${xScale(d.disruptionScore)},${yScale(d.innovationScore)})`)

      catGroups.append("circle")
        .attr("r", d => radiusScale(d.count))
        .attr("fill", d => d.color)
        .attr("fill-opacity", 0.15)
        .attr("stroke", d => d.color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("fill-opacity", 0.3).attr("stroke-width", 3)
          tooltip
            .style("opacity", 1)
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 10}px`)
            .html(`
              <strong style="color:${d.color}">${d.shortLabel}</strong><br/>
              <span>${d.count} startups</span><br/>
              Tech Diff: ${d.avgTech.toFixed(1)} · Market Opp: ${d.avgMarket.toFixed(1)}<br/>
              Moat: ${d.avgMoat.toFixed(1)} · Execution: ${d.avgExec.toFixed(1)}<br/>
              Total Funding: $${(d.totalFunding / 1e9).toFixed(1)}B<br/>
              <em>Incumbents: ${d.incumbents.slice(0, 3).join(", ")}</em>
            `)
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", 0.15).attr("stroke-width", 2)
          tooltip.style("opacity", 0)
        })

      catGroups.append("text")
        .text(d => d.shortLabel)
        .attr("text-anchor", "middle")
        .attr("dy", -4)
        .style("font-size", "10px")
        .style("font-weight", "700")
        .style("fill", d => d.color)
        .style("pointer-events", "none")

      catGroups.append("text")
        .text(d => `${d.count} startups`)
        .attr("text-anchor", "middle")
        .attr("dy", 10)
        .style("font-size", "8px")
        .style("fill", "var(--muted-foreground)")
        .style("pointer-events", "none")
    }

    // ─── Individual startup dots ──────────────────────────────
    if (viewMode === "startups" || viewMode === "both") {
      const startups = filteredStartups.filter(c =>
        (c.techDifferentiation || 0) > 0 && (c.marketOpportunity || 0) > 0
      )

      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(startups, d => d.totalFunding || 0) || 1])
        .range([3, 14])

      const startupNodes = g.selectAll(".startup")
        .data(startups)
        .join("g")
        .attr("class", "startup")
        .attr("transform", d => {
          const td = d.techDifferentiation || 5
          const mo = d.marketOpportunity || 5
          const cm = d.competitiveMoat || 5
          const te = d.teamExecution || 5
          const x = td * 0.6 + cm * 0.4
          const y = mo * 0.5 + te * 0.3 + td * 0.2
          return `translate(${xScale(x)},${yScale(y)})`
        })

      startupNodes.append("circle")
        .attr("r", d => sizeScale(d.totalFunding || 0))
        .attr("fill", d => getInvestmentColor(d.investmentList || "Other"))
        .attr("fill-opacity", viewMode === "both" ? 0.5 : 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("fill-opacity", 1).attr("stroke", "var(--primary)").attr("stroke-width", 2.5)
          const funding = d.totalFunding ? `$${(d.totalFunding / 1e6).toFixed(1)}M` : "N/A"
          tooltip
            .style("opacity", 1)
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 10}px`)
            .html(`
              <strong>${d.name}</strong><br/>
              <span style="color:${getInvestmentColor(d.investmentList)}">${SHORT_LABELS[d.investmentList] || d.investmentList}</span><br/>
              Tech: ${d.techDifferentiation || "–"} · Market: ${d.marketOpportunity || "–"}<br/>
              Moat: ${d.competitiveMoat || "–"} · Exec: ${d.teamExecution || "–"}<br/>
              Funding: ${funding} · HC: ${d.headcount || "–"}<br/>
              ${d.hqLocation || ""}
            `)
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill-opacity", viewMode === "both" ? 0.5 : 0.7).attr("stroke", "#fff").attr("stroke-width", 1)
          tooltip.style("opacity", 0)
        })

      // Labels for top startups only (to avoid clutter)
      if (viewMode === "startups") {
        const top = startups
          .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
          .slice(0, 30)
        const topSet = new Set(top.map(t => t.id))

        startupNodes.filter(d => topSet.has(d.id))
          .append("text")
          .text(d => d.name)
          .attr("dy", d => sizeScale(d.totalFunding || 0) + 10)
          .attr("text-anchor", "middle")
          .style("font-size", "8px")
          .style("fill", "var(--foreground)")
          .style("pointer-events", "none")
      }
    }

  }, [categoryData, filteredStartups, viewMode, showIncumbents, selectedCategory])

  const resetZoom = () => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity)
  }

  const categories = Object.keys(INVESTMENT_LIST_COLORS)

  return (
    <Card className={`flex flex-col h-[calc(100vh-8rem)] ${className ?? ""}`}>
      {/* Controls */}
      <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-card">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">View</label>
            <Select value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Categories + Startups</SelectItem>
                <SelectItem value="categories">Categories Only</SelectItem>
                <SelectItem value="startups">Startups Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: INVESTMENT_LIST_COLORS[cat] }} />
                      {SHORT_LABELS[cat] || cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Incumbents</label>
            <Button
              variant={showIncumbents ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setShowIncumbents(!showIncumbents)}
            >
              {showIncumbents ? "Showing" : "Hidden"}
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetZoom} className="h-8">
          <RotateCcw className="mr-2 h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-background">
        <svg ref={svgRef} className="w-full h-full block" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg opacity-0 transition-opacity z-50 max-w-[280px]"
          style={{ lineHeight: "1.5" }}
        />
        {(!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No Data
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t p-3 flex flex-wrap gap-3 items-center bg-card text-xs">
        <span className="text-muted-foreground font-medium mr-1">Legend:</span>
        {Object.entries(INVESTMENT_LIST_COLORS).map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              selectedCategory === cat
                ? "ring-2 ring-primary bg-primary/5"
                : selectedCategory === "all"
                  ? "hover:bg-muted"
                  : "opacity-30 hover:opacity-60"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{SHORT_LABELS[cat] || cat}</span>
          </button>
        ))}
        <span className="ml-3 flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 border border-muted-foreground rotate-45" />
          Incumbent
        </span>
      </div>
    </Card>
  )
}
