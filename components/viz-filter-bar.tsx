"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useFilter } from "@/contexts/filter-context"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"

interface FilterPopoverProps {
  label: string
  filterKey: string
  items: (string | undefined)[]
  active: string[]
  onToggle: (value: string) => void
  onClear: () => void
  showColorDot?: boolean
}

function FilterPopover({ label, items, active, onToggle, onClear, showColorDot }: FilterPopoverProps) {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          {label}
          {active.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {active.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 max-h-[350px] overflow-y-auto space-y-0.5">
          {items.map(option =>
            option ? (
              <div
                key={option}
                role="button"
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted ${active.includes(option) ? "bg-muted" : ""}`}
                onClick={() => onToggle(option)}
              >
                <div className={`h-4 w-4 shrink-0 border rounded ${active.includes(option) ? "bg-primary border-primary" : "border-input"}`} />
                {showColorDot && (
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: getInvestmentColor(option) }}
                  />
                )}
                <span className="text-sm truncate">{option}</span>
              </div>
            ) : null
          )}
        </div>
        {active.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => onClear()}
            >
              Clear {label}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface VizFilterBarProps {
  companies: Company[]
  className?: string
}

export function VizFilterBar({ companies, className }: VizFilterBarProps) {
  const { filters, setFilters } = useFilter()

  const options = React.useMemo(() => {
    const investmentLists = Array.from(new Set(companies.map(c => c.investmentList).filter(Boolean))).sort()
    const subsegments = Array.from(new Set(companies.map(c => c.subsegment).filter(Boolean))).sort()
    const industries = Array.from(new Set(companies.flatMap(c => c.industriesServed || []).filter(Boolean))).sort()
    const countries = Array.from(new Set(companies.map(c => c.country).filter(Boolean))).sort()
    const lifecycles = Array.from(new Set(companies.map(c => c.lifecyclePhase || c.startupLifecyclePhase).filter(Boolean))).sort()
    const fundingRounds = Array.from(new Set(companies.map(c => c.latestFundingRound).filter(Boolean))).sort()
    // Operating Model: use the fixed canonical order rather than alphabetical
    const OPERATING_MODEL_ORDER = ["cloud-native", "Cloud SaaS", "SaaS", "Enterprise SaaS", "Vertical SaaS", "B2B SaaS", "Cloud", "Hybrid", "Cloud + Edge Hybrid", "On-premise", "Edge Computing", "Edge deployment", "HW plus SW", "Perpetual License"]
    const allOpTags = new Set(companies.flatMap(c => c.operatingModelTags || []).filter(Boolean))
    const operatingModels = OPERATING_MODEL_ORDER.filter(t => allOpTags.has(t))
    return { investmentLists, subsegments, industries, countries, lifecycles, fundingRounds, operatingModels }
  }, [companies])

  const toggle = React.useCallback((type: string, value: string) => {
    setFilters(prev => {
      const current = prev[type as keyof typeof prev] as string[]
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value]
      return { ...prev, [type]: next }
    })
  }, [setFilters])

  const clearFilter = React.useCallback((type: string) => {
    setFilters(prev => ({ ...prev, [type]: [] }))
  }, [setFilters])

  const clearAll = () => {
    setFilters(prev => ({
      ...prev,
      investmentLists: [],
      subsegments: [],
      industries: [],
      countries: [],
      lifecycle: [],
      fundingRound: [],
      operatingModel: [],
      search: "",
    }))
  }

  const activeCount =
    filters.investmentLists.length +
    filters.subsegments.length +
    filters.industries.length +
    filters.countries.length +
    filters.lifecycle.length +
    filters.fundingRound.length +
    filters.operatingModel.length

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover
            label="Investment List" filterKey="investmentLists"
            items={options.investmentLists} active={filters.investmentLists}
            onToggle={(v) => toggle("investmentLists", v)} onClear={() => clearFilter("investmentLists")}
            showColorDot
          />
          <FilterPopover
            label="Subsegment" filterKey="subsegments"
            items={options.subsegments} active={filters.subsegments}
            onToggle={(v) => toggle("subsegments", v)} onClear={() => clearFilter("subsegments")}
          />
          <FilterPopover
            label="Industry" filterKey="industries"
            items={options.industries} active={filters.industries}
            onToggle={(v) => toggle("industries", v)} onClear={() => clearFilter("industries")}
          />
          <FilterPopover
            label="Country" filterKey="countries"
            items={options.countries} active={filters.countries}
            onToggle={(v) => toggle("countries", v)} onClear={() => clearFilter("countries")}
          />
          <FilterPopover
            label="Lifecycle" filterKey="lifecycle"
            items={options.lifecycles} active={filters.lifecycle}
            onToggle={(v) => toggle("lifecycle", v)} onClear={() => clearFilter("lifecycle")}
          />
          <FilterPopover
            label="Funding" filterKey="fundingRound"
            items={options.fundingRounds} active={filters.fundingRound}
            onToggle={(v) => toggle("fundingRound", v)} onClear={() => clearFilter("fundingRound")}
          />
          <FilterPopover
            label="Operating Model" filterKey="operatingModel"
            items={options.operatingModels} active={filters.operatingModel}
            onToggle={(v) => toggle("operatingModel", v)} onClear={() => clearFilter("operatingModel")}
          />
          {activeCount > 0 && (
            <Button variant="ghost" onClick={clearAll} className="h-8 px-2 lg:px-3">
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
