"use client"

import React, { useRef, useState, useMemo, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Company } from "@/lib/company-data"
import { getInvestmentColor, INVESTMENT_LIST_COLORS } from "@/lib/investment-colors"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { RotateCcw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic import to avoid SSR issues with Three.js / WebGL
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full min-h-[500px] rounded-lg" />,
})

interface NetworkGraph3DProps {
  data: Company[]
  className?: string
  preview?: boolean
}

type NodeType = "company" | "mfg" | "investment" | "industry" | "country" | "subsegment" | "category" | "subcategory"
type LinkKind = "primary" | "secondary"

interface GraphNode {
  id: string
  type: NodeType
  val: number
  moat: number
  investmentList?: string
  color: string
  data?: Company
}

interface GraphLink {
  source: string
  target: string
  kind: LinkKind
}

// Hub node colors by type (non-company nodes)
const HUB_COLORS: Record<string, string> = {
  mfg: "#f59e0b",
  investment: "#14b8a6",
  industry: "#8b5cf6",
  country: "#ec4899",
  subsegment: "#10b981",
  category: "#f97316",
  subcategory: "#06b6d4",
}

const HUB_LABELS: Record<string, string> = {
  mfg: "Manufacturing Type",
  investment: "Investment List",
  industry: "Industry",
  country: "Country",
  subsegment: "Subsegment",
  category: "Capability Tag",
  subcategory: "Subcategory",
}

function normalizeMfgType(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === "Dicrete Manufacturing" || trimmed === "Discrete") return "Discrete Manufacturing"
  if (trimmed === "Process Manufacturing") return "Process Industries"
  return trimmed
}

