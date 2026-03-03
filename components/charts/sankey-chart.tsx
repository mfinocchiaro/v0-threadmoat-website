"use client"

import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SankeyChartProps {
  data: Company[]
  className?: string
}

type ViewType = "innovation-pipeline" | "geographic-hubs" | "funding-journey" | "industry-disruption"

const VIEW_OPTIONS: { value: ViewType; label: string; stages: string[] }[] = [
  { value: "innovation-pipeline", label: "Innovation Pipeline", stages: ["Segment", "Phase", "Funding", "Impact"] },
  { value: "geographic-hubs", label: "Geographic Hubs", stages: ["Country", "Segment", "Performance"] },
  { value: "funding-journey", label: "Funding Journey", stages: ["Segment", "Round", "Size"] },
  { value: "industry-disruption", label: "Industry Disruption", stages: ["Segment", "Industry", "Success"] },
]

interface SankeyNode {
  name: string
  layer: number
  x0?: number; x1?: number; y0?: number; y1?: number
  value?: number
}

interface SankeyLink {
  source: number
  target: number
  value: number
  sourceNode?: SankeyNode
  targetNode?: SankeyNode
}

function buildFlowData(data: Company[], viewType: ViewType) {
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []
  const nodeMap = new Map<string, number>()

  function getNode(name: string, layer: number): number {
    const key = `${layer}:${name}`
    if (!nodeMap.has(key)) {
      nodeMap.set(key, nodes.length)
      nodes.push({ name, layer })
    }
    return nodeMap.get(key)!
  }

  function addLink(s: number, t: number) {
    const key = `${s}-${t}`
    const existing = links.find((l) => `${l.source}-${l.target}` === key)
    if (existing) existing.value += 1
    else links.push({ source: s, target: t, value: 1 })
  }

  data.forEach((d) => {
    if (viewType === "innovation-pipeline") {
      const cat = (d.investmentList || "Other").split("-").pop() || "Other"
      const phase = d.startupLifecyclePhase || "Unknown"
      const fund = d.totalFunding > 50_000_000 ? "High Funding" : "Emerging"
      const impact = (d.industryImpact || 0) > 4 ? "Elite" : "Target"
      const i0 = getNode(cat, 0), i1 = getNode(phase, 1), i2 = getNode(fund, 2), i3 = getNode(impact, 3)
      addLink(i0, i1); addLink(i1, i2); addLink(i2, i3)
    } else if (viewType === "geographic-hubs") {
      const country = d.country || "Unknown"
      const segment = (d.investmentList || "Other").split("-").pop() || "Other"
      const perf = (d.weightedScore || 0) > 3.5 ? "High Perf" : "Standard"
      const i0 = getNode(country, 0), i1 = getNode(segment, 1), i2 = getNode(perf, 2)
      addLink(i0, i1); addLink(i1, i2)
    } else if (viewType === "funding-journey") {
      const segment = (d.investmentList || "Other").split("-").pop() || "Other"
      const round = d.latestFundingRound || "Unknown"
      const size = d.headcount > 200 ? "Large" : d.headcount > 50 ? "Mid" : "Small"
      const i0 = getNode(segment, 0), i1 = getNode(round, 1), i2 = getNode(size, 2)
      addLink(i0, i1); addLink(i1, i2)
    } else {
      const segment = (d.investmentList || "Other").split("-").pop() || "Other"
      const industry = d.industriesServed?.[0] || "Unknown"
      const success = (d.weightedScore || 0) > 4 ? "Leaders" : "Challengers"
      const i0 = getNode(segment, 0), i1 = getNode(industry, 1), i2 = getNode(success, 2)
      addLink(i0, i1); addLink(i1, i2)
    }
  })

  return { nodes, links }
}

function layoutSankey(
  nodes: SankeyNode[],
  links: SankeyLink[],
  width: number,
  height: number
) {
  const maxLayer = Math.max(...nodes.map((n) => n.layer))
  const layerWidth = 20
  const xSpacing = (width - layerWidth) / maxLayer

  // Assign x positions
  nodes.forEach((n) => {
    n.x0 = n.layer * xSpacing
    n.x1 = n.x0 + layerWidth
  })

  // Attach node objects to links
  links.forEach((l) => {
    l.sourceNode = nodes[l.source]
    l.targetNode = nodes[l.target]
  })

  // Calculate node values (sum of incoming or outgoing links)
  nodes.forEach((n, i) => {
    const inVal = links.filter((l) => l.target === i).reduce((s, l) => s + l.value, 0)
    const outVal = links.filter((l) => l.source === i).reduce((s, l) => s + l.value, 0)
    n.value = Math.max(inVal, outVal, 1)
  })

  // Group nodes by layer and assign y positions
  const layers = d3.group(nodes, (n) => n.layer)
  const padding = 10

  layers.forEach((layerNodes) => {
    const totalVal = d3.sum(layerNodes, (n) => n.value ?? 1)
    const totalPad = padding * (layerNodes.length - 1)
    const availH = height - totalPad
    let y = 0
    layerNodes.sort((a, b) => (a.name > b.name ? 1 : -1))
    layerNodes.forEach((n) => {
      const h = ((n.value ?? 1) / totalVal) * availH
      n.y0 = y
      n.y1 = y + h
      y += h + padding
    })
  })

  // Calculate link widths and y-offsets
  const linkData = links.map((l) => {
    const sn = nodes[l.source]
    const tn = nodes[l.target]
    const sHeight = (sn.y1! - sn.y0!)
    const tHeight = (tn.y1! - tn.y0!)
    const sVal = links.filter((ll) => ll.source === l.source).reduce((s, ll) => s + ll.value, 0)
    const tVal = links.filter((ll) => ll.target === l.target).reduce((s, ll) => s + ll.value, 0)
    return {
      ...l,
      width: Math.max(1, (l.value / Math.max(sVal, tVal)) * Math.min(sHeight, tHeight)),
    }
  })

  return { nodes, linkData }
}

