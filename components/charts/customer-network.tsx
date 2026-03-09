"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ── Vague / non-company patterns to exclude ────────────────────────────────
const SKIP_PATTERNS = [
  /undisclosed/i, /none/i, /unknown/i, /n\/?a/i, /not disclosed/i, /stealth/i,
  /targeted at/i, /various/i, /multiple/i, /general/i, /several/i, /esp\./i,
  /incl\./i, /e\.g\./i, /such as/i, /and others/i, /more$/i, /^\d/,
  /manufacturers/i, /companies$/i, /industries/i, /engineers/i, /teams$/i,
  /firms$/i, /clients$/i, /enterprises/i, /bureaus/i, /factories/i, /shops$/i,
  /customers$/i, /hospitals$/i, /universities$/i, /startups$/i, /agencies/i,
  /studios$/i, /globally/i, /users$/i, /developers$/i, /defense$/i,
  /aerospace$/i, /automotive$/i, /medical device/i, /construction$/i,
  /pharma$/i, /logistics$/i, /OEM$/i, /mid-sized/i, /fortune/i,
  /pipeline$/i, /innovation labs/i, /design firms/i, /R&D$/i,
  /AEC /i, /manufacturing$/i, /^major /i, /^top /i, /^leading /i,
]

function isValidCustomer(name: string): boolean {
  if (name.length < 2 || name.length > 50) return false
  return !SKIP_PATTERNS.some(p => p.test(name))
}

