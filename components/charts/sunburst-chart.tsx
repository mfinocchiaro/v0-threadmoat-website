"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"

interface SunburstChartProps {
  data: Company[]
  className?: string
  preview?: boolean
}

function getIndustrySegment(c: Company) {
  const industries = (c.industriesServed || []).map(i => i.toLowerCase())
  const check = (kws: string[]) => industries.some(i => kws.some(k => i.includes(k)))
  if (check(["discrete", "automotive", "aerospace", "electronics", "machinery", "consumer goods", "semiconductor"])) return "Discrete Manufacturing"
  if (check(["process", "pharma", "chemical", "food", "beverage", "cpg", "oil", "gas", "materials"])) return "Process Industries"
  if (check(["construction", "aec", "building", "infrastructure", "architecture", "real estate"])) return "Construction"
  if (check(["natural resources", "mining", "agriculture", "energy", "utilities", "sustainability"])) return "Natural Resources"
  return "Other"
}

function getMetricBucket(c: Company, metricType: string) {
  if (metricType === "total-funding") {
    const val = c.totalFunding || 0
    if (val === 0) return "Undisclosed"
    if (val < 1_000_000) return "< $1M"
    if (val < 5_000_000) return "$1M - $5M"
    if (val < 10_000_000) return "$5M - $10M"
    if (val < 50_000_000) return "$10M - $50M"
    if (val < 100_000_000) return "$50M - $100M"
    return "> $100M"
  }
  if (metricType === "funding-round") return (c.latestFundingRound || "Unknown").trim() || "Unknown"
  if (metricType === "weighted-score") {
    const s = c.weightedScore || 0
    if (s < 20) return "0 - 20"
    if (s < 40) return "20 - 40"
    if (s < 60) return "40 - 60"
    if (s < 80) return "60 - 80"
    return "80 - 100"
  }
  if (metricType === "country") return c.country || "Unknown"
  return "All"
}

function formatValue(val: number) {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`
  return `$${val}`
}

export function SunburstChart({ data, className, preview = false }: SunburstChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [slicerType, setSlicerType] = useState("investment-list")
  const [secondaryType, setSecondaryType] = useState("funding-round")

  const hierarchyData = useMemo(() => {
    if (!data || data.length === 0) return null
    const root: any = { name: "PLM Ecosystem", children: [] }

    const topGroups = d3.group(data, d =>
      slicerType === "industry-segment" ? getIndustrySegment(d) : d.investmentList || "Other"
    )

    topGroups.forEach((groupData, groupName) => {
      let groupChildren: any[] = []
      const leafLimit = preview ? 5 : Infinity
      if (secondaryType === "none") {
        groupChildren = groupData.slice(0, leafLimit).map(c => {
          const words = c.name.split(/\s+/).filter(Boolean);
          const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : c.name.substring(0, 2).toUpperCase();
          return { name: initials, fullName: c.name, value: Math.max(c.totalFunding || 0, 500_000) };
        })
      } else if (secondaryType === "specific-industry") {
        const subMap = new Map<string, Company[]>()
        groupData.forEach(c => {
          const primary = (c.industriesServed && c.industriesServed[0]) || "General"
          if (!subMap.has(primary)) subMap.set(primary, [])
          subMap.get(primary)!.push(c)
        })
        subMap.forEach((companies, ind) => {
          const limited = companies.slice(0, leafLimit)
          groupChildren.push({
            name: ind,
            children: limited.map(c => {
              const words = c.name.split(/\s+/).filter(Boolean);
              const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : c.name.substring(0, 2).toUpperCase();
              return { name: initials, fullName: c.name, value: Math.max(c.totalFunding || 0, 500_000) };
            }),
          })
        })
      } else {
        const bucketMap = d3.group(groupData, d => getMetricBucket(d, secondaryType))
        bucketMap.forEach((companies, bucketName) => {
          const limited = companies.slice(0, leafLimit)
          groupChildren.push({
            name: bucketName,
            children: limited.map(c => {
              const words = c.name.split(/\s+/).filter(Boolean);
              const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : c.name.substring(0, 2).toUpperCase();
              return { name: initials, fullName: c.name, value: Math.max(c.totalFunding || 0, 500_000) };
            }),
          })
        })
      }
      root.children.push({ name: groupName, children: groupChildren })
    })

    return root
  }, [data, slicerType, secondaryType])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !hierarchyData) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const radius = Math.min(width, height) / 2 - 20

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

    const partition = d3.partition<any>().size([2 * Math.PI, radius])
    const root = d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
    partition(root)

    const arc = d3.arc<d3.HierarchyRectangularNode<any>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1)

    const rootRect = root as d3.HierarchyRectangularNode<any>

    g.selectAll("path")
      .data(rootRect.descendants().filter(d => d.depth))
      .join("path")
      .attr("fill", d => {
        let node = d
        while (node.depth > 1 && node.parent) node = node.parent
        return getInvestmentColor(node.data.name)
      })
      .attr("fill-opacity", d => (d.children ? 0.8 : 0.6))
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 1)
      .attr("d", arc)
      .on("mouseover", function () { d3.select(this).attr("fill-opacity", 1) })
      .on("mouseout", function (event, d) { d3.select(this).attr("fill-opacity", d.children ? 0.8 : 0.6) })
      .append("title")
      .text(d => {
        const path = d.ancestors().map(d => d.data.fullName || d.data.name).reverse().join("/")
        return `${path}\n${d.value ? formatValue(d.value) : ""}`
      })

    g.selectAll("text")
      .data(rootRect.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .join("text")
      .attr("transform", d => {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI
        const y = (d.y0 + d.y1) / 2
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
      })
      .attr("dy", "0.35em")
      .attr("fill", "var(--foreground)")
      .style("font-size", "10px")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .text(d => {
        const name = d.data.name as string
        return d.x1 - d.x0 > 0.05 ? (name.length > 15 ? name.slice(0, 15) + "…" : name) : ""
      })
  }, [hierarchyData])

  const content = (
    <>
      {!preview && (
        <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-card">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Primary Group</label>
            <Select value={slicerType} onValueChange={setSlicerType}>
              <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="investment-list">Investment List</SelectItem>
                <SelectItem value="industry-segment">Industry Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Secondary Group</label>
            <Select value={secondaryType} onValueChange={setSecondaryType}>
              <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="funding-round">Funding Round</SelectItem>
                <SelectItem value="total-funding">Total Funding</SelectItem>
                <SelectItem value="weighted-score">Weighted Score</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="specific-industry">Specific Industry</SelectItem>
                <SelectItem value="none">None (Maximize Leaf)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-background h-full">
        <svg ref={svgRef} className="w-full h-full block" />
        {(!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
    </>
  )

  if (preview) {
    return <div className={`flex flex-col ${className ?? ""}`}>{content}</div>
  }

  return (
    <Card className={`flex flex-col h-[calc(100vh-8rem)] ${className ?? ""}`}>
      {content}
    </Card>
  )
}
