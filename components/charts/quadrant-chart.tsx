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

interface QuadrantChartProps {
  data: Company[]
  className?: string
}

type ChartDatum = Company & { _x: number; _y: number; _val: number }

export function QuadrantChart({ data, className }: QuadrantChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [xMetric, setXMetric] = useState("techDifferentiation")
  const [yMetric, setYMetric] = useState("marketOpportunity")
  const [sizeMetric, setSizeMetric] = useState("totalFunding")
  const [spreadMode, setSpreadMode] = useState<"linear" | "percentile">("percentile")
  const [topN, setTopN] = useState("50")

  const chartData = useMemo((): ChartDatum[] => {
    if (!data || data.length === 0) return []

    const getSize = (d: Company) => {
      if (sizeMetric === "totalFunding") return d.totalFunding || 0
      if (sizeMetric === "headcount") return d.headcount || 0
      if (sizeMetric === "weightedScore") return d.weightedScore || 0
      return 0
    }

    let processed = [...data].sort((a, b) => getSize(b) - getSize(a)).slice(0, parseInt(topN))

    if (spreadMode === "percentile") {
      const getVal = (d: Company, m: string) => (d as any)[m] || 0
      const xSorted = [...processed].sort((a, b) => getVal(a, xMetric) - getVal(b, xMetric))
      const ySorted = [...processed].sort((a, b) => getVal(a, yMetric) - getVal(b, yMetric))
      return processed.map(d => ({ ...d, _x: xSorted.indexOf(d), _y: ySorted.indexOf(d), _val: getSize(d) }))
    }
    return processed.map(d => ({ ...d, _x: (d as any)[xMetric] || 0, _y: (d as any)[yMetric] || 0, _val: getSize(d) }))
  }, [data, xMetric, yMetric, sizeMetric, spreadMode, topN])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const margin = { top: 40, right: 40, bottom: 40, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .extent([[0, 0], [width, height]])
      .on("zoom", event => g.attr("transform", event.transform))

    svg.call(zoom)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    let xScale: d3.ScaleLinear<number, number>
    let yScale: d3.ScaleLinear<number, number>

    if (spreadMode === "percentile") {
      xScale = d3.scaleLinear().domain([0, chartData.length - 1]).range([0, innerWidth])
      yScale = d3.scaleLinear().domain([0, chartData.length - 1]).range([innerHeight, 0])
    } else {
      const xExtent = d3.extent(chartData, d => d._x) as [number, number]
      const yExtent = d3.extent(chartData, d => d._y) as [number, number]
      const xPad = (xExtent[1] - xExtent[0]) * 0.1 || 1
      const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 1
      xScale = d3.scaleLinear().domain([xExtent[0] - xPad, xExtent[1] + xPad]).range([0, innerWidth])
      yScale = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([innerHeight, 0])
    }

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(chartData, d => d._val) || 1])
      .range([5, 30])

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    const midX = innerWidth / 2
    const midY = innerHeight / 2

    const quadrants = [
      { label: "VISIONARIES", x: innerWidth * 0.25, y: innerHeight * 0.25 },
      { label: "LEADERS", x: innerWidth * 0.75, y: innerHeight * 0.25 },
      { label: "NICHE PLAYERS", x: innerWidth * 0.25, y: innerHeight * 0.75 },
      { label: "CHALLENGERS", x: innerWidth * 0.75, y: innerHeight * 0.75 },
    ]

    g.selectAll(".quad-label")
      .data(quadrants)
      .join("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.label)
      .attr("font-size", "40px")
      .attr("font-weight", 900)
      .attr("fill", "var(--muted-foreground)")
      .attr("opacity", 0.1)
      .style("pointer-events", "none")

    g.append("line").attr("x1", midX).attr("y1", 0).attr("x2", midX).attr("y2", innerHeight)
      .attr("stroke", "var(--border)").attr("stroke-width", 2).attr("stroke-dasharray", "4,4")
    g.append("line").attr("x1", 0).attr("y1", midY).attr("x2", innerWidth).attr("y2", midY)
      .attr("stroke", "var(--border)").attr("stroke-width", 2).attr("stroke-dasharray", "4,4")
    g.append("rect").attr("width", innerWidth).attr("height", innerHeight)
      .attr("fill", "none").attr("stroke", "var(--border)")

    const nodes = g.selectAll(".node")
      .data(chartData)
      .join("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${xScale(d._x)},${yScale(d._y)})`)

    nodes.append("circle")
      .attr("r", d => radiusScale(d._val))
      .attr("fill", d => colorScale(d.investmentList || "Other"))
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function () { d3.select(this).attr("stroke", "var(--primary)").attr("stroke-width", 3).attr("fill-opacity", 1) })
      .on("mouseout", function () { d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5).attr("fill-opacity", 0.7) })

    nodes.append("text")
      .text(d => d.name)
      .attr("dy", d => radiusScale(d._val) + 12)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--foreground)")
      .style("pointer-events", "none")

    nodes.append("title").text(d => `${d.name}\nX: ${d._x.toFixed(1)}\nY: ${d._y.toFixed(1)}`)
  }, [chartData, spreadMode])

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
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">X Axis</label>
            <Select value={xMetric} onValueChange={setXMetric}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="techDifferentiation">Tech Diff</SelectItem>
                <SelectItem value="marketOpportunity">Market Opp</SelectItem>
                <SelectItem value="teamExecution">Execution</SelectItem>
                <SelectItem value="totalFunding">Total Funding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Y Axis</label>
            <Select value={yMetric} onValueChange={setYMetric}>
              <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marketOpportunity">Market Opp</SelectItem>
                <SelectItem value="techDifferentiation">Tech Diff</SelectItem>
                <SelectItem value="teamExecution">Execution</SelectItem>
                <SelectItem value="weightedScore">Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Size By</label>
            <Select value={sizeMetric} onValueChange={setSizeMetric}>
              <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="totalFunding">Total Funding</SelectItem>
                <SelectItem value="headcount">Headcount</SelectItem>
                <SelectItem value="weightedScore">Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Normalize</label>
            <Select value={spreadMode} onValueChange={v => setSpreadMode(v as "linear" | "percentile")}>
              <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="percentile">Spread (Rank)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Top N</label>
            <Select value={topN} onValueChange={setTopN}>
              <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Top 15</SelectItem>
                <SelectItem value="25">Top 25</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">Top 100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetZoom} className="h-8">
          <RotateCcw className="mr-2 h-3 w-3" />
          Reset
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative overflow-hidden bg-background">
        <svg ref={svgRef} className="w-full h-full block" />
        {(!data || data.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No Data
          </div>
        )}
      </div>
    </Card>
  )
}
