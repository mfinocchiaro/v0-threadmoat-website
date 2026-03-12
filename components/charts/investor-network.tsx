"use client"

import { useEffect, useRef, useState, useMemo, useDeferredValue } from "react"
import * as d3 from "d3"
import { getInvestmentColor } from "@/lib/investment-colors"
import { getInvestorLogoUrl } from "@/lib/investor-logos"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, X } from "lucide-react"

interface NodeDialogData {
  type: "investor" | "startup"
  name: string
  investorType?: string
  investmentList?: string
  hq?: string
  description?: string
  connectedNames: { name: string; investmentList: string }[]
}

interface InvestorRecord {
  id: string
  name: string
  startupNames: string[]
  startupCount: number
  investmentLists: string[]
  investorType: string
  hq: string
  description: string
}

interface InvestorNode {
  id: string
  type: "investor"
  name: string
  count: number
  investorType: string
  x?: number; y?: number; fx?: number | null; fy?: number | null
}

interface StartupNode {
  id: string
  type: "startup"
  name: string
  investmentList: string
  x?: number; y?: number; fx?: number | null; fy?: number | null
}

type GraphNode = InvestorNode | StartupNode
type GraphLink = { source: string; target: string }

function nameToColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return `hsl(${h % 360}, 55%, 42%)`
}

function investorTypeColor(type: string): string {
  if (type === "Institutional Investors") return "#3b82f6"
  if (type === "VC Fund") return "#10b981"
  if (type === "Individual") return "#8b5cf6"
  return "#64748b"
}

const SKIP_MIN = 2 // investors with only 1 startup are too noisy