function parseCustomers(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map(s => s.trim().replace(/^["']|["']$/g, ""))
    .filter(isValidCustomer)
}

interface CustomerNode {
  id: string
  type: "customer"
  name: string
  count: number // how many startups
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface StartupNode {
  id: string
  type: "startup"
  name: string
  investmentList: string
  headcount: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

type GraphNode = CustomerNode | StartupNode
type GraphLink = { source: string; target: string }

export function CustomerNetwork({ data, className }: { data: Company[]; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [minCount, setMinCount] = useState("3")

  const { nodes, links, customerCount } = useMemo(() => {
    const threshold = parseInt(minCount)
    const customerMap = new Map<string, Set<string>>() // customer → set of startup names
    const startupCustomers = new Map<string, { company: Company; customers: string[] }>()

    for (const company of data) {
      const customers = parseCustomers(company.knownCustomers)
      if (customers.length === 0) continue
      startupCustomers.set(company.id, { company, customers })
      for (const c of customers) {
        if (!customerMap.has(c)) customerMap.set(c, new Set())
        customerMap.get(c)!.add(company.id)
      }
    }

    // Filter to customers appearing in >= threshold startups
    const validCustomers = new Map<string, Set<string>>()
    for (const [cust, startups] of customerMap) {
      if (startups.size >= threshold) validCustomers.set(cust, startups)
    }

    // Build graph
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const usedStartups = new Set<string>()

    for (const [cust, startups] of validCustomers) {
      nodes.push({ id: `c:${cust}`, type: "customer", name: cust, count: startups.size })
      for (const sid of startups) {
        usedStartups.add(sid)
        links.push({ source: `c:${cust}`, target: `s:${sid}` })
      }
    }

    for (const sid of usedStartups) {
      const entry = startupCustomers.get(sid)
      if (!entry) continue
      const { company } = entry
      nodes.push({
        id: `s:${sid}`,
        type: "startup",
        name: company.name,
        investmentList: company.investmentList,
        headcount: company.headcount,
      })
    }

    return { nodes, links, customerCount: validCustomers.size }
  }, [data, minCount])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const container = svgRef.current.parentElement!
    const width = container.clientWidth
    const height = container.clientHeight

    svg.selectAll("*").remove()
    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const g = svg.append("g")

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (e) => g.attr("transform", e.transform))
    svg.call(zoom)

    // Size scales
    const maxCount = d3.max(nodes.filter(n => n.type === "customer"), n => (n as CustomerNode).count) || 1
    const rScale = d3.scaleSqrt().domain([1, maxCount]).range([14, 40])

    // Clone nodes/links for simulation (d3 mutates them)
    const simNodes = nodes.map(n => ({ ...n }))
    const simLinks = links.map(l => ({ ...l }))

    const simulation = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(simLinks as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
        .id((d: any) => d.id)
        .distance(80))
      .force("charge", d3.forceManyBody().strength((d: any) => d.type === "customer" ? -300 : -50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide((d: any) =>
        d.type === "customer" ? rScale(d.count) + 8 : 10
      ))

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1)

    // Customer nodes
    const customerNodes = g.append("g")
      .selectAll("g")
      .data(simNodes.filter(n => n.type === "customer"))
      .join("g")
      .attr("cursor", "pointer")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    customerNodes.append("circle")
      .attr("r", d => rScale((d as CustomerNode).count))
      .attr("fill", "hsl(var(--primary) / 0.15)")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 2)

    customerNodes.append("text")
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", d => Math.max(8, Math.min(12, rScale((d as CustomerNode).count) / 2.5)))
      .attr("fill", "hsl(var(--foreground))")
      .attr("pointer-events", "none")
      .each(function (d) {
        const r = rScale((d as CustomerNode).count)
        const text = d3.select(this)
        const name = d.name
        if (name.length * 4 > r * 2) {
          text.text(name.slice(0, Math.floor(r / 3)) + "…")
        }
      })

    // Startup nodes
    const startupNodes = g.append("g")
      .selectAll("circle")
      .data(simNodes.filter(n => n.type === "startup"))
      .join("circle")
      .attr("r", 5)
      .attr("fill", d => getInvestmentColor((d as StartupNode).investmentList))
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Tooltips
    const tooltip = d3.select(tooltipRef.current)

    function showTooltip(e: MouseEvent, html: string) {
      tooltip
        .html(html)
        .style("left", `${e.pageX + 12}px`)
        .style("top", `${e.pageY - 28}px`)
        .style("opacity", "1")
        .style("pointer-events", "none")
    }

    function hideTooltip() {
      tooltip.style("opacity", "0")
    }

    customerNodes
      .on("mouseover", (e, d) => {
        const cn = d as CustomerNode
        showTooltip(e, `<strong>${cn.name}</strong><br/>${cn.count} startup${cn.count > 1 ? "s" : ""}`)
        // Highlight connected
        const connected = new Set(simLinks.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id).map(l => {
          const s = l.source as any, t = l.target as any
          return s.id === d.id ? t.id : s.id
        }))
        startupNodes.attr("opacity", n => connected.has((n as any).id) ? 1 : 0.1)
        link.attr("stroke-opacity", l => (l.source as any).id === d.id || (l.target as any).id === d.id ? 0.6 : 0.05)
      })
      .on("mouseout", () => {
        hideTooltip()
        startupNodes.attr("opacity", 1)
        link.attr("stroke-opacity", 0.3)
      })

    startupNodes
      .on("mouseover", (e, d) => {
        const sn = d as StartupNode
        showTooltip(e, `<strong>${sn.name}</strong><br/>${sn.investmentList}<br/>Headcount: ${sn.headcount}`)
        const connected = new Set(simLinks.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id).map(l => {
          const s = l.source as any, t = l.target as any
          return s.id === d.id ? t.id : s.id
        }))
        customerNodes.select("circle").attr("opacity", n => connected.has((n as any).id) ? 1 : 0.1)
        link.attr("stroke-opacity", l => (l.source as any).id === d.id || (l.target as any).id === d.id ? 0.6 : 0.05)
      })
      .on("mouseout", () => {
        hideTooltip()
        customerNodes.select("circle").attr("opacity", 1)
        link.attr("stroke-opacity", 0.3)
      })

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y)
      customerNodes.attr("transform", d => `translate(${d.x},${d.y})`)
      startupNodes.attr("cx", d => d.x!).attr("cy", d => d.y!)
    })

    // Initial zoom to fit
    simulation.on("end", () => {
      const xs = simNodes.map(n => n.x!)
      const ys = simNodes.map(n => n.y!)
      const [x0, x1] = [d3.min(xs)! - 50, d3.max(xs)! + 50]
      const [y0, y1] = [d3.min(ys)! - 50, d3.max(ys)! + 50]
      const scale = Math.min(width / (x1 - x0), height / (y1 - y0), 1.5)
      const tx = (width - scale * (x0 + x1)) / 2
      const ty = (height - scale * (y0 + y1)) / 2
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      )
    })

    return () => { simulation.stop() }
  }, [nodes, links])

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-3 bg-card/90 backdrop-blur rounded-md border border-border px-3 py-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Min. Startups</label>
          <Select value={minCount} onValueChange={setMinCount}>
            <SelectTrigger className="w-[90px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {customerCount} customers &middot; {nodes.filter(n => n.type === "startup").length} startups
        </div>
      </div>

      {/* Chart */}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md opacity-0 transition-opacity"
        style={{ pointerEvents: "none" }}
      />
    </div>
  )
}
