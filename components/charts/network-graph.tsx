"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { getInvestmentColor, INVESTMENT_LIST_COLORS } from "@/lib/investment-colors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { RotateCcw, Building2, Search, X } from "lucide-react"

interface NetworkGraphProps {
  data: Company[]
  className?: string
  preview?: boolean
}

type NodeType = "company" | "mfg" | "investment" | "industry" | "country" | "subsegment" | "category" | "subcategory" | "incumbent"
type LinkKind = "primary" | "secondary"

interface Node extends d3.SimulationNodeDatum {
  id: string
  type: NodeType
  val: number
  moat: number
  investmentList?: string
  data?: Company
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
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
  incumbent: "#dc2626",
}

// Human-readable labels for hub types
const HUB_LABELS: Record<string, string> = {
  mfg: "Manufacturing Type",
  investment: "Investment List",
  industry: "Industry",
  country: "Country",
  subsegment: "Subsegment",
  category: "Capability Tag",
  subcategory: "Subcategory",
  incumbent: "Incumbent Product",
}

// Stable moat stroke-width scale (module-level, no effect dependency needed)
const moatStrokeScale = d3.scaleLinear().domain([0, 5]).range([1, 4]).clamp(true)

// Normalize common manufacturing type variants
function normalizeMfgType(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === "Dicrete Manufacturing" || trimmed === "Discrete") return "Discrete Manufacturing"
  if (trimmed === "Process Manufacturing") return "Process Industries"
  return trimmed
}

