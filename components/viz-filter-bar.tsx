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
    return { investmentLists, subsegments, industries, countries, lifecycles, fundingRounds }
  }, [companies])

  const toggle = (type: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[]
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value]
      return { ...prev, [type]: next }
    })
  }

  const clearAll = () => {
    setFilters(prev => ({
      ...prev,
      investmentLists: [],
      subsegments: [],
      industries: [],
      countries: [],
      lifecycle: [],
      fundingRound: [],
      search: "",
    }))
  }

  const activeCount =
    filters.investmentLists.length +
    filters.subsegments.length +
    filters.industries.length +
    filters.countries.length +
    filters.lifecycle.length +
    filters.fundingRound.length

  const FilterPopover = ({
    label,
    filterKey,
    items,
  }: {
    label: string
    filterKey: keyof typeof filters
    items: (string | undefined)[]
  }) => {
    const active = filters[filterKey] as string[]
    return (
      <Popover>
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
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-2 max-h-[300px] overflow-y-auto space-y-1">
            {items.map(option =>
              option ? (
                <div
                  key={option}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${active.includes(option) ? "bg-muted" : ""}`}
                  onClick={() => toggle(filterKey, option)}
                >
                  <div className={`h-4 w-4 border rounded ${active.includes(option) ? "bg-primary border-primary" : "border-input"}`} />
                  <span className="text-sm truncate">{option}</span>
                </div>
              ) : null
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

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
          <FilterPopover label="Investment List" filterKey="investmentLists" items={options.investmentLists} />
          <FilterPopover label="Subsegment" filterKey="subsegments" items={options.subsegments} />
          <FilterPopover label="Industry" filterKey="industries" items={options.industries} />
          <FilterPopover label="Country" filterKey="countries" items={options.countries} />
          <FilterPopover label="Lifecycle" filterKey="lifecycle" items={options.lifecycles} />
          <FilterPopover label="Funding" filterKey="fundingRound" items={options.fundingRounds} />
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
