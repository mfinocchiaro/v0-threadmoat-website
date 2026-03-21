"use client"

import React, { useMemo, useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import type { ForceGraphProps } from "react-force-graph-3d"
import { getInvestmentColor } from "@/lib/investment-colors"
import { getInvestorLogoUrl } from "@/lib/investor-logos"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph3D = dynamic(() => import("react-force-graph-3d").then((m: any) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading 3D graph…
    </div>
  ),
}) as React.ComponentType<ForceGraphProps>

interface InvestorRecord {
  id: string
  name: string
  startupNames: string[]
  startupCount: number
  investmentLists: string[]
  investorType: string
}

interface InvestorNode {
  id: string; type: "investor"; name: string; count: number; investorType: string
}
interface StartupNode {
  id: string; type: "startup"; name: string; investmentList: string
}
type GraphNode = InvestorNode | StartupNode

function investorTypeColor(type: string): string {
  if (type === "Institutional Investors") return "#3b82f6"
  if (type === "VC Fund") return "#10b981"
  if (type === "Individual") return "#8b5cf6"
  return "#64748b"
}

export function InvestorNetwork3D({ className, filteredCompanyNames }: { className?: string; filteredCompanyNames?: Set<string> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 })

  const [investors, setInvestors] = useState<InvestorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [minCount, setMinCount] = useState("3")
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return
      setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    })
    ro.observe(containerRef.current)
    setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
    return () => ro.disconnect()
  }, [])

  const [startupListMap, setStartupListMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/investors")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setInvestors(json.data)
          if (json.startupInvestmentMap) setStartupListMap(json.startupInvestmentMap)
        } else setError("Failed to load")
      })
      .catch(() => setError("Failed to load investor data"))
      .finally(() => setLoading(false))
  }, [])

  const investorTypeOptions = useMemo(() =>
    [...new Set(investors.map(d => d.investorType).filter(Boolean))].sort(), [investors])

  const { graphData, investorCount } = useMemo(() => {
    const threshold = parseInt(minCount)
    const hasGlobalFilter = filteredCompanyNames && filteredCompanyNames.size > 0

    const filtered = investors.filter(inv => {
      if (inv.name.toLowerCase() === "undisclosed or unknown") return false
      if (filterType !== "all" && inv.investorType !== filterType) return false
      if (inv.startupCount < threshold) return false
      return true
    })

    const nodes: GraphNode[] = []
    const links: { source: string; target: string }[] = []
    const startupMap = new Map<string, { name: string; investmentList: string }>()

    for (const inv of filtered) {
      const investorId = `i:${inv.id}`
      let hasVisibleStartup = false

      inv.startupNames.forEach((sName) => {
        const trimmed = sName.trim()
        if (hasGlobalFilter && !filteredCompanyNames!.has(trimmed)) return

        const sid = `s:${trimmed.toLowerCase().replace(/\s+/g, "-")}`
        if (!startupMap.has(sid)) startupMap.set(sid, { name: trimmed, investmentList: startupListMap[trimmed] || "" })
        links.push({ source: investorId, target: sid })
        hasVisibleStartup = true
      })

      if (!hasGlobalFilter || hasVisibleStartup) {
        nodes.push({
          id: investorId,
          type: "investor",
          name: inv.name,
          count: hasGlobalFilter
            ? inv.startupNames.filter(s => filteredCompanyNames!.has(s.trim())).length
            : inv.startupCount,
          investorType: inv.investorType,
        })
      }
    }

    const linkedStartups = new Set(links.map(l => l.target))
    for (const [sid, { name, investmentList }] of startupMap) {
      if (!linkedStartups.has(sid)) continue
      nodes.push({ id: sid, type: "startup", name, investmentList })
    }

    return { graphData: { nodes, links }, investorCount: nodes.filter(n => n.type === "investor").length }
  }, [investors, minCount, filterType, startupListMap, filteredCompanyNames])

  const maxCount = useMemo(
    () => Math.max(...graphData.nodes.filter(n => n.type === "investor").map(n => (n as InvestorNode).count), 1),
    [graphData]
  )

  const q = searchQuery.trim().toLowerCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeColor = (node: any): string => {
    if (node.type === "investor") {
      return getInvestorLogoUrl(node.name) ? "#1e293b" : investorTypeColor(node.investorType)
    }
    if (q && node.name.toLowerCase().includes(q)) return "#fbbf24"
    return getInvestmentColor(node.investmentList)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeVal = (node: any): number => {
    if (node.type === "investor") {
      const count = (node as InvestorNode).count
      return 4 + (count / maxCount) * 20
    }
    return 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeLabel = (node: any): string => {
    if (node.type === "investor") {
      const logoUrl = getInvestorLogoUrl(node.name, 48)
      const logoHtml = logoUrl
        ? `<img src="${logoUrl}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;background:#fff;padding:2px;flex-shrink:0" onerror="this.style.display='none'" />`
        : `<div style="width:28px;height:28px;border-radius:50%;background:${investorTypeColor(node.investorType)};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;color:#fff">${node.name.slice(0, 2).toUpperCase()}</div>`
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.3);border-radius:8px;color:#fff;font-size:12px;white-space:nowrap">${logoHtml}<div><strong>${node.name}</strong><br/><span style="opacity:.65">${node.count} startup${node.count > 1 ? "s" : ""} · ${node.investorType || "Unknown"}</span></div></div>`
    }
    return `<div style="padding:5px 10px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.3);border-radius:8px;color:#fff;font-size:12px;white-space:nowrap"><strong>${node.name}</strong>${node.investmentList ? `<br/><span style="opacity:.65">${node.investmentList}</span>` : ""}</div>`
  }

  const searchMatchCount = useMemo(() => {
    if (!q) return 0
    return graphData.nodes.filter(n =>
      n.name.toLowerCase().includes(q)
    ).length
  }, [q, graphData])

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading investor data…</div>
  if (error) return <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-background", className)}>
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
              {["1","2","3","5","10"].map(v => <SelectItem key={v} value={v}>{v}+</SelectItem>)}
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

        <div className="text-xs text-muted-foreground pb-1">
          {investorCount} investors · {graphData.nodes.filter(n => n.type === "startup").length} startups
        </div>
      </div>

      <ForceGraph3D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeLabel={nodeLabel}
        nodeOpacity={0.92}
        linkColor={() => "#94a3b8"}
        linkOpacity={0.25}
        linkWidth={1}
      />
    </div>
  )
}
