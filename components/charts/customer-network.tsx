"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"
import { getCustomerLogoUrl, parseKnownCustomers } from "@/lib/customer-logos"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      const customers = parseKnownCustomers(company.knownCustomers)
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

    // Clip paths for circular logo masking
    customerNodes.append("clipPath")
      .attr("id", d => `clip-${d.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
      .append("circle")
      .attr("r", d => rScale((d as CustomerNode).count) - 3)

    customerNodes.append("circle")
      .attr("r", d => rScale((d as CustomerNode).count))
      .attr("fill", "hsl(var(--card))")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 2)

    // Logo images (with fallback to text)
    customerNodes.each(function (d) {
      const node = d3.select(this)
      const r = rScale((d as CustomerNode).count)
      const logoUrl = getCustomerLogoUrl(d.name, Math.round(r * 3))

      if (logoUrl) {
        const imgSize = r * 1.4
        node.append("image")
          .attr("href", logoUrl)
          .attr("x", -imgSize / 2)
          .attr("y", -imgSize / 2)
          .attr("width", imgSize)
          .attr("height", imgSize)
          .attr("clip-path", `url(#clip-${d.id.replace(/[^a-zA-Z0-9]/g, "_")})`)
          .attr("pointer-events", "none")
          .attr("preserveAspectRatio", "xMidYMid meet")
          .on("error", function () {
            // Logo failed to load — show text instead
            d3.select(this).remove()
            node.append("text")
              .text(d.name.length > r / 3 ? d.name.slice(0, Math.floor(r / 3)) + "…" : d.name)
              .attr("text-anchor", "middle")
              .attr("dy", "0.35em")
              .attr("font-size", Math.max(8, Math.min(12, r / 2.5)))
              .attr("fill", "hsl(var(--foreground))")
              .attr("pointer-events", "none")
          })
      } else {
        // No logo mapping — text label
        node.append("text")
          .text(d.name.length > r / 3 ? d.name.slice(0, Math.floor(r / 3)) + "…" : d.name)
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("font-size", Math.max(8, Math.min(12, r / 2.5)))
          .attr("fill", "hsl(var(--foreground))")
          .attr("pointer-events", "none")
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
        const logoUrl = getCustomerLogoUrl(cn.name, 40)
        const logoHtml = logoUrl
          ? `<img src="${logoUrl}" alt="${cn.name}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;border:1px solid rgba(255,255,255,.15);background:#fff;padding:2px;flex-shrink:0" onerror="this.style.display='none'" />`
          : `<div style="width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${cn.name.slice(0,3).toUpperCase()}</div>`
        showTooltip(e, `<div style="display:flex;align-items:center;gap:8px">${logoHtml}<div><strong style="font-size:13px">${cn.name}</strong><br/><span style="font-size:11px;opacity:.7">${cn.count} startup${cn.count > 1 ? "s" : ""}</span></div></div>`)
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
        showTooltip(e, `<strong style="font-size:13px">${sn.name}</strong><br/><span style="font-size:11px;opacity:.7">${sn.investmentList || ""}</span>${sn.headcount ? `<br/><span style="font-size:11px">Headcount: ${sn.headcount}</span>` : ""}`)
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