export function NetworkGraph({ data, className, preview = false }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [primaryType, setPrimaryType] = useState<string>("investment")
  const [secondaryType, setSecondaryType] = useState<string>("subcategory")
  const [metric, setMetric] = useState<string>("headcount")
  const [showIncumbents, setShowIncumbents] = useState(false)
  const [incumbents, setIncumbents] = useState<Array<{id: string; vendor: string; category: string}>>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Refs for imperative D3 updates (search highlight, annotation, zoom)
  const searchQueryRef = useRef("")
  const nodeSelRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown> | null>(null)
  const annotLayerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  useEffect(() => {
    fetch('/data/incumbents.json')
      .then(r => r.json())
      .then(setIncumbents)
      .catch(() => {}) // silently fail if file not present
  }, [])

  const graphData = useMemo(() => {
    if (!data || data.length === 0) return { nodes: [], links: [], maxVal: 1, hubTypes: new Set<NodeType>() }

    const nodes: Node[] = []
    const links: Link[] = []
    const nodeMap = new Map<string, boolean>()
    const hubTypes = new Set<NodeType>()

    const addNode = (id: string, type: NodeType) => {
      if (!id) return
      hubTypes.add(type)
      if (!nodeMap.has(id)) {
        nodeMap.set(id, true)
        nodes.push({ id, type, val: 1, moat: 0 })
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
        nodes.push({
          id: d.name,
          type: "company",
          val: getMetricValue(d),
          moat: d.competitiveMoat || 0,
          investmentList: d.investmentList,
          data: d,
        })
      }

      // Primary linkage
      if (primaryType === "mfg" && d.manufacturingType) {
        // Split comma-separated manufacturing types into individual links
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

    if (showIncumbents) {
      incumbents.forEach(inc => {
        const id = `★ ${inc.id}`
        if (!nodeMap.has(id)) {
          nodeMap.set(id, true)
          nodes.push({ id, type: 'incumbent', val: 30, moat: 5 })
          hubTypes.add('incumbent')
        }
        // Link to matching investment category hub if it exists
        const catLabel = inc.category.replace(/^\d+-/, '').trim()
        if (primaryType === 'investment' && nodeMap.has(catLabel)) {
          links.push({ source: id, target: catLabel, kind: 'primary' })
        }
      })
    }

    return { nodes, links, maxVal, hubTypes }
  }, [data, primaryType, secondaryType, metric, showIncumbents, incumbents])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg.append("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", event => g.attr("transform", event.transform))

    svg.call(zoom)
    zoomRef.current = zoom

    // Annotation layer — drawn above all nodes so it's always visible
    const annotLayer = g.append("g").attr("class", "search-annot-layer")
    annotLayerRef.current = annotLayer

    // Helper: draw/update the search annotation at the matched node's current position
    function applyAnnotation() {
      annotLayer.selectAll("*").remove()
      const q = searchQueryRef.current.trim().toLowerCase()
      if (!q) return
      const match = graphData.nodes.find(n => n.type === "company" && n.id.toLowerCase().includes(q))
      if (!match || match.x === undefined || match.y === undefined) return

      const ag = annotLayer.append("g").attr("transform", `translate(${match.x},${match.y})`)
      // Dashed line from node to label
      ag.append("line")
        .attr("x1", 0).attr("y1", -14)
        .attr("x2", 0).attr("y2", -34)
        .attr("stroke", "#fbbf24").attr("stroke-width", 1.5).attr("stroke-dasharray", "3,2")
      // Label pill background
      const labelText = match.id.length > 24 ? match.id.slice(0, 22) + "…" : match.id
      const labelW = labelText.length * 6.5 + 18
      ag.append("rect")
        .attr("x", -labelW / 2).attr("y", -58)
        .attr("width", labelW).attr("height", 22)
        .attr("rx", 5).attr("fill", "#fbbf24").attr("opacity", 0.95)
      // Label text
      ag.append("text")
        .attr("x", 0).attr("y", -43)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px").attr("font-weight", "700")
        .attr("fill", "#0f172a")
        .text(labelText)
    }

    const radiusScale = d3.scaleSqrt()
      .domain([0, graphData.maxVal])
      .range([4, metric === "weightedScore" ? 15 : 25])

    // Moat → border width: 0 moat = 1px, 5 moat = 4px
    const moatScale = d3.scaleLinear()
      .domain([0, 5])
      .range([1, 4])
      .clamp(true)

    const getNodeColor = (d: Node) => {
      if (d.type === "company") {
        return d.investmentList ? getInvestmentColor(d.investmentList) : "#64748b"
      }
      return HUB_COLORS[d.type] ?? "#64748b"
    }

    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force("link", d3.forceLink<Node, Link>(graphData.links).id((d: Node) => d.id).distance(80).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("collide", d3.forceCollide<Node>().radius(d => (d.type === "company" ? radiusScale(d.val) : 10) + 5))

    // Detect dark mode for link contrast
    const isDark = document.documentElement.classList.contains("dark")
    const primaryLinkColor = isDark ? "#94a3b8" : "#334155"
    const secondaryLinkColor = isDark ? "#64748b" : "#64748b"

    // Links — styled by kind (primary = solid thicker, secondary = dashed thinner)
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d: Link) => d.kind === "primary" ? primaryLinkColor : secondaryLinkColor)
      .attr("stroke-opacity", (d: Link) => d.kind === "primary" ? 0.5 : 0.3)
      .attr("stroke-width", (d: Link) => d.kind === "primary" ? 2 : 1)
      .attr("stroke-dasharray", (d: Link) => d.kind === "secondary" ? "4,3" : "none")

    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")

    nodeSelRef.current = node as d3.Selection<SVGGElement, Node, SVGGElement, unknown>

    if (!preview) {
      node.call(
        d3.drag<SVGGElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any
      )
    }

    node.append("circle")
      .attr("r", d => d.type === "company" ? radiusScale(d.val) : 8)
      .attr("fill", getNodeColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", d => d.type === "company" ? moatScale(d.moat) : 1.5)
      .attr("stroke-opacity", d => d.type === "company" ? 0.9 : 1)
      .style("cursor", preview ? "default" : "pointer")
      .on("mouseover", function () {
        if (!preview) {
          d3.select(this).attr("stroke", "var(--primary)").attr("stroke-width", 3)
        }
      })
      .on("mouseout", function (_, d) {
        if (!preview) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", d.type === "company" ? moatScale(d.moat) : 1.5)
        }
      })

    // In preview mode, only show labels for non-company nodes (categories/hubs)
    node.filter(d => preview ? d.type !== "company" : true)
      .append("text")
      .text(d => d.id)
      .attr("x", d => (d.type === "company" ? radiusScale(d.val) : 8) + 5)
      .attr("y", 3)
      .style("font-size", "10px")
      .style("fill", "var(--foreground)")
      .style("pointer-events", "none")
      .style("opacity", d => d.type === "company" ? 0.8 : 1)

    if (!preview) {
      node.append("title").text(d => {
        if (d.type === "company" && d.data) {
          const c = d.data
          const moatLabel = c.competitiveMoat ? `Moat: ${c.competitiveMoat}/5` : ""
          return `${d.id}\n${c.investmentList || ""}\n${moatLabel}`.trim()
        }
        return `${d.id}\n${d.type}`
      })
    }

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)
      node.attr("transform", d => `translate(${d.x},${d.y})`)
      applyAnnotation()
    })

    simulation.on("end", applyAnnotation)

    return () => { simulation.stop() }
  }, [graphData, metric])

  // Imperative search highlight — runs without restarting the simulation
  useEffect(() => {
    searchQueryRef.current = searchQuery

    const nodeSel = nodeSelRef.current
    const annotLayer = annotLayerRef.current
    const q = searchQuery.trim().toLowerCase()

    // Reset all node styles first
    if (nodeSel) {
      nodeSel.each(function (d) {
        const sel = d3.select(this)
        sel.select("circle")
          .attr("stroke", "#fff")
          .attr("stroke-width", d.type === "company" ? moatStrokeScale(d.moat) : 1.5)
          .attr("opacity", 0.9)
        sel.select("text")
          .attr("opacity", d.type === "company" ? 0.8 : 1)
      })
    }

    // Clear annotation
    annotLayer?.selectAll("*").remove()

    if (!q || !nodeSel) return

    // Find best matching company node
    const match = graphData.nodes.find(n => n.type === "company" && n.id.toLowerCase().includes(q))

    // Dim all nodes; highlight match
    nodeSel.each(function (d) {
      const isMatch = match && d.id === match.id
      const dimmed = !isMatch
      const sel = d3.select(this)
      sel.select("circle").attr("opacity", dimmed ? 0.07 : 1)
      sel.select("text").attr("opacity", dimmed ? 0.04 : (d.type === "company" ? 0.9 : 1))
      if (isMatch) {
        sel.select("circle")
          .attr("stroke", "#fbbf24")
          .attr("stroke-width", 4)
          .attr("opacity", 1)
      }
    })

    // Draw annotation if node has settled position
    if (match && annotLayer && match.x !== undefined && match.y !== undefined) {
      const ag = annotLayer.append("g").attr("transform", `translate(${match.x},${match.y})`)
      ag.append("line")
        .attr("x1", 0).attr("y1", -14)
        .attr("x2", 0).attr("y2", -34)
        .attr("stroke", "#fbbf24").attr("stroke-width", 1.5).attr("stroke-dasharray", "3,2")
      const labelText = match.id.length > 24 ? match.id.slice(0, 22) + "…" : match.id
      const labelW = labelText.length * 6.5 + 18
      ag.append("rect")
        .attr("x", -labelW / 2).attr("y", -58)
        .attr("width", labelW).attr("height", 22)
        .attr("rx", 5).attr("fill", "#fbbf24").attr("opacity", 0.95)
      ag.append("text")
        .attr("x", 0).attr("y", -43)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px").attr("font-weight", "700")
        .attr("fill", "#0f172a")
        .text(labelText)

      // Auto-pan to matched node
      if (zoomRef.current && svgRef.current && containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        const scale = 1.8
        d3.select(svgRef.current)
          .transition().duration(600)
          .call(
            zoomRef.current.transform as any,
            d3.zoomIdentity.translate(w / 2 - match.x * scale, h / 2 - match.y * scale).scale(scale)
          )
      }
    }
  }, [searchQuery, graphData.nodes])

  const resetZoom = () => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity)
  }

  // Build legend items from active hub types + investment list colors
  const legendItems = useMemo(() => {
    const items: { color: string; label: string; shape: "circle" | "line-solid" | "line-dashed" | "border" }[] = []

    // Hub node types currently in use
    graphData.hubTypes.forEach(type => {
      if (HUB_COLORS[type]) {
        items.push({ color: HUB_COLORS[type], label: HUB_LABELS[type] ?? type, shape: "circle" })
      }
    })

    return items
  }, [graphData.hubTypes])

  // Investment list colors for the company node legend
  const investmentLegend = useMemo(() => {
    return Object.entries(INVESTMENT_LIST_COLORS)
      .filter(([key]) => key !== "VC")
      .map(([label, color]) => {
        // Shorten labels for the legend
        const short = label.replace(/\s*\(.*\)/, "")
        return { color, label: short }
      })
  }, [])

  return (
    <Card className={`flex flex-col ${preview ? "min-h-[420px]" : "h-[calc(100vh-8rem)]"} ${className ?? ""}`}>
      {!preview && (
      <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-card">
        {/* Search bar */}
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Find startup…"
            className="h-8 text-xs pl-8 pr-7"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetZoom} className="h-8">
            <RotateCcw className="mr-2 h-3 w-3" />
            Reset View
          </Button>
          <Button
            variant={showIncumbents ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => setShowIncumbents(v => !v)}
          >
            <Building2 className="mr-2 h-3 w-3" />
            Incumbents {showIncumbents ? "On" : "Off"}
          </Button>
        </div>
      </div>
      )}
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-background border-b">
        <svg ref={svgRef} className="w-full h-full block" />
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
          {/* Hub node + link legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Clusters</span>
            {legendItems.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            ))}
            <span className="text-[9px] text-muted-foreground/50 mx-1">|</span>
            {/* Line styles */}
            <div className="flex items-center gap-1">
              <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" className="stroke-slate-700 dark:stroke-slate-400" strokeWidth="2" /></svg>
              <span className="text-[9px] text-muted-foreground">Primary</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" className="stroke-slate-500" strokeWidth="1" strokeDasharray="4,3" /></svg>
              <span className="text-[9px] text-muted-foreground">Secondary</span>
            </div>
            <span className="text-[9px] text-muted-foreground/50 mx-1">|</span>
            {/* Moat border */}
            <div className="flex items-center gap-1">
              <svg width="32" height="12">
                <circle cx="6" cy="6" r="4.5" fill="#64748b" stroke="#fff" strokeWidth="1" />
                <circle cx="20" cy="6" r="4.5" fill="#64748b" stroke="#fff" strokeWidth="3.5" />
              </svg>
              <span className="text-[9px] text-muted-foreground">Border = moat</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground/40">Moat Map inspired by Blake Courter</span>
          </div>
        </div>
      )}
    </Card>
  )
}
