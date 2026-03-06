"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
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

interface NetworkGraphProps {
  data: Company[]
  className?: string
}

interface Node extends d3.SimulationNodeDatum {
  id: string
  type: "company" | "mfg" | "investment" | "industry" | "country" | "subsegment"
  val: number
  data?: Company
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
}

export function NetworkGraph({ data, className }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [primaryType, setPrimaryType] = useState<string>("mfg")
  const [secondaryType, setSecondaryType] = useState<string>("industry")
  const [metric, setMetric] = useState<string>("headcount")

  const graphData = useMemo(() => {
    if (!data || data.length === 0) return { nodes: [], links: [], maxVal: 1 }

    const nodes: Node[] = []
    const links: Link[] = []
    const nodeMap = new Map<string, boolean>()

    const addNode = (id: string, type: Node["type"]) => {
      if (!id) return
      if (!nodeMap.has(id)) {
        nodeMap.set(id, true)
        nodes.push({ id, type, val: 1 })
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
        nodes.push({ id: d.name, type: "company", val: getMetricValue(d), data: d })
      }

      if (primaryType === "mfg" && d.manufacturingType) {
        addNode(d.manufacturingType, "mfg")
        links.push({ source: d.name, target: d.manufacturingType })
      } else if (primaryType === "investment" && d.investmentList) {
        const invList = d.investmentList.replace(/^\d+-/, "").trim()
        addNode(invList, "investment")
        links.push({ source: d.name, target: invList })
      }

      if (secondaryType === "industry") {
        ;(d.industriesServed || []).slice(0, 3).forEach(ind => {
          addNode(ind, "industry")
          links.push({ source: d.name, target: ind })
        })
      } else if (secondaryType === "country" && d.country) {
        addNode(d.country, "country")
        links.push({ source: d.name, target: d.country })
      } else if (secondaryType === "subsegment" && d.subsegment) {
        addNode(d.subsegment, "subsegment")
        links.push({ source: d.name, target: d.subsegment })
      }
    })

    return { nodes, links, maxVal }
  }, [data, primaryType, secondaryType, metric])

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

    const radiusScale = d3.scaleSqrt()
      .domain([0, graphData.maxVal])
      .range([4, metric === "weightedScore" ? 15 : 25])

    const getNodeColor = (d: Node) => {
      switch (d.type) {
        case "company": return "#3b82f6"
        case "mfg": return "#f59e0b"
        case "investment": return "#14b8a6"
        case "industry": return "#8b5cf6"
        case "country": return "#ec4899"
        case "subsegment": return "#10b981"
        default: return "#64748b"
      }
    }

    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force("link", d3.forceLink<Node, Link>(graphData.links).id((d: Node) => d.id).distance(80).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("collide", d3.forceCollide<Node>().radius(d => (d.type === "company" ? radiusScale(d.val) : 10) + 5))

    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", 1)

    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(
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

    node.append("circle")
      .attr("r", d => d.type === "company" ? radiusScale(d.val) : 8)
      .attr("fill", getNodeColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function () { d3.select(this).attr("stroke", "var(--primary)").attr("stroke-width", 3) })
      .on("mouseout", function () { d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5) })

    node.append("text")
      .text(d => d.id)
      .attr("x", d => (d.type === "company" ? radiusScale(d.val) : 8) + 5)
      .attr("y", 3)
      .style("font-size", "10px")
      .style("fill", "var(--foreground)")
      .style("pointer-events", "none")
      .style("opacity", d => d.type === "company" ? 0.8 : 1)

    node.append("title").text(d => `${d.id}\n${d.type}`)

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)
      node.attr("transform", d => `translate(${d.x},${d.y})`)
    })

    return () => { simulation.stop() }
  }, [graphData, metric])

  const resetZoom = () => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity)
  }

  return (
    <Card className={`flex flex-col h-[calc(100vh-8rem)] ${className ?? ""}`}>
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
            <label className="text-xs font-medium text-muted-foreground">Primary Node</label>
            <Select value={primaryType} onValueChange={setPrimaryType}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mfg">Manufacturing Type</SelectItem>
                <SelectItem value="investment">Investment List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Secondary Node</label>
            <Select value={secondaryType} onValueChange={setSecondaryType}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="industry">Industries Served</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="subsegment">Subsegment</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetZoom} className="h-8">
          <RotateCcw className="mr-2 h-3 w-3" />
          Reset View
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-background border-b">
        <svg ref={svgRef} className="w-full h-full block" />
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading or no data...
          </div>
        )}
      </div>
      <p className="px-4 py-2 text-[10px] text-muted-foreground/60 text-right">
        Moat Map inspired by Blake Courter — thank you for the idea and encouragement.
      </p>
    </Card>
  )
}
