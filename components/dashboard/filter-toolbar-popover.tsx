"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFilter, getOceanType } from "@/contexts/filter-context"
import { useCompanyData } from "@/contexts/company-data-context"
import { getInvestmentColor } from "@/lib/investment-colors"

/* ---- Pill toggle inside popover ---- */

function PillOption({
  label,
  isActive,
  onClick,
  showColorDot,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  showColorDot?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-muted"
      }`}
    >
      {showColorDot && (
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: getInvestmentColor(label) }}
        />
      )}
      {label}
    </button>
  )
}

/* ---- Generic filter dropdown ---- */

interface FilterDropdownProps {
  label: string
  filterKey: string
  options: string[]
  showColorDot?: boolean
}

export function FilterDropdown({ label, filterKey, options, showColorDot }: FilterDropdownProps) {
  const { filters, setFilters } = useFilter()
  const [expanded, setExpanded] = React.useState(false)
  const maxVisible = 20
  const activeValues = (filters[filterKey as keyof typeof filters] as string[]) || []
  const count = activeValues.length

  const toggle = React.useCallback(
    (value: string) => {
      setFilters(prev => {
        const current = (prev[filterKey as keyof typeof prev] as string[]) || []
        const next = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
        return { ...prev, [filterKey]: next }
      })
    },
    [filterKey, setFilters]
  )

  const clearCategory = React.useCallback(() => {
    setFilters(prev => ({ ...prev, [filterKey]: [] }))
  }, [filterKey, setFilters])

  const visible = expanded ? options : options.slice(0, maxVisible)
  const hasMore = options.length > maxVisible

  if (options.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5">
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-[16px] px-1 text-[10px] font-semibold">
              {count}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
            {count > 0 && (
              <button
                onClick={clearCategory}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear ({count})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visible.map(option => (
              <PillOption
                key={option}
                label={option}
                isActive={activeValues.includes(option)}
                onClick={() => toggle(option)}
                showColorDot={showColorDot}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>+{options.length - maxVisible} more <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---- Funding range dropdown ---- */

function formatFundingShort(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v}`
}

export function FundingRangeDropdown({ min, max }: { min: number; max: number }) {
  const { filters, setFilters } = useFilter()
  const isActive = filters.fundingRange[0] !== 0 || filters.fundingRange[1] !== 0
  const effectiveLo = isActive ? filters.fundingRange[0] : min
  const effectiveHi = isActive ? filters.fundingRange[1] : max

  if (max <= 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5">
          Funding
          {isActive && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-[16px] px-1 text-[10px] font-semibold">
              1
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              VC Funding Range
            </span>
            {isActive && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, fundingRange: [0, 0] as [number, number] }))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums w-14 text-right shrink-0">
              {formatFundingShort(effectiveLo)}
            </span>
            <Slider
              min={min}
              max={max}
              step={Math.max(100000, Math.round((max - min) / 100))}
              value={[effectiveLo, effectiveHi]}
              onValueChange={([lo, hi]) =>
                setFilters(prev => ({ ...prev, fundingRange: [lo, hi] as [number, number] }))
              }
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-14 shrink-0">
              {formatFundingShort(effectiveHi)}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---- Ocean Strategy dropdown ---- */

export function OceanStrategyDropdown() {
  const { filters, setFilters } = useFilter()
  const { companies } = useCompanyData()
  const isActive = filters.oceanStrategy !== "all"

  const oceanCounts = React.useMemo(() => {
    let red = 0, blue = 0
    companies.forEach(c => {
      if (getOceanType(c) === "red") red++; else blue++
    })
    return { red, blue, total: companies.length }
  }, [companies])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2.5">
          Ocean
          {isActive && (
            <Badge
              variant="secondary"
              className={`ml-0.5 h-4 min-w-[16px] px-1 text-[10px] font-semibold ${
                filters.oceanStrategy === "red"
                  ? "bg-red-600/20 text-red-400"
                  : "bg-blue-600/20 text-blue-400"
              }`}
            >
              {filters.oceanStrategy === "red" ? "R" : "B"}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Strategic Lens
          </span>
          <div className="flex gap-1.5">
            {([
              { key: "all" as const, label: "All", color: "", count: oceanCounts.total },
              { key: "red" as const, label: "Red Ocean", color: "rgb(220, 38, 38)", count: oceanCounts.red },
              { key: "blue" as const, label: "Blue Ocean", color: "rgb(37, 99, 235)", count: oceanCounts.blue },
            ]).map(({ key, label, color, count }) => {
              const active = filters.oceanStrategy === key
              return (
                <button
                  key={key}
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      oceanStrategy: prev.oceanStrategy === key ? "all" : key,
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                    active
                      ? key === "red"
                        ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/25"
                        : key === "blue"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
                          : "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {key !== "all" && (
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  )}
                  {label}
                  <span className={`text-[10px] font-normal ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