export function NetworkGraph3D({ data, className, preview = false }: NetworkGraph3DProps) {
  const fgRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 600 })
  const [primaryType, setPrimaryType] = useState<string>("investment")
  const [secondaryType, setSecondaryType] = useState<string>("subcategory")
  const [metric, setMetric] = useState<string>("headcount")

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) setDims({ width, height })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const graphData = useMemo(() => {
    if (!data || data.length === 0) return { nodes: [] as GraphNode[], links: [] as GraphLink[], hubTypes: new Set<NodeType>() }

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const nodeMap = new Map<string, boolean>()
    const hubTypes = new Set<NodeType>()

    const addNode = (id: string, type: NodeType) => {
      if (!id) return
      hubTypes.add(type)
      if (!nodeMap.has(id)) {
        nodeMap.set(id, true)
        nodes.push({ id, type, val: 3, moat: 0, color: HUB_COLORS[type] ?? "#64748b" })
      }
    }

    const getMetricValue = (d: Company) => {
      switch (metric) {
        case "totalFunding": return d.totalFunding || 0
        case "estimatedValue": return d.estimatedMarketValue || 0
        case "weightedScore": return d.weightedScore || 0
        case "headcount": return d.headcount || 0
        default: return 10
      }
    }

    const values = data.map(d => getMetricValue(d))
    const maxVal = Math.max(...values, 1)

    data.forEach(d => {
      if (!nodeMap.has(d.name)) {
        nodeMap.set(d.name, true)
        const rawVal = getMetricValue(d)
        // Scale company node size: sqrt-scale from 1 to 8
        const scaledVal = 1 + (Math.sqrt(rawVal / maxVal) * 7)
        nodes.push({
          id: d.name,
          type: "company",
          val: scaledVal,
          moat: d.competitiveMoat || 0,
          investmentList: d.investmentList,
          color: d.investmentList ? getInvestmentColor(d.investmentList) : "#64748b",
          data: d,
        })
      }

      // Primary linkage
      if (primaryType === "mfg" && d.manufacturingType) {
        const types = d.manufacturingType.split(",").map(t => normalizeMfgType(t)).filter(Boolean)
        types.forEach(mfgType => {
          addNode(mfgType, "mfg")
          links.push({ source: d.name, target: mfgType, kind: "primary" })
        })
      } else if (primaryType === "investment" && d.investmentList) {
        const invList = d.investmentList.replace(/^\d+-/, "").trim()
        addNode(invList, "investment")
        links.push({ source: d.name, target: invList, kind: "primary" })
      }

      // Secondary linkage
      if (secondaryType === "industry") {
        ;(d.industriesServed || []).slice(0, 3).forEach(ind => {
          addNode(ind, "industry")
          links.push({ source: d.name, target: ind, kind: "secondary" })
        })
      } else if (secondaryType === "country" && d.country) {
        addNode(d.country, "country")
        links.push({ source: d.name, target: d.country, kind: "secondary" })
      } else if (secondaryType === "subsegment" && d.subsegment) {
        addNode(d.subsegment, "subsegment")
        links.push({ source: d.name, target: d.subsegment, kind: "secondary" })
      } else if (secondaryType === "category") {
        ;(d.categoryTags || []).slice(0, 3).forEach(tag => {
          const trimmed = tag.trim()
          if (trimmed) {
            addNode(trimmed, "category")
            links.push({ source: d.name, target: trimmed, kind: "secondary" })
          }
        })
      } else if (secondaryType === "subcategory" && d.subcategories) {
        addNode(d.subcategories, "subcategory")
        links.push({ source: d.name, target: d.subcategories, kind: "secondary" })
      }
    })

    return { nodes, links, hubTypes }
  }, [data, primaryType, secondaryType, metric])

  const nodeLabel = useCallback((node: any) => {
    if (node.type === "company" && node.data) {
      const c = node.data as Company
      const moatLabel = c.competitiveMoat ? `Moat: ${c.competitiveMoat}/5` : ""
      return `<div style="padding:6px 10px;background:rgba(0,0,0,0.85);border-radius:6px;color:#fff;font-size:12px;max-width:280px;line-height:1.4">
        <div style="font-weight:600;margin-bottom:2px">${node.id}</div>
        <div style="color:#94a3b8">${c.investmentList || ""}</div>
        ${c.hqLocation ? `<div style="color:#94a3b8">${c.hqLocation}</div>` : ""}
        ${moatLabel ? `<div style="color:#94a3b8">${moatLabel}</div>` : ""}
      </div>`
    }
    return `<div style="padding:4px 8px;background:rgba(0,0,0,0.85);border-radius:4px;color:#fff;font-size:11px">
      <span style="color:${HUB_COLORS[node.type] ?? "#94a3b8"}">${HUB_LABELS[node.type] ?? node.type}:</span> ${node.id}
    </div>`
  }, [])

  const linkColor = useCallback((link: any) => {
    return link.kind === "primary" ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.2)"
  }, [])

  const linkWidth = useCallback((link: any) => {
    return link.kind === "primary" ? 1.5 : 0.5
  }, [])

  const handleResetView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000)
    }
  }, [])

  // Investment list colors for the company node legend
  const investmentLegend = useMemo(() => {
    return Object.entries(INVESTMENT_LIST_COLORS)
      .filter(([key]) => key !== "VC")
      .map(([label, color]) => {
        const short = label.replace(/\s*\(.*\)/, "")
        return { color, label: short }
      })
  }, [])

  const legendItems = useMemo(() => {
    const items: { color: string; label: string }[] = []
    graphData.hubTypes.forEach(type => {
      if (HUB_COLORS[type]) {
        items.push({ color: HUB_COLORS[type], label: HUB_LABELS[type] ?? type })
      }
    })
    return items
  }, [graphData.hubTypes])

  return (
    <Card className={`flex flex-col ${preview ? "min-h-[420px]" : "h-[calc(100vh-8rem)]"} ${className ?? ""}`}>
      {!preview && (
        <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-card">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Metric Sizing</label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="headcount">Headcount</SelectItem>
                  <SelectItem value="totalFunding">Total Funding</SelectItem>
                  <SelectItem value="estimatedValue">Market Value</SelectItem>
                  <SelectItem value="weightedScore">Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Primary Cluster</label>
              <Select value={primaryType} onValueChange={setPrimaryType}>
                <SelectTrigger className="w-[170px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="investment">Investment List</SelectItem>
                  <SelectItem value="mfg">Manufacturing Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Secondary Link</label>
              <Select value={secondaryType} onValueChange={setSecondaryType}>
                <SelectTrigger className="w-[170px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subcategory">Subcategory</SelectItem>
                  <SelectItem value="category">Capability Tags</SelectItem>
                  <SelectItem value="industry">Industries Served</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="subsegment">Subsegment</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetView} className="h-8">
            <RotateCcw className="mr-2 h-3 w-3" />
            Reset View
          </Button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-black/95">
        {graphData.nodes.length > 0 && (
          <ForceGraph3D
            ref={fgRef}
            width={dims.width}
            height={dims.height}
            graphData={graphData}
            nodeId="id"
            nodeVal="val"
            nodeColor="color"
            nodeLabel={nodeLabel}
            nodeOpacity={0.92}
            nodeResolution={12}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkOpacity={0.6}
            linkDirectionalParticles={(link: any) => link.kind === "primary" ? 2 : 0}
            linkDirectionalParticleSpeed={0.003}
            linkDirectionalParticleWidth={1.5}
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
            enableNodeDrag={!preview}
            enableNavigationControls={!preview}
            warmupTicks={80}
            cooldownTicks={200}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading or no data...
          </div>
        )}
      </div>

      {!preview && (
        <div className="px-3 py-2 border-t bg-card space-y-1.5">
          {/* Investment list color legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Companies</span>
            {investmentLegend.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
          {/* Hub node legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Clusters</span>
            {legendItems.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            ))}
            <span className="text-[9px] text-muted-foreground/50 mx-1">|</span>
            <span className="text-[9px] text-muted-foreground">Primary links show particles</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground/40">3D Ecosystem · Drag to rotate · Scroll to zoom · Click node to focus</span>
          </div>
        </div>
      )}
    </Card>
  )
}
