"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface BubbleChartProps {
  data: Company[]
  className?: string
}

const METRICS = {
  totalFunding: { label: "Total Funding", format: formatCurrency },
  weightedScore: { label: "Weighted Score", format: (v: number) => v.toFixed(2) },
  headcount: { label: "Headcount", format: (v: number) => v.toString() },
  estimatedRevenue: { label: "Annual Revenue", format: formatCurrency },
  estimatedMarketValue: { label: "Estimated Value", format: formatCurrency },
  marketOpportunity: { label: "Market Opportunity", format: (v: number) => v.toFixed(1) },
  techDifferentiation: { label: "Tech Differentiation", format: (v: number) => v.toFixed(1) },
  teamExecution: { label: "Team & Execution", format: (v: number) => v.toFixed(1) },
  industryImpact: { label: "Industry Impact", format: (v: number) => v.toFixed(1) },
}

export function BubbleChart({ data, className }: BubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [xAxisMetric, setXAxisMetric] = useState<keyof typeof METRICS>("totalFunding")
  const [yAxisMetric, setYAxisMetric] = useState<keyof typeof METRICS>("weightedScore")
  const [sizeMetric, setSizeMetric] = useState<keyof typeof METRICS>("headcount")

  const validData = useMemo(() => {
    return data.filter(d => (d[xAxisMetric] as number) > 0 && (d[yAxisMetric] as number) > 0)
  }, [data, xAxisMetric, yAxisMetric])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || validData.length === 0) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const margin = { top: 40, right: 40, bottom: 60, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const isXLog = xAxisMetric === "totalFunding" || xAxisMetric === "estimatedMarketValue" || xAxisMetric === "estimatedRevenue"

    const xScale = (isXLog ? d3.scaleLog() : d3.scaleLinear())
      .domain(d3.extent(validData, d => d[xAxisMetric] as number) as [number, number])
      .range([0, innerWidth])
      .nice()

    const yScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d[yAxisMetric] as number) as [number, number])
      .range([innerHeight, 0])
      .nice()

    const sizeScale = d3.scaleSqrt()
      .domain(d3.extent(validData, d => d[sizeMetric] as number) as [number, number])
      .range([4, 40])

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5, isXLog ? "~s" : "n"))
      .attr("color", "hsl(var(--muted-foreground))")

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .attr("color", "hsl(var(--muted-foreground))")

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickFormat(() => ""))
      .attr("color", "hsl(var(--border))")
      .attr("stroke-opacity", 0.1)

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .attr("color", "hsl(var(--border))")
      .attr("stroke-opacity", 0.1)

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .style("font-size", "12px")
      .text(METRICS[xAxisMetric].label)

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .style("font-size", "12px")
      .text(METRICS[yAxisMetric].label)

    const bubbles = g.selectAll(".bubble")
      .data(validData)
      .join("circle")
      .attr("class", "bubble")
      .attr("cx", d => xScale(d[xAxisMetric] as number))
      .attr("cy", d => yScale(d[yAxisMetric] as number))
      .attr("r", d => sizeScale((d[sizeMetric] as number) || 0))
      .attr("fill", d => colorScale(d.investmentList))
      .attr("fill-opacity", 0.7)
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 1)

    bubbles.append("title").text(
      d =>
        `${d.name}\n${METRICS[xAxisMetric].label}: ${METRICS[xAxisMetric].format(d[xAxisMetric] as number)}\n${METRICS[yAxisMetric].label}: ${METRICS[yAxisMetric].format(d[yAxisMetric] as number)}\n${METRICS[sizeMetric].label}: ${METRICS[sizeMetric].format((d[sizeMetric] as number) || 0)}`
    )
  }, [validData, xAxisMetric, yAxisMetric, sizeMetric])

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-card">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">X-Axis</label>
          <Select value={xAxisMetric} onValueChange={v => setXAxisMetric(v as keyof typeof METRICS)}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(METRICS).map(([key, m]) => (
                <SelectItem key={key} value={key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Y-Axis</label>
          <Select value={yAxisMetric} onValueChange={v => setYAxisMetric(v as keyof typeof METRICS)}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(METRICS).map(([key, m]) => (
                <SelectItem key={key} value={key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Bubble Size</label>
          <Select value={sizeMetric} onValueChange={v => setSizeMetric(v as keyof typeof METRICS)}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(METRICS).map(([key, m]) => (
                <SelectItem key={key} value={key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 w-full min-h-0 relative bg-background p-4">
        <svg ref={svgRef} className="w-full h-full block" />
        {validData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No data
          </div>
        )}
      </div>
    </Card>
  )
}