export function SankeyChart({ data, className }: SankeyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewType, setViewType] = useState<ViewType>("innovation-pipeline")
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth - 40
    const height = Math.max(500, containerRef.current.clientHeight - 60)
    if (!width || !height) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", width).attr("height", height)

    const { nodes, links } = buildFlowData(data, viewType)
    if (nodes.length === 0) return

    const { nodes: laidOutNodes, linkData } = layoutSankey(nodes, links, width, height)
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    // Draw links
    const linkG = svg.append("g")
    linkData.forEach((l) => {
      const sn = laidOutNodes[l.source]
      const tn = laidOutNodes[l.target]
      const sx = sn.x1!
      const tx = tn.x0!
      const sy = (sn.y0! + sn.y1!) / 2
      const ty = (tn.y0! + tn.y1!) / 2
      const mx = (sx + tx) / 2

      linkG
        .append("path")
        .attr("d", `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`)
        .attr("fill", "none")
        .attr("stroke", colorScale(String(sn.layer)))
        .attr("stroke-width", Math.max(1, l.width))
        .attr("stroke-opacity", 0.35)
        .on("mouseover", function () {
          d3.select(this).attr("stroke-opacity", 0.65)
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-opacity", 0.35)
        })
    })

    // Draw nodes
    laidOutNodes.forEach((n) => {
      const g = svg.append("g")
      g.append("rect")
        .attr("x", n.x0!)
        .attr("y", n.y0!)
        .attr("width", (n.x1! - n.x0!))
        .attr("height", Math.max(1, n.y1! - n.y0!))
        .attr("fill", colorScale(String(n.layer)))
        .attr("fill-opacity", 0.9)
        .on("mouseover", (event) => {
          if (!tooltipRef.current) return
          tooltipRef.current.style.visibility = "visible"
          tooltipRef.current.style.top = `${event.pageY - 10}px`
          tooltipRef.current.style.left = `${event.pageX + 15}px`
          tooltipRef.current.innerHTML = `<strong>${n.name}</strong><br>Flow count: ${n.value}`
        })
        .on("mousemove", (event) => {
          if (!tooltipRef.current) return
          tooltipRef.current.style.top = `${event.pageY - 10}px`
          tooltipRef.current.style.left = `${event.pageX + 15}px`
        })
        .on("mouseout", () => {
          if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden"
        })

      // Label
      const labelX = n.x0! < width / 2 ? n.x1! + 6 : n.x0! - 6
      const anchor = n.x0! < width / 2 ? "start" : "end"
      if (n.y1! - n.y0! > 10) {
        g.append("text")
          .attr("x", labelX)
          .attr("y", (n.y0! + n.y1!) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", anchor)
          .attr("font-size", "10px")
          .attr("fill", "#cbd5e1")
          .text(n.name.length > 18 ? n.name.slice(0, 16) + "…" : n.name)
      }
    })

    // Stage labels
    const config = VIEW_OPTIONS.find((v) => v.value === viewType)
    if (config) {
      const maxLayer = Math.max(...laidOutNodes.map((n) => n.layer))
      const xSpacing = (width - 20) / maxLayer
      config.stages.forEach((stage, i) => {
        svg
          .append("text")
          .attr("x", i * xSpacing + 10)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "600")
          .attr("fill", "#64748b")
          .attr("text-transform", "uppercase")
          .text(stage.toUpperCase())
      })
    }
  }, [data, viewType])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap gap-3 items-center p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">View</label>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            {VIEW_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {VIEW_OPTIONS.find((v) => v.value === viewType)?.stages.map((s, i, arr) => (
            <React.Fragment key={s}>
              <span>{s}</span>
              {i < arr.length - 1 && <span className="opacity-30">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            visibility: "hidden",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            color: "#f1f5f9",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      </div>
    </Card>
  )
}
