"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getInvestmentColor } from "@/lib/investment-colors"

type HierarchyMode = "investment-subcat" | "mfg-industry" | "country-investment"
type MetricKey = "totalFunding" | "headcount" | "estimatedMarketValue" | "weightedScore"

interface TreemapChartProps {
  data: Company[]
  className?: string
  shortlistedIds?: Set<string>
}

interface ViewState {
  name: string
}

const METRICS: { value: MetricKey; label: string }[] = [
  { value: "totalFunding", label: "Total Funding" },
  { value: "headcount", label: "Headcount" },
  { value: "estimatedMarketValue", label: "Est. Market Value" },
  { value: "weightedScore", label: "Weighted Score" },
]

const HIERARCHY_MODES: { value: HierarchyMode; label: string }[] = [
  { value: "investment-subcat", label: "Investment List > Subcategories" },
  { value: "mfg-industry", label: "Manufacturing Type > Industry" },
  { value: "country-investment", label: "Country > Investment Lists" },
]

function getManufacturingType(company: Company): string {
  const text = [
    company.industriesServed ? company.industriesServed.join(" ") : "",
    company.tags ? company.tags.join(" ") : "",
    company.sectorFocus || "",
    company.name || "",
  ]
    .join(" ")
    .toLowerCase()

  if (text.match(/energy|oil|gas|mining|utilities|agriculture|renewables|solar|wind|power/))
    return "Natural Resources"
  if (text.match(/aec|architecture|construction|infrastructure|real estate|building|bim|civil/))
    return "Construction"
  if (text.match(/pharma|chemical|food|beverage|biotech|materials|life sciences|process|cpg/))
    return "Process Industries"
  return "Discrete Manufacturing"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TreeData = { name: string; children?: TreeData[]; [key: string]: any }

function buildHierarchy(data: Company[], mode: HierarchyMode): TreeData {
  const hData: TreeData = { name: "root", children: [] }

  if (mode === "investment-subcat") {
    const grouped = d3.group(data, (d) => d.investmentList || "Other", (d) => d.subsegment || "Uncategorized")
    grouped.forEach((sub, name) => {
      const parent: TreeData = { name, children: [] }
      sub.forEach((items, subname) => {
        parent.children!.push({ name: subname, children: items as unknown as TreeData[] })
      })
      hData.children!.push(parent)
    })
  } else if (mode === "mfg-industry") {
    const grouped = d3.group(
      data,
      (d) => getManufacturingType(d),
      (d) => (d.industriesServed && d.industriesServed.length > 0 ? d.industriesServed[0] : "Unknown")
    )
    grouped.forEach((sub, name) => {
      const parent: TreeData = { name, children: [] }
      sub.forEach((items, subname) => {
        parent.children!.push({ name: subname, children: items as unknown as TreeData[] })
      })
      hData.children!.push(parent)
    })
  } else {
    const grouped = d3.group(data, (d) => d.country || "Unknown", (d) => d.investmentList || "Other")
    grouped.forEach((sub, name) => {
      const parent: TreeData = { name, children: [] }
      sub.forEach((items, subname) => {
        parent.children!.push({ name: subname, children: items as unknown as TreeData[] })
      })
      hData.children!.push(parent)
    })
  }

  return hData
}

export function TreemapChart({ data, className, shortlistedIds }: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<ViewState | null>(null)
  const [mode, setMode] = useState<HierarchyMode>("investment-subcat")
  const [metric, setMetric] = useState<MetricKey>("totalFunding")
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    if (!width || !height) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    let root: d3.HierarchyRectangularNode<TreeData>

    if (currentView) {
      let filtered: Company[]
      if (mode === "investment-subcat")
        filtered = data.filter((d) => (d.investmentList || "Other") === currentView.name)
      else if (mode === "mfg-industry")
        filtered = data.filter((d) => getManufacturingType(d) === currentView.name)
      else filtered = data.filter((d) => (d.country || "Unknown") === currentView.name)

      const groupFn = (d: Company) => {
        if (mode === "investment-subcat") return d.subsegment || "Uncategorized"
        if (mode === "mfg-industry")
          return d.industriesServed && d.industriesServed.length > 0 ? d.industriesServed[0] : "Unknown"
        return d.country || "Unknown"
      }

      const grouped = d3.group(filtered, groupFn)
      const hData: TreeData = { name: currentView.name, children: [] }
      grouped.forEach((items, name) => {
        hData.children!.push({ name, children: items as unknown as TreeData[] })
      })
      root = d3.treemap<TreeData>().size([width, height]).paddingOuter(4).paddingTop(currentView ? 20 : 28).paddingInner(2).round(true)(
        d3.hierarchy(hData).sum((d) => { if (d.children) return 0; const company = d as unknown as Company; return +(company[metric as keyof Company] as number) || 1 }).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      )
    } else {
      root = d3.treemap<TreeData>().size([width, height]).paddingOuter(4).paddingTop(currentView ? 20 : 28).paddingInner(2).round(true)(
        d3.hierarchy(buildHierarchy(data, mode)).sum((d) => { if (d.children) return 0; const company = d as unknown as Company; return +(company[metric as keyof Company] as number) || 1 }).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      )
    }

    // Draw leaves
    const leaf = svg
      .selectAll<SVGGElement, d3.HierarchyRectangularNode<TreeData>>("g.leaf")
      .data(root.leaves())
      .join("g")
      .attr("class", "leaf")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)

    leaf
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => {
        const colorTarget = currentView
          ? d.parent?.data.name ?? ""
          : d.parent?.parent
            ? d.parent.parent.data.name
            : d.parent?.data.name ?? ""
        return getInvestmentColor(colorTarget || "Other")
      })
      .attr("stroke", (d) => {
        const company = d.data as unknown as Company
        return shortlistedIds?.has(company.id) ? "#f59e0b" : "hsl(var(--background))"
      })
      .attr("stroke-width", (d) => {
        const company = d.data as unknown as Company
        return shortlistedIds?.has(company.id) ? 2.5 : 0.5
      })
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        if (!tooltipRef.current) return
        const company = d.data as unknown as Company
        const label = METRICS.find((m) => m.value === metric)?.label ?? metric
        let val: string
        if (metric === "totalFunding" || metric === "estimatedMarketValue") {
          val = formatCurrency((company[metric] as number) || 0)
        } else {
          val = String((company[metric] as number) || 0)
        }
        tooltipRef.current.style.visibility = "visible"
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
        tooltipRef.current.innerHTML = `<div style="font-weight:bold;border-bottom:1px solid hsl(var(--border));padding-bottom:4px;margin-bottom:4px;">${company.name}</div><div style="font-size:11px;color:hsl(var(--muted-foreground));">${d.parent?.data.name}</div><div style="margin-top:4px;">${label}: <span style="color:hsl(var(--primary));font-weight:bold;">${val}</span></div>${company.valuationConfidence ? `<div style="font-size:11px;margin-top:2px;color:hsl(var(--muted-foreground));">Val. Confidence: <span style="color:hsl(var(--foreground));">${company.valuationConfidence}</span></div>` : ""}${company.reportedValuation ? `<div style="font-size:11px;color:hsl(var(--muted-foreground));">Reported: <span style="color:hsl(var(--foreground));">${company.reportedValuation}${company.reportedValuationYear ? ` (${company.reportedValuationYear})` : ""}</span></div>` : ""}`
      })
      .on("mousemove", (event) => {
        if (!tooltipRef.current) return
        tooltipRef.current.style.top = `${event.pageY - 10}px`
        tooltipRef.current.style.left = `${event.pageX + 15}px`
      })
      .on("mouseout", () => {
        if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
      })

    leaf
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text((d) => {
        const company = d.data as unknown as Company
        return d.x1 - d.x0 > 50 && d.y1 - d.y0 > 20 ? (company.name || "") : ""
      })
      .style("font-size", "9px")
      .style("fill", "#fff")
      .style("pointer-events", "none")

    if (!currentView) {
      const groups = svg
        .selectAll<SVGGElement, d3.HierarchyRectangularNode<TreeData>>("g.group-overlay")
        .data(root.descendants().filter((d) => d.depth === 1) as d3.HierarchyRectangularNode<TreeData>[])
        .join("g")
        .attr("class", "group-overlay")
        .style("cursor", "pointer")
        .on("click", (_, d) => {
          setCurrentView({ name: d.data.name })
        })

      groups
        .append("rect")
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0)
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("fill", "rgba(255,255,255,0)")
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .on("mouseover", function () {
          d3.select(this).attr("fill", "rgba(255,255,255,0.1)")
        })
        .on("mouseout", function () {
          d3.select(this).attr("fill", "rgba(255,255,255,0)")
        })

      groups
        .append("text")
        .attr("x", (d) => d.x0 + 8)
        .attr("y", (d) => d.y0 + 18)
        .text((d) => (d.x1 - d.x0 > 80 ? d.data.name : ""))
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#fff")
        .style("pointer-events", "none")
        .style("text-transform", "uppercase")
    } else {
      svg
        .append("text")
        .attr("x", 10)
        .attr("y", 15)
        .text(currentView.name)
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "hsl(var(--primary))")

      svg
        .selectAll<SVGTextElement, d3.HierarchyRectangularNode<TreeData>>("text.category-label")
        .data(root.descendants().filter((d) => d.depth === 1) as d3.HierarchyRectangularNode<TreeData>[])
        .join("text")
        .attr("class", "category-label")
        .attr("x", (d) => d.x0 + 6)
        .attr("y", (d) => d.y0 + 16)
        .text((d) => (d.x1 - d.x0 > 60 ? d.data.name : ""))
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#fff")
        .style("pointer-events", "none")
        .style("opacity", "0.9")
    }
  }, [data, currentView, mode, metric, shortlistedIds])

  return (
    <Card className={cn("flex flex-col", className)}>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Hierarchy</label>
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value as HierarchyMode); setCurrentView(null) }}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {HIERARCHY_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        {currentView && (
          <button
            onClick={() => setCurrentView(null)}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            All Segments / <span className="text-primary font-semibold">{currentView.name}</span>
          </button>
        )}
      </div>

      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            visibility: "hidden",
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            color: "hsl(var(--popover-foreground))",
            pointerEvents: "none",
            zIndex: 9999,
            maxWidth: "200px",
          }}
        />
      </div>
    </Card>
  )
}
