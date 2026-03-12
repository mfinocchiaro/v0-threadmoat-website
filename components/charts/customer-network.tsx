"use client"

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"
import { getCustomerLogoUrl, parseKnownCustomers } from "@/lib/customer-logos"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, X } from "lucide-react"

interface NodeDialogData {
  type: "customer" | "startup"
  name: string
  connectedNames: { name: string; detail: string }[]
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
  manufacturingType: string
  subcategories: string
  industriesServed: string[]
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

type GraphNode = CustomerNode | StartupNode
type GraphLink = { source: string; target: string }

// Deterministic color from company name — avoids CSS variable issues in SVG
function nameToColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return `hsl(${h % 360}, 55%, 42%)`
}

export function CustomerNetwork({ data, className }: { data: Company[]; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [minCount, setMinCount] = useState("3")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredQuery = useDeferredValue(searchQuery)
  const [dialogData, setDialogData] = useState<NodeDialogData | null>(null)
  const dialogRef = useRef<(d: NodeDialogData | null) => void>(setDialogData)
  dialogRef.current = setDialogData

  // Refs to live D3 selections — updated each time the effect re-runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startupNodesRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerNodesRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simLinksRef = useRef<any[]>([])
  const [filterInvestment, setFilterInvestment] = useState("all")
  const [filterMfgType, setFilterMfgType] = useState("all")
  const [filterSubsegment, setFilterSubsegment] = useState("all")
  const [filterIndustry, setFilterIndustry] = useState("all")

  // Filter option lists derived from full dataset
  const investmentOptions = useMemo(() => [...new Set(data.map(d => d.investmentList).filter(Boolean))].sort(), [data])
  const mfgTypeOptions = useMemo(() => [...new Set(data.map(d => d.manufacturingType).filter(Boolean))].sort(), [data])
  const subsegmentOptions = useMemo(() => [...new Set(data.map(d => d.subcategories).filter(Boolean))].sort(), [data])
  const industryOptions = useMemo(() => [...new Set(data.flatMap(d => d.industriesServed ?? []).filter(Boolean))].sort(), [data])

  const { nodes, links, customerCount } = useMemo(() => {
    const threshold = parseInt(minCount)
    const customerMap = new Map<string, Set<string>>() // customer → set of startup ids
    const startupCustomers = new Map<string, { company: Company; customers: string[] }>()

    for (const company of data) {
      // Apply filters
      if (filterInvestment !== "all" && company.investmentList !== filterInvestment) continue
      if (filterMfgType !== "all" && company.manufacturingType !== filterMfgType) continue
      if (filterSubsegment !== "all" && company.subcategories !== filterSubsegment) continue
      if (filterIndustry !== "all" && !(company.industriesServed ?? []).includes(filterIndustry)) continue

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
        manufacturingType: company.manufacturingType,
        subcategories: company.subcategories,
        industriesServed: company.industriesServed ?? [],
      })
    }

    return { nodes, links, customerCount: validCustomers.size }
  }, [data, minCount, filterInvestment, filterMfgType, filterSubsegment, filterIndustry])

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
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.55)
      .attr("stroke-width", 1.5)

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
      .attr("fill", d => getCustomerLogoUrl(d.name) ? "#1e293b" : nameToColor(d.name))
      .attr("stroke", d => getCustomerLogoUrl(d.name) ? "#94a3b8" : "#fff")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)

    // Logo images — always render initials text first as fallback, then overlay image.
    // This way even if the image fails to load, something is always visible.
    customerNodes.each(function (d) {
      const node = d3.select(this)
      const r = rScale((d as CustomerNode).count)
      const logoUrl = getCustomerLogoUrl(d.name, Math.round(r * 3))

      // Always: initials label (shown when no logo or logo fails)
      const initials = d.name
        .split(/[\s&,\-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("")
      const textEl = node.append("text")
        .text(initials)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", Math.max(9, Math.min(14, r / 2)))
        .attr("font-weight", "700")
        .attr("fill", "#ffffff")
        .attr("pointer-events", "none")

      if (logoUrl) {
        const imgSize = r * 1.6
        const img = node.append("image")
          .attr("href", logoUrl)
          .attr("x", -imgSize / 2)
          .attr("y", -imgSize / 2)
          .attr("width", imgSize)
          .attr("height", imgSize)
          .attr("clip-path", `url(#clip-${d.id.replace(/[^a-zA-Z0-9]/g, "_")})`)
          .attr("pointer-events", "none")
          .attr("preserveAspectRatio", "xMidYMid meet")

        // If image loads → hide the text initials
        const imgNode = img.node() as SVGImageElement | null
        if (imgNode) {
          imgNode.onload = () => textEl.attr("display", "none")
          imgNode.onerror = () => img.remove()
        }
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

    // Selection state (closure-local, imperative)
    let selectedId: string | null = null

    function applySelection(id: string | null) {
      selectedId = id
      if (id === null) {
        startupNodes.attr("opacity", 1)
        customerNodes.select("circle").attr("stroke-width", 2).attr("opacity", 1)
        link.attr("stroke-opacity", 0.55)
      } else {
        const connected = new Set(
          simLinks
            .filter(l => (l.source as any).id === id || (l.target as any).id === id)
            .map(l => { const s = l.source as any, t = l.target as any; return s.id === id ? t.id : s.id })
        )
        startupNodes.attr("opacity", n => connected.has((n as any).id) ? 1 : 0.08)
        customerNodes.select("circle")
          .attr("stroke-width", n => (n as any).id === id ? 3 : 2)
          .attr("opacity", n => (n as any).id === id ? 1 : 0.2)
        link.attr("stroke-opacity", l =>
          (l.source as any).id === id || (l.target as any).id === id ? 0.85 : 0.04
        )
      }
    }

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
        if (selectedId === null) {
          startupNodes.attr("opacity", 1)
          link.attr("stroke-opacity", 0.55)
        }
      })
      .on("click", (e, d) => {
        e.stopPropagation()
        hideTooltip()
        const cn = d as CustomerNode
        const id = (d as any).id
        applySelection(selectedId === id ? null : id)
        if (selectedId !== null) {
          const node = d as any
          if (node.x !== undefined && node.y !== undefined) {
            const scale = 2.2
            const tx = width / 2 - scale * node.x
            const ty = height / 2 - scale * node.y
            svg.transition().duration(600).call(
              zoom.transform,
              d3.zoomIdentity.translate(tx, ty).scale(scale)
            )
          }
          // Open dialog with connected startups
          const connected = simLinks
            .filter(l => (l.source as any).id === id || (l.target as any).id === id) // eslint-disable-line @typescript-eslint/no-explicit-any
            .map(l => {
              const t = (l.target as any) // eslint-disable-line @typescript-eslint/no-explicit-any
              const targetId = (t.id ?? t) === id ? ((l.source as any).id ?? l.source) : (t.id ?? t) // eslint-disable-line @typescript-eslint/no-explicit-any
              const sNode = simNodes.find(n => n.id === targetId)
              if (!sNode || sNode.type !== "startup") return null
              const sn = sNode as unknown as StartupNode
              return { name: sn.name, detail: sn.investmentList || "" }
            })
            .filter(Boolean) as { name: string; detail: string }[]
          dialogRef.current({
            type: "customer",
            name: cn.name,
            connectedNames: connected.sort((a, b) => a.name.localeCompare(b.name)),
          })
        }
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
        if (selectedId === null) {
          customerNodes.select("circle").attr("opacity", 1)
          link.attr("stroke-opacity", 0.55)
        }
      })
      .on("click", (e, d) => {
        e.stopPropagation()
        hideTooltip()
        const sn = d as StartupNode
        // Find all customers connected to this startup
        const connected = simLinks
          .filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id) // eslint-disable-line @typescript-eslint/no-explicit-any
          .map(l => {
            const s = (l.source as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            const custId = (s.id ?? s) === (d as any).id ? ((l.target as any).id ?? l.target) : (s.id ?? s) // eslint-disable-line @typescript-eslint/no-explicit-any
            const cNode = simNodes.find(n => n.id === custId)
            if (!cNode || cNode.type !== "customer") return null
            return { name: cNode.name, detail: `${(cNode as unknown as CustomerNode).count} startups` }
          })
          .filter(Boolean) as { name: string; detail: string }[]
        dialogRef.current({
          type: "startup",
          name: sn.name,
          connectedNames: connected.sort((a, b) => a.name.localeCompare(b.name)),
        })
      })

    // Click background → clear selection
    svg.on("click", () => {
      applySelection(null)
      hideTooltip()
    })

    // Store live selections for imperative search highlighting
    startupNodesRef.current = startupNodes
    customerNodesRef.current = customerNodes
    linkRef.current = link
    simLinksRef.current = simLinks

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

  // Imperative search highlight — runs on query change OR when nodes change (filter reset)
  useEffect(() => {
    const startupSel = startupNodesRef.current
    const customerSel = customerNodesRef.current
    const linkSel = linkRef.current
    const simLinks = simLinksRef.current
    if (!startupSel || !customerSel || !linkSel) return

    const q = deferredQuery.trim().toLowerCase()

    if (!q) {
      startupSel.attr("opacity", 1).attr("stroke", "#0f172a").attr("stroke-width", 1).attr("r", 5)
      customerSel.select("circle").attr("opacity", 1).attr("stroke-width", 2)
      linkSel.attr("stroke-opacity", 0.55).attr("stroke", "#94a3b8").attr("stroke-width", 1.5)
      return
    }

    // Matching startup IDs
    const matchedIds = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startupSel.each((d: any) => { if (d.name.toLowerCase().includes(q)) matchedIds.add(d.id) })

    // Customer IDs connected to any matching startup
    const connectedCustomerIds = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of simLinks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const srcId = (l.source as any).id ?? l.source
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tgtId = (l.target as any).id ?? l.target
      if (matchedIds.has(tgtId)) connectedCustomerIds.add(srcId)
      if (matchedIds.has(srcId)) connectedCustomerIds.add(tgtId)
    }

    startupSel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("opacity", (d: any) => matchedIds.has(d.id) ? 1 : 0.07)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke", (d: any) => matchedIds.has(d.id) ? "#fbbf24" : "#0f172a")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-width", (d: any) => matchedIds.has(d.id) ? 2.5 : 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("r", (d: any) => matchedIds.has(d.id) ? 7 : 5)

    customerSel.select("circle")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("opacity", (d: any) => connectedCustomerIds.has(d.id) ? 1 : 0.12)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-width", (d: any) => connectedCustomerIds.has(d.id) ? 3 : 2)

    linkSel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-opacity", (l: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = (l.source as any).id ?? l.source
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (l.target as any).id ?? l.target
        return (matchedIds.has(s) || matchedIds.has(t)) ? 0.9 : 0.04
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke", (l: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = (l.source as any).id ?? l.source
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (l.target as any).id ?? l.target
        return (matchedIds.has(s) || matchedIds.has(t)) ? "#fbbf24" : "#94a3b8"
      })
      .attr("stroke-width", 1.5)
  }, [deferredQuery, nodes])

  const searchMatchCount = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return 0
    return nodes.filter(n => n.type === "startup" && (n as StartupNode).name.toLowerCase().includes(q)).length
  }, [deferredQuery, nodes])

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-end gap-3 bg-card/90 backdrop-blur rounded-md border border-border px-3 py-2 max-w-[calc(100%-1.5rem)]">
        {/* Startup search */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Search startup</label>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Find startup…"
              className="h-8 text-xs pl-8 pr-7"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] text-muted-foreground">
              {searchMatchCount} match{searchMatchCount !== 1 ? "es" : ""}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Min. Startups</label>
          <Select value={minCount} onValueChange={setMinCount}>
            <SelectTrigger className="w-[72px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {investmentOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Investment List</label>
            <Select value={filterInvestment} onValueChange={setFilterInvestment}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {investmentOptions.map(v => <SelectItem key={v} value={v}>{v.replace(/^\d+-/, '')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {mfgTypeOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Mfg. Type</label>
            <Select value={filterMfgType} onValueChange={setFilterMfgType}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {mfgTypeOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {subsegmentOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Subsegment</label>
            <Select value={filterSubsegment} onValueChange={setFilterSubsegment}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {subsegmentOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {industryOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Industry</label>
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {industryOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-xs text-muted-foreground pb-1">
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

      <Dialog open={!!dialogData} onOpenChange={open => { if (!open) setDialogData(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogData?.name}</DialogTitle>
            <DialogDescription>
              {dialogData?.type === "customer" && (
                <span>{dialogData.connectedNames.length} startup{dialogData.connectedNames.length !== 1 ? "s" : ""} using this customer</span>
              )}
              {dialogData?.type === "startup" && (
                <span>{dialogData.connectedNames.length} customer{dialogData.connectedNames.length !== 1 ? "s" : ""}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {dialogData && dialogData.connectedNames.length > 0 && (
            <div className="max-h-64 overflow-y-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-2 py-1.5 font-medium">
                      {dialogData.type === "customer" ? "Startup" : "Customer"}
                    </th>
                    <th className="px-2 py-1.5 font-medium">
                      {dialogData.type === "customer" ? "Category" : "Network Size"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dialogData.connectedNames.map((c, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-1.5 font-medium">{c.name}</td>
                      <td className="px-2 py-1.5 text-muted-foreground text-xs">{c.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
