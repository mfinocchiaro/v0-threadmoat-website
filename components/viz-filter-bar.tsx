"use client"

import * as React from "react"
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/company-data"
import { useFilter, getOceanType, ECOSYSTEM_FLAGS } from "@/contexts/filter-context"
import { Company } from "@/lib/company-data"
import { getInvestmentColor } from "@/lib/investment-colors"

/* ─── Pill Filter (reusable) ─── */

interface PillFilterProps {
  label: string
  items: string[]
  active: string[]
  onToggle: (value: string) => void
  onClear: () => void
  showColorDot?: boolean
  maxVisible?: number
  compact?: boolean
}

function PillFilter({ label, items, active, onToggle, onClear, showColorDot, maxVisible = 12, compact }: PillFilterProps) {
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded ? items : items.slice(0, maxVisible)
  const hasMore = items.length > maxVisible
  const pillSize = compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {active.length > 0 && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
            Clear ({active.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(option => {
          const isActive = active.includes(option)
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`inline-flex items-center gap-1.5 ${pillSize} rounded-full font-medium transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {showColorDot && (
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getInvestmentColor(option) }}
                />
              )}
              {option}
            </button>
          )
        })}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1 ${pillSize} rounded-full font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:bg-muted transition-colors`}
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>+{items.length - maxVisible} more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Operating Model dimension group (inline pills) ─── */

interface OpModelGroupProps {
  group: string
  tags: string[]
  active: string[]
  onToggle: (value: string) => void
}

function OpModelGroup({ group, tags, active, onToggle }: OpModelGroupProps) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground/70">{group}</span>
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => {
          const isActive = active.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Collapsible section ─── */

function FilterSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left py-1.5"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </button>
      {open && <div className="space-y-3 pt-1 pb-2">{children}</div>}
    </div>
  )
}

/* ─── Operating Model dimension definitions ─── */

const OP_MODEL_GROUPS: Record<string, Set<string>> = {
  "Deployment": new Set(["Cloud", "On-premises", "Hybrid", "Edge"]),
  "Segment": new Set(["Enterprise", "Mid-market", "SMB", "B2B", "B2C"]),
  "Delivery": new Set(["SaaS", "PaaS", "HW+SW", "Plugin/Add-on", "API/SDK", "Marketplace", "Open Source", "Perpetual License"]),
  "Sales Motion": new Set(["Direct Sales", "Product-led Growth", "Partner/Channel", "Self-Service", "Enterprise Sales", "OEM", "Freemium"]),
  "Geo Reach": new Set(["Local", "Regional", "International", "Global"]),
  "Pricing": new Set(["Subscription", "Usage-based", "Per-seat", "Per-unit", "Per-project"]),
  "Focus": new Set(["Vertical", "Horizontal"]),
  "Compute": new Set(["Cloud HPC", "Edge AI", "GPU-intensive"]),
}

// Primary slicers: dimensions that have <6 options and are top-level filters
const PRIMARY_OP_GROUPS = ["Deployment", "Segment", "Focus"]
// Secondary slicers: shown in collapsible section
const SECONDARY_OP_GROUPS = ["Delivery", "Sales Motion", "Geo Reach", "Pricing"]

/* ─── Funding Range Slider ─── */

function formatFundingShort(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v}`
}

function FundingRangeSlider({ min, max, value, onChange }: {
  min: number
  max: number
  value: [number, number]
  onChange: (range: [number, number]) => void
}) {
  const isActive = value[0] !== 0 || value[1] !== 0
  const effectiveLo = isActive ? value[0] : min
  const effectiveHi = isActive ? value[1] : max

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          VC Funding Range
        </span>
        {isActive && (
          <button
            onClick={() => onChange([0, 0])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums w-14 text-right shrink-0">{formatFundingShort(effectiveLo)}</span>
        <Slider
          min={min}
          max={max}
          step={Math.max(100000, Math.round((max - min) / 100))}
          value={[effectiveLo, effectiveHi]}
          onValueChange={([lo, hi]) => onChange([lo, hi])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground tabular-nums w-14 shrink-0">{formatFundingShort(effectiveHi)}</span>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

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

    // Operating Model: grouped by dimension
    const allOpTags = new Set(companies.flatMap(c => c.operatingModelTags || []).filter(Boolean))
    const opModelGroups = Object.entries(OP_MODEL_GROUPS).map(([group, tags]) => ({
      group,
      tags: Array.from(tags).filter(t => allOpTags.has(t)),
    })).filter(g => g.tags.length > 0)

    // Category Tags: sorted by frequency
    const catCount = new Map<string, number>()
    companies.forEach(c => (c.categoryTags || []).forEach(t => {
      if (t) catCount.set(t, (catCount.get(t) || 0) + 1)
    }))
    const categoryTags = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t)

    // Size categories
    const sizeCategories = Array.from(new Set(companies.map(c => c.startupSizeCategory).filter(Boolean))).sort()

    // Ecosystem flags: group by category, only show flags that have at least 1 company
    const ecoGroups = new Map<string, { flag: string; label: string; count: number }[]>()
    Object.entries(ECOSYSTEM_FLAGS).forEach(([flag, def]) => {
      const count = companies.filter(c => c[def.field] === true).length
      if (count === 0) return
      if (!ecoGroups.has(def.group)) ecoGroups.set(def.group, [])
      ecoGroups.get(def.group)!.push({ flag, label: def.label, count })
    })
    const ecosystemGroups = Array.from(ecoGroups.entries()).map(([group, items]) => ({
      group,
      items: items.sort((a, b) => b.count - a.count),
    }))

    // Investment Theses: sorted by frequency
    const thesisCount = new Map<string, number>()
    companies.forEach(c => (c.investmentTheses || []).forEach(t => {
      if (t) thesisCount.set(t, (thesisCount.get(t) || 0) + 1)
    }))
    const investmentTheses = Array.from(thesisCount.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t)

    // Funding range
    const fundings = companies.map(c => c.totalFunding || 0).filter(f => f > 0)
    const fundingMin = fundings.length > 0 ? Math.min(...fundings) : 0
    const fundingMax = fundings.length > 0 ? Math.max(...fundings) : 0

    return { investmentLists, subsegments, industries, countries, lifecycles, fundingRounds, opModelGroups, categoryTags, sizeCategories, ecosystemGroups, investmentTheses, fundingMin, fundingMax }
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
      categoryTags: [],
      differentiationTags: [],
      investmentTheses: [],
      fundingRange: [0, 0] as [number, number],
      search: "",
      oceanStrategy: "all",
      sizeCategory: [],
      ecosystemFlags: [],
    }))
  }

  const activeCount =
    filters.investmentLists.length +
    filters.subsegments.length +
    filters.industries.length +
    filters.countries.length +
    filters.lifecycle.length +
    filters.fundingRound.length +
    filters.operatingModel.length +
    filters.categoryTags.length +
    filters.differentiationTags.length +
    filters.investmentTheses.length +
    (filters.fundingRange[0] !== 0 || filters.fundingRange[1] !== 0 ? 1 : 0) +
    filters.sizeCategory.length +
    filters.ecosystemFlags.length +
    (filters.oceanStrategy !== "all" ? 1 : 0)

  // Ocean strategy counts
  const oceanCounts = React.useMemo(() => {
    let red = 0, blue = 0
    companies.forEach(c => {
      if (getOceanType(c) === "red") red++; else blue++
    })
    return { red, blue }
  }, [companies])

  const primaryOpGroups = options.opModelGroups.filter(g => PRIMARY_OP_GROUPS.includes(g.group))
  const secondaryOpGroups = options.opModelGroups.filter(g => SECONDARY_OP_GROUPS.includes(g.group))

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {/* Search + Reset row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-8 h-9"
          />
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={clearAll} className="h-8 px-2 lg:px-3">
            Reset all filters
            <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">{activeCount}</Badge>
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-lg bg-muted/30 divide-y divide-border">

        {/* ═══ TIER 1: Primary Slicers (always visible) ═══ */}
        <div className="p-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Investment List pills */}
            <div className="flex-1">
              <PillFilter
                label="Investment List" items={options.investmentLists} active={filters.investmentLists}
                onToggle={(v) => toggle("investmentLists", v)} onClear={() => clearFilter("investmentLists")}
                showColorDot compact
              />
            </div>

            {/* Investment Thesis pills */}
            {options.investmentTheses.length > 0 && (
              <div className="flex-1">
                <PillFilter
                  label="Investment Thesis" items={options.investmentTheses} active={filters.investmentTheses}
                  onToggle={(v) => toggle("investmentTheses", v)} onClear={() => clearFilter("investmentTheses")}
                  compact
                />
              </div>
            )}
          </div>

          {/* VC Funding Range slider */}
          {options.fundingMax > 0 && (
            <FundingRangeSlider
              min={options.fundingMin}
              max={options.fundingMax}
              value={filters.fundingRange}
              onChange={(range) => setFilters(prev => ({ ...prev, fundingRange: range }))}
            />
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Ocean Strategy toggle */}
            <div className="shrink-0 space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategic Lens</span>
              <div className="flex gap-1.5">
                {([
                  { key: "all" as const, label: "All", color: "" },
                  { key: "red" as const, label: `Red Ocean`, color: "rgb(220, 38, 38)" },
                  { key: "blue" as const, label: `Blue Ocean`, color: "rgb(37, 99, 235)" },
                ] as const).map(({ key, label, color }) => {
                  const isActive = filters.oceanStrategy === key
                  const count = key === "all" ? companies.length : key === "red" ? oceanCounts.red : oceanCounts.blue
                  return (
                    <button
                      key={key}
                      onClick={() => setFilters(prev => ({ ...prev, oceanStrategy: prev.oceanStrategy === key ? "all" : key }))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                        isActive
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
                      <span className={`text-[10px] font-normal ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Primary Op Model dimensions: Deployment, Segment, Focus */}
          {primaryOpGroups.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operating Model</span>
                {filters.operatingModel.length > 0 && (
                  <button onClick={() => clearFilter("operatingModel")} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear ({filters.operatingModel.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {primaryOpGroups.map(({ group, tags }) => (
                  <OpModelGroup key={group} group={group} tags={tags} active={filters.operatingModel} onToggle={(v) => toggle("operatingModel", v)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ TIER 2: Secondary Slicers (collapsible) ═══ */}
        <div className="px-3 py-0.5">
          <FilterSection title="Category & Delivery" defaultOpen={false}>
            <PillFilter
              label="Category" items={options.categoryTags} active={filters.categoryTags}
              onToggle={(v) => toggle("categoryTags", v)} onClear={() => clearFilter("categoryTags")}
              compact
            />

            {/* Secondary Op Model dimensions */}
            {secondaryOpGroups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {secondaryOpGroups.map(({ group, tags }) => (
                  <OpModelGroup key={group} group={group} tags={tags} active={filters.operatingModel} onToggle={(v) => toggle("operatingModel", v)} />
                ))}
              </div>
            )}

            <PillFilter
              label="Subsegment" items={options.subsegments} active={filters.subsegments}
              onToggle={(v) => toggle("subsegments", v)} onClear={() => clearFilter("subsegments")}
              compact maxVisible={15}
            />
            <PillFilter
              label="Industry" items={options.industries} active={filters.industries}
              onToggle={(v) => toggle("industries", v)} onClear={() => clearFilter("industries")}
              compact maxVisible={15}
            />
          </FilterSection>
        </div>

        {/* ═══ TIER 2.5: Ecosystem Compatibility (collapsible) ═══ */}
        {options.ecosystemGroups.length > 0 && (
          <div className="px-3 py-0.5">
            <FilterSection title="Ecosystem & Compatibility" defaultOpen={false}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technology & VC Flags</span>
                  {filters.ecosystemFlags.length > 0 && (
                    <button onClick={() => clearFilter("ecosystemFlags")} className="text-xs text-muted-foreground hover:text-foreground">
                      Clear ({filters.ecosystemFlags.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {options.ecosystemGroups.map(({ group, items }) => (
                    <div key={group} className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70">{group}</span>
                      <div className="flex flex-wrap gap-1">
                        {items.map(({ flag, label, count }) => {
                          const isActive = filters.ecosystemFlags.includes(flag)
                          return (
                            <button
                              key={flag}
                              onClick={() => toggle("ecosystemFlags", flag)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {label}
                              <span className={`text-[10px] ${isActive ? "opacity-70" : "text-muted-foreground"}`}>{count}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FilterSection>
          </div>
        )}

        {/* ═══ TIER 3: Additional Filters (collapsed by default) ═══ */}
        <div className="px-3 py-0.5">
          <FilterSection title="More Filters" defaultOpen={false}>
            {options.sizeCategories.length > 0 && (
              <PillFilter
                label="Startup Size" items={options.sizeCategories} active={filters.sizeCategory}
                onToggle={(v) => toggle("sizeCategory", v)} onClear={() => clearFilter("sizeCategory")}
                compact
              />
            )}
            <PillFilter
              label="Country" items={options.countries} active={filters.countries}
              onToggle={(v) => toggle("countries", v)} onClear={() => clearFilter("countries")}
              compact maxVisible={15}
            />
            <PillFilter
              label="Lifecycle" items={options.lifecycles} active={filters.lifecycle}
              onToggle={(v) => toggle("lifecycle", v)} onClear={() => clearFilter("lifecycle")}
              compact
            />
            <PillFilter
              label="Funding Round" items={options.fundingRounds} active={filters.fundingRound}
              onToggle={(v) => toggle("fundingRound", v)} onClear={() => clearFilter("fundingRound")}
              compact
            />
          </FilterSection>
        </div>
      </div>
    </div>
  )
}