export function InvestorNetwork({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [investors, setInvestors] = useState<InvestorRecord[]>([])
  const [startupListMap, setStartupListMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [minCount, setMinCount] = useState("3")
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const deferredQuery = useDeferredValue(searchQuery)
  const [dialogData, setDialogData] = useState<NodeDialogData | null>(null)
  const dialogRef = useRef<(d: NodeDialogData | null) => void>(setDialogData)
  dialogRef.current = setDialogData

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startupNodesRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investorNodesRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simLinksRef = useRef<any[]>([])

  useEffect(() => {
    fetch("/api/investors")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setInvestors(json.data)
          if (json.startupInvestmentMap) setStartupListMap(json.startupInvestmentMap)
        } else setError("Failed to load investor data")
      })
      .catch(() => setError("Failed to load investor data"))
      .finally(() => setLoading(false))
  }, [])

  const investorTypeOptions = useMemo(() =>
    [...new Set(investors.map(d => d.investorType).filter(Boolean))].sort(), [investors])

  const { nodes, links, investorCount } = useMemo(() => {
    const threshold = parseInt(minCount)

    // Filter investors
    const filtered = investors.filter(inv => {
      if (inv.name.toLowerCase() === "undisclosed or unknown") return false
      if (filterType !== "all" && inv.investorType !== filterType) return false
      if (inv.startupCount < threshold) return false
      return true
    })

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    const startupMap = new Map<string, { name: string; investmentList: string }>()

    for (const inv of filtered) {
      nodes.push({
        id: `i:${inv.id}`,
        type: "investor",
        name: inv.name,
        count: inv.startupCount,
        investorType: inv.investorType,
      })

      inv.startupNames.forEach((sName) => {
        const trimmed = sName.trim()
        const sid = `s:${trimmed.toLowerCase().replace(/\s+/g, "-")}`
        const investmentList = startupListMap[trimmed] || ""

        if (!startupMap.has(sid)) {
          startupMap.set(sid, { name: trimmed, investmentList })
        }
        links.push({ source: `i:${inv.id}`, target: sid })
      })
    }

    // Add startup nodes that appear in at least one link
    const linkedStartups = new Set(links.map(l => l.target))
    for (const [sid, { name, investmentList }] of startupMap) {
      if (!linkedStartups.has(sid)) continue
      nodes.push({ id: sid, type: "startup", name, investmentList })
    }

    return { nodes, links, investorCount: filtered.length }
  }, [investors, minCount, filterType, startupListMap])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const container = svgRef.current.parentElement!
    const width = container.clientWidth
    const height = container.clientHeight

    svg.selectAll("*").remove()
    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const g = svg.append("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (e) => g.attr("transform", e.transform))
    svg.call(zoom)

    const maxCount = d3.max(nodes.filter(n => n.type === "investor"), n => (n as InvestorNode).count) || 1
    const rScale = d3.scaleSqrt().domain([1, maxCount]).range([12, 42])

    const simNodes = nodes.map(n => ({ ...n }))
    const simLinks = links.map(l => ({ ...l }))

    const simulation = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(simLinks as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
        .id((d: any) => d.id) // eslint-disable-line @typescript-eslint/no-explicit-any
        .distance(90))
      .force("charge", d3.forceManyBody().strength((d: any) => d.type === "investor" ? -300 : -50)) // eslint-disable-line @typescript-eslint/no-explicit-any
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide((d: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
        d.type === "investor" ? rScale(d.count) + 8 : 10
      ))

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1)

    // Investor nodes
    const investorNodes = g.append("g")
      .selectAll("g")
      .data(simNodes.filter(n => n.type === "investor"))
      .join("g")
      .attr("cursor", "pointer")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Clip paths for logo masking
    investorNodes.append("clipPath")
      .attr("id", d => `inv-clip-${d.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
      .append("circle")
      .attr("r", d => rScale((d as unknown as InvestorNode).count) - 2)

    investorNodes.append("circle")
      .attr("r", d => rScale((d as unknown as InvestorNode).count))
      .attr("fill", d => getInvestorLogoUrl(d.name) ? "#1e293b" : investorTypeColor((d as unknown as InvestorNode).investorType))
      .attr("stroke", d => getInvestorLogoUrl(d.name) ? "#94a3b8" : "#1e293b")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.92)

    // Initials + logo (same pattern as customer-network)
    investorNodes.each(function(d) {
      const node = d3.select(this)
      const inv = d as unknown as InvestorNode
      const r = rScale(inv.count)
      const logoUrl = getInvestorLogoUrl(inv.name, Math.round(r * 3))

      const initials = inv.name
        .split(/[\s&,\-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("")

      const textEl = node.append("text")
        .text(initials)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", Math.max(8, Math.min(13, r / 2.2)))
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
          .attr("clip-path", `url(#inv-clip-${d.id.replace(/[^a-zA-Z0-9]/g, "_")})`)
          .attr("pointer-events", "none")
          .attr("preserveAspectRatio", "xMidYMid meet")

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
      .attr("r", 4.5)
      .attr("fill", d => getInvestmentColor((d as unknown as StartupNode).investmentList))
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    let selectedId: string | null = null

    function applySelection(id: string | null) {
      selectedId = id
      if (id === null) {
        startupNodes.attr("opacity", 1)
        investorNodes.select("circle").attr("stroke-width", 2).attr("opacity", 1)
        link.attr("stroke-opacity", 0.45)
      } else {
        const connected = new Set(
          simLinks
            .filter(l => (l.source as any).id === id || (l.target as any).id === id) // eslint-disable-line @typescript-eslint/no-explicit-any
            .map(l => { const s = l.source as any, t = l.target as any; return s.id === id ? t.id : s.id }) // eslint-disable-line @typescript-eslint/no-explicit-any
        )
        startupNodes.attr("opacity", n => connected.has((n as any).id) ? 1 : 0.07) // eslint-disable-line @typescript-eslint/no-explicit-any
        investorNodes.select("circle")
          .attr("stroke-width", n => (n as any).id === id ? 3 : 2) // eslint-disable-line @typescript-eslint/no-explicit-any
          .attr("opacity", n => (n as any).id === id ? 1 : 0.18) // eslint-disable-line @typescript-eslint/no-explicit-any
        link.attr("stroke-opacity", l =>
          (l.source as any).id === id || (l.target as any).id === id ? 0.8 : 0.03 // eslint-disable-line @typescript-eslint/no-explicit-any
        )
      }
    }

    const tooltip = d3.select(tooltipRef.current)
    function showTooltip(e: MouseEvent, html: string) {
      tooltip.html(html).style("left", `${e.pageX + 12}px`).style("top", `${e.pageY - 28}px`).style("opacity", "1")
    }
    function hideTooltip() { tooltip.style("opacity", "0") }

    investorNodes
      .on("mouseover", (e, d) => {
        const inv = d as unknown as InvestorNode
        const logoUrl = getInvestorLogoUrl(inv.name, 40)
        const logoHtml = logoUrl
          ? `<img src="${logoUrl}" alt="${inv.name}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;border:1px solid rgba(255,255,255,.15);background:#fff;padding:2px;flex-shrink:0" onerror="this.style.display='none'" />`
          : `<div style="width:28px;height:28px;border-radius:50%;background:${investorTypeColor(inv.investorType)};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${inv.name.split(/[\s&]+/).map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("")}</div>`
        showTooltip(e, `<div style="display:flex;align-items:center;gap:8px">${logoHtml}<div><strong style="font-size:13px">${inv.name}</strong><br/><span style="font-size:11px;opacity:.7">${inv.count} startup${inv.count > 1 ? "s" : ""} · ${inv.investorType || "Unknown"}</span></div></div>`)
        const connected = new Set(simLinks.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id).map(l => { const s = l.source as any, t = l.target as any; return s.id === d.id ? t.id : s.id })) // eslint-disable-line @typescript-eslint/no-explicit-any
        startupNodes.attr("opacity", n => connected.has((n as any).id) ? 1 : 0.08) // eslint-disable-line @typescript-eslint/no-explicit-any
        link.attr("stroke-opacity", l => (l.source as any).id === d.id || (l.target as any).id === d.id ? 0.6 : 0.04) // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      .on("mouseout", () => { hideTooltip(); if (selectedId === null) { startupNodes.attr("opacity", 1); link.attr("stroke-opacity", 0.45) } })
      .on("click", (e, d) => {
        e.stopPropagation()
        hideTooltip()
        const inv = d as unknown as InvestorNode
        const id = (d as any).id // eslint-disable-line @typescript-eslint/no-explicit-any
        applySelection(selectedId === id ? null : id)
        if (selectedId !== null) {
          const node = d as any // eslint-disable-line @typescript-eslint/no-explicit-any
          if (node.x !== undefined) {
            const scale = 2.2
            const tx = width / 2 - scale * node.x
            const ty = height / 2 - scale * node.y
            svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
          }
          // Open dialog with connected startups
          const connected = simLinks
            .filter(l => (l.source as any).id === id || (l.target as any).id === id) // eslint-disable-line @typescript-eslint/no-explicit-any
            .map(l => {
              const t = (l.target as any) // eslint-disable-line @typescript-eslint/no-explicit-any
              const sNode = simNodes.find(n => n.id === (t.id ?? t))
              if (!sNode || sNode.type !== "startup") return null
              return { name: sNode.name, investmentList: (sNode as any).investmentList || "" }
            })
            .filter(Boolean) as { name: string; investmentList: string }[]
          // Look up full investor record for hq/description
          const invRecord = investors.find(r => r.name === inv.name)
          dialogRef.current({
            type: "investor",
            name: inv.name,
            investorType: inv.investorType,
            hq: invRecord?.hq || "",
            description: invRecord?.description || "",
            connectedNames: connected.sort((a, b) => a.name.localeCompare(b.name)),
          })
        }
      })

    startupNodes
      .on("mouseover", (e, d) => {
        const sn = d as unknown as StartupNode
        showTooltip(e, `<strong style="font-size:13px">${sn.name}</strong>${sn.investmentList ? `<br/><span style="font-size:11px;opacity:.7">${sn.investmentList}</span>` : ""}`)
        const connected = new Set(simLinks.filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id).map(l => { const s = l.source as any, t = l.target as any; return s.id === d.id ? t.id : s.id })) // eslint-disable-line @typescript-eslint/no-explicit-any
        investorNodes.select("circle").attr("opacity", n => connected.has((n as any).id) ? 1 : 0.08) // eslint-disable-line @typescript-eslint/no-explicit-any
        link.attr("stroke-opacity", l => (l.source as any).id === d.id || (l.target as any).id === d.id ? 0.6 : 0.04) // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      .on("mouseout", () => { hideTooltip(); if (selectedId === null) { investorNodes.select("circle").attr("opacity", 1); link.attr("stroke-opacity", 0.45) } })
      .on("click", (e, d) => {
        e.stopPropagation()
        hideTooltip()
        const sn = d as unknown as StartupNode
        // Find all investors connected to this startup
        const connected = simLinks
          .filter(l => (l.source as any).id === d.id || (l.target as any).id === d.id) // eslint-disable-line @typescript-eslint/no-explicit-any
          .map(l => {
            const s = (l.source as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            const investorId = s.id === (d as any).id ? (l.target as any).id : s.id // eslint-disable-line @typescript-eslint/no-explicit-any
            const iNode = simNodes.find(n => n.id === investorId)
            if (!iNode || iNode.type !== "investor") return null
            return { name: iNode.name, investmentList: (iNode as any).investorType || "" }
          })
          .filter(Boolean) as { name: string; investmentList: string }[]
        dialogRef.current({
          type: "startup",
          name: sn.name,
          investmentList: sn.investmentList,
          connectedNames: connected.sort((a, b) => a.name.localeCompare(b.name)),
        })
      })

    svg.on("click", () => { applySelection(null); hideTooltip() })

    startupNodesRef.current = startupNodes
    investorNodesRef.current = investorNodes
    linkRef.current = link
    simLinksRef.current = simLinks

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x) // eslint-disable-line @typescript-eslint/no-explicit-any
        .attr("y1", d => (d.source as any).y) // eslint-disable-line @typescript-eslint/no-explicit-any
        .attr("x2", d => (d.target as any).x) // eslint-disable-line @typescript-eslint/no-explicit-any
        .attr("y2", d => (d.target as any).y) // eslint-disable-line @typescript-eslint/no-explicit-any
      investorNodes.attr("transform", d => `translate(${d.x},${d.y})`)
      startupNodes.attr("cx", d => d.x!).attr("cy", d => d.y!)
    })

    simulation.on("end", () => {
      const xs = simNodes.map(n => n.x!)
      const ys = simNodes.map(n => n.y!)
      const [x0, x1] = [d3.min(xs)! - 50, d3.max(xs)! + 50]
      const [y0, y1] = [d3.min(ys)! - 50, d3.max(ys)! + 50]
      const scale = Math.min(width / (x1 - x0), height / (y1 - y0), 1.5)
      const tx = (width - scale * (x0 + x1)) / 2
      const ty = (height - scale * (y0 + y1)) / 2
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
    })

    return () => { simulation.stop() }
  }, [nodes, links])

  // Search highlighting
  useEffect(() => {
    const startupSel = startupNodesRef.current
    const investorSel = investorNodesRef.current
    const linkSel = linkRef.current
    const sl = simLinksRef.current
    if (!startupSel || !investorSel || !linkSel) return

    const q = deferredQuery.trim().toLowerCase()
    if (!q) {
      startupSel.attr("opacity", 1).attr("stroke", "hsl(var(--background))").attr("stroke-width", 1).attr("r", 4.5)
      investorSel.select("circle").attr("opacity", 1).attr("stroke-width", 2)
      linkSel.attr("stroke-opacity", 0.45).attr("stroke", "#94a3b8")
      return
    }

    const matchedIds = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startupSel.each((d: any) => { if (d.name.toLowerCase().includes(q)) matchedIds.add(d.id) })
    const connectedInvestorIds = new Set<string>()
    for (const l of sl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const srcId = (l.source as any).id ?? l.source
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tgtId = (l.target as any).id ?? l.target
      if (matchedIds.has(tgtId)) connectedInvestorIds.add(srcId)
      if (matchedIds.has(srcId)) connectedInvestorIds.add(tgtId)
    }

    // Also match investors by name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedInvestorIds = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    investorSel.each((d: any) => { if (d.name.toLowerCase().includes(q)) matchedInvestorIds.add(d.id) })

    startupSel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("opacity", (d: any) => matchedIds.has(d.id) ? 1 : 0.07)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke", (d: any) => matchedIds.has(d.id) ? "#fbbf24" : "hsl(var(--background))")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-width", (d: any) => matchedIds.has(d.id) ? 2.5 : 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("r", (d: any) => matchedIds.has(d.id) ? 6.5 : 4.5)

    investorSel.select("circle")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("opacity", (d: any) => (connectedInvestorIds.has(d.id) || matchedInvestorIds.has(d.id)) ? 1 : 0.12)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-width", (d: any) => matchedInvestorIds.has(d.id) ? 3 : 2)

    linkSel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke-opacity", (l: any) => {
        const s = (l.source as any).id ?? l.source // eslint-disable-line @typescript-eslint/no-explicit-any
        const t = (l.target as any).id ?? l.target // eslint-disable-line @typescript-eslint/no-explicit-any
        return (matchedIds.has(s) || matchedIds.has(t) || matchedInvestorIds.has(s)) ? 0.9 : 0.03
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("stroke", (l: any) => {
        const s = (l.source as any).id ?? l.source // eslint-disable-line @typescript-eslint/no-explicit-any
        const t = (l.target as any).id ?? l.target // eslint-disable-line @typescript-eslint/no-explicit-any
        return (matchedIds.has(s) || matchedIds.has(t) || matchedInvestorIds.has(s)) ? "#fbbf24" : "#94a3b8"
      })
  }, [deferredQuery, nodes])

  const searchMatchCount = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return 0
    return nodes.filter(n => n.type === "startup" && (n as StartupNode).name.toLowerCase().includes(q)).length
      + nodes.filter(n => n.type === "investor" && (n as InvestorNode).name.toLowerCase().includes(q)).length
  }, [deferredQuery, nodes])

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading investor data…</div>
  if (error) return <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-end gap-3 bg-card/90 backdrop-blur rounded-md border border-border px-3 py-2 max-w-[calc(100%-1.5rem)]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Investor or startup…" className="h-8 text-xs pl-8 pr-7" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchQuery && <p className="text-[10px] text-muted-foreground">{searchMatchCount} match{searchMatchCount !== 1 ? "es" : ""}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Min. Startups</label>
          <Select value={minCount} onValueChange={setMinCount}>
            <SelectTrigger className="w-[72px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2","3","4","5","8","10"].map(v => <SelectItem key={v} value={v}>{v}+</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {investorTypeOptions.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Investor Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {investorTypeOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 pb-1">
          {[
            { label: "VC Fund", color: "#10b981" },
            { label: "Institutional", color: "#3b82f6" },
            { label: "Individual", color: "#8b5cf6" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground pb-1">
          {investorCount} investors · {nodes.filter(n => n.type === "startup").length} startups
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full" />

      <div
        ref={tooltipRef}
        className="fixed z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md opacity-0 transition-opacity"
        style={{ pointerEvents: "none" }}
      />

      <Dialog open={!!dialogData} onOpenChange={open => { if (!open) setDialogData(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogData?.type === "investor" && dialogData.name}
              {dialogData?.type === "startup" && dialogData.name}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {dialogData?.type === "investor" && (
                  <>
                    <span>{dialogData.investorType || "Investor"} · {dialogData.connectedNames.length} startup{dialogData.connectedNames.length !== 1 ? "s" : ""} funded</span>
                    {dialogData.hq && (
                      <span className="block mt-0.5 text-xs">{dialogData.hq}</span>
                    )}
                    {dialogData.description && (
                      <span className="block mt-0.5 text-xs text-muted-foreground italic">{dialogData.description}</span>
                    )}
                  </>
                )}
                {dialogData?.type === "startup" && (
                  <span>{dialogData.investmentList || "Startup"} · {dialogData.connectedNames.length} investor{dialogData.connectedNames.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          {dialogData && dialogData.connectedNames.length > 0 && (
            <div className="max-h-64 overflow-y-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-2 py-1.5 font-medium">
                      {dialogData.type === "investor" ? "Startup" : "Investor"}
                    </th>
                    <th className="px-2 py-1.5 font-medium">
                      {dialogData.type === "investor" ? "Investment List" : "Type"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dialogData.connectedNames.map((c, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-1.5 font-medium">{c.name}</td>
                      <td className="px-2 py-1.5 text-muted-foreground text-xs">{c.investmentList}</td>
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
