"use client"

import * as React from "react"
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useFilter } from "@/contexts/filter-context"
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

    return { investmentLists, subsegments, industries, countries, lifecycles, fundingRounds, opModelGroups, categoryTags }
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
    filters.operatingModel.length +
    filters.categoryTags.length +
    filters.differentiationTags.length

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
        <div className="p-4 space-y-3">
          <PillFilter
            label="Investment List" items={options.investmentLists} active={filters.investmentLists}
            onToggle={(v) => toggle("investmentLists", v)} onClear={() => clearFilter("investmentLists")}
            showColorDot
          />

          {/* Primary Op Model dimensions: Deployment, Segment, Focus */}
          {primaryOpGroups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operating Model</span>
                {filters.operatingModel.length > 0 && (
                  <button onClick={() => clearFilter("operatingModel")} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear ({filters.operatingModel.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {primaryOpGroups.map(({ group, tags }) => (
                  <OpModelGroup key={group} group={group} tags={tags} active={filters.operatingModel} onToggle={(v) => toggle("operatingModel", v)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ TIER 2: Secondary Slicers (collapsible) ═══ */}
        <div className="px-4 py-1">
          <FilterSection title="Category & Delivery" defaultOpen={false}>
            <PillFilter
              label="Category" items={options.categoryTags} active={filters.categoryTags}
              onToggle={(v) => toggle("categoryTags", v)} onClear={() => clearFilter("categoryTags")}
              compact
            />

            {/* Secondary Op Model dimensions */}
            {secondaryOpGroups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

        {/* ═══ TIER 3: Additional Filters (collapsed by default) ═══ */}
        <div className="px-4 py-1">
          <FilterSection title="More Filters" defaultOpen={false}>
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
