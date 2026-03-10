"use client"

import React, { useMemo, useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"
import { getCustomerLogoUrl, parseKnownCustomers } from "@/lib/customer-logos"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

import type { ForceGraphProps } from "react-force-graph-3d"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph3D = dynamic(() => import("react-force-graph-3d").then((m: any) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading 3D graph…
    </div>
  ),
}) as React.ComponentType<ForceGraphProps>

interface CustomerNode {
  id: string; type: "customer"; name: string; count: number
}
interface StartupNode {
  id: string; type: "startup"; name: string; investmentList: string
  headcount: number; manufacturingType: string; subcategories: string; industriesServed: string[]
}
type GraphNode = CustomerNode | StartupNode

function nameToColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return `hsl(${h % 360}, 55%, 42%)`
}

export function CustomerNetwork3D({ data, className }: { data: Company[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 })
  const [minCount, setMinCount] = useState("3")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterInvestment, setFilterInvestment] = useState("all")
  const [filterMfgType, setFilterMfgType] = useState("all")
  const [filterSubsegment, setFilterSubsegment] = useState("all")
  const [filterIndustry, setFilterIndustry] = useState("all")

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

  const investmentOptions = useMemo(() => [...new Set(data.map(d => d.investmentList).filter(Boolean))].sort(), [data])
  const mfgTypeOptions = useMemo(() => [...new Set(data.map(d => d.manufacturingType).filter(Boolean))].sort(), [data])
  const subsegmentOptions = useMemo(() => [...new Set(data.map(d => d.subcategories).filter(Boolean))].sort(), [data])
  const industryOptions = useMemo(() => [...new Set(data.flatMap(d => d.industriesServed ?? []).filter(Boolean))].sort(), [data])

  const { graphData, customerCount } = useMemo(() => {
    const threshold = parseInt(minCount)
    const customerMap = new Map<string, Set<string>>()
    const startupCustomers = new Map<string, { company: Company; customers: string[] }>()

    for (const company of data) {
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

    const validCustomers = new Map<string, Set<string>>()
    for (const [cust, startups] of customerMap) {
      if (startups.size >= threshold) validCustomers.set(cust, startups)
    }

    const nodes: GraphNode[] = []
    const links: { source: string; target: string }[] = []
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
        id: `s:${sid}`, type: "startup", name: company.name, investmentList: company.investmentList,
        headcount: company.headcount, manufacturingType: company.manufacturingType,
        subcategories: company.subcategories, industriesServed: company.industriesServed ?? [],
      })
    }

    return { graphData: { nodes, links }, customerCount: validCustomers.size }
  }, [data, minCount, filterInvestment, filterMfgType, filterSubsegment, filterIndustry])

  const maxCount = useMemo(
    () => Math.max(...graphData.nodes.filter(n => n.type === "customer").map(n => (n as CustomerNode).count), 1),
    [graphData]
  )

  const q = searchQuery.trim().toLowerCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeColor = (node: any): string => {
    if (node.type === "customer") {
      return getCustomerLogoUrl(node.name) ? "#1e293b" : nameToColor(node.name)
    }
    if (q && node.name.toLowerCase().includes(q)) return "#fbbf24"
    return getInvestmentColor(node.investmentList)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeVal = (node: any): number => {
    if (node.type === "customer") {
      const count = (node as CustomerNode).count
      return 4 + (count / maxCount) * 20
    }
    return 1
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeLabel = (node: any): string => {
    if (node.type === "customer") {
      const logoUrl = getCustomerLogoUrl(node.name, 48)
      const logoHtml = logoUrl
        ? `<img src="${logoUrl}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;background:#fff;padding:2px;flex-shrink:0" onerror="this.style.display='none'" />`
        : `<div style="width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;color:#fff">${node.name.slice(0, 2).toUpperCase()}</div>`
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.3);border-radius:8px;color:#fff;font-size:12px;white-space:nowrap">${logoHtml}<div><strong>${node.name}</strong><br/><span style="opacity:.65">${node.count} startup${node.count > 1 ? "s" : ""}</span></div></div>`
    }
    return `<div style="padding:5px 10px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.3);border-radius:8px;color:#fff;font-size:12px;white-space:nowrap"><strong>${node.name}</strong>${node.investmentList ? `<br/><span style="opacity:.65">${node.investmentList}</span>` : ""}</div>`
  }

  const searchMatchCount = useMemo(() => {
    if (!q) return 0
    return graphData.nodes.filter(n => n.type === "startup" && (n as StartupNode).name.toLowerCase().includes(q)).length
  }, [q, graphData])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-background", className)}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-end gap-3 bg-card/90 backdrop-blur rounded-md border border-border px-3 py-2 max-w-[calc(100%-1.5rem)]">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Search startup</label>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Find startup…" className="h-8 text-xs pl-8 pr-7" />
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
              {["1","2","3","4","5"].map(v => <SelectItem key={v} value={v}>{v}+</SelectItem>)}
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
                {investmentOptions.map(v => <SelectItem key={v} value={v}>{v.replace(/^\d+-/, "")}</SelectItem>)}
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
          {customerCount} customers · {graphData.nodes.filter(n => n.type === "startup").length} startups
        </div>
      </div>

      {/* 3D graph — ForceGraph3D manages its own canvas */}
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
