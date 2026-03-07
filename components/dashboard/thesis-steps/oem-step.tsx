"use client"

import { useMemo, useState } from "react"
import { Company } from "@/lib/company-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { OEMThesis, OEMCoverage, OEM_COVERAGE_OPTIONS } from "@/contexts/thesis-context"
import { getInvestmentColor } from "@/lib/investment-colors"

interface OEMStepProps {
  thesis: OEMThesis
  onChange: (thesis: OEMThesis) => void
  companies: Company[]
}

const COVERAGE_LABELS: Record<OEMCoverage, string> = {
  commercial: "Commercial",
  customized: "Customized",
  homegrown: "Homegrown",
  none: "No Coverage",
}

interface SubcategoryInfo {
  name: string
  count: number
}

interface InvestmentGroupInfo {
  name: string
  count: number
  subcategories: SubcategoryInfo[]
  operatingModelTags: string[]
}

/** Build the two-level hierarchy: investment group -> subcategories, plus operating model tags per group */
function buildHierarchy(companies: Company[]): InvestmentGroupInfo[] {
  const groups = new Map<string, { count: number; subcats: Map<string, number>; tags: Set<string> }>()

  for (const c of companies) {
    const il = c.investmentList || "Unknown"
    if (!groups.has(il)) {
      groups.set(il, { count: 0, subcats: new Map(), tags: new Set() })
    }
    const g = groups.get(il)!
    g.count++

    const subcat = c.subcategories || "General"
    g.subcats.set(subcat, (g.subcats.get(subcat) || 0) + 1)

    for (const tag of c.operatingModelTags || []) {
      g.tags.add(tag)
    }
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      subcategories: Array.from(data.subcats.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([n, c]) => ({ name: n, count: c })),
      operatingModelTags: Array.from(data.tags).sort(),
    }))
}

/** Collect the top N most frequent operating model tags across all companies */
function getTopOperatingModelTags(companies: Company[], limit = 12): string[] {
  const counts = new Map<string, number>()
  for (const c of companies) {
    for (const tag of c.operatingModelTags || []) {
      const normalized = tag.trim()
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

function getCoverageIndicator(coverage: OEMCoverage | undefined): string {
  switch (coverage) {
    case "commercial": return "bg-emerald-500"
    case "customized": return "bg-amber-500"
    case "homegrown": return "bg-red-500"
    default: return "bg-muted-foreground/30"
  }
}

function getGroupCoverageSummary(group: InvestmentGroupInfo, coverageMap: Record<string, OEMCoverage>): string {
  const set = group.subcategories.reduce((acc, s) => {
    const c = coverageMap[s.name]
    if (c && c !== "none") acc++
    return acc
  }, 0)
  return `${set}/${group.subcategories.length} mapped`
}

export function OEMStep({ thesis, onChange, companies }: OEMStepProps) {
  const hierarchy = useMemo(() => buildHierarchy(companies), [companies])
  const topTags = useMemo(() => getTopOperatingModelTags(companies), [companies])
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const activeFilters = thesis.operatingModelFilters || []

  function toggleOpModelFilter(tag: string) {
    const current = thesis.operatingModelFilters || []
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    onChange({ ...thesis, operatingModelFilters: next })
  }

  function setCoverage(subcategory: string, value: OEMCoverage) {
    onChange({
      ...thesis,
      coverageMap: { ...thesis.coverageMap, [subcategory]: value },
    })
  }

  function setGroupCoverage(group: InvestmentGroupInfo, value: OEMCoverage) {
    const updated = { ...thesis.coverageMap }
    for (const sub of group.subcategories) {
      updated[sub.name] = value
    }
    onChange({ ...thesis, coverageMap: updated })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">
          Map your software landscape by subcategory. Customized and homegrown solutions
          surface replacement candidates. Uncovered areas show as coverage gaps.
        </p>
      </div>

      {/* Operating Model Tag Toggles */}
      {topTags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operating Model Filter</h4>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(tag => {
              const active = activeFilters.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleOpModelFilter(tag)}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          {activeFilters.length > 0 && (
            <button
              onClick={() => onChange({ ...thesis, operatingModelFilters: [] })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Two-level Accordion: Investment Group -> Subcategories */}
      <Accordion type="multiple" value={openGroups} onValueChange={setOpenGroups}>
        {hierarchy.map(group => {
          const color = getInvestmentColor(group.name)
          const summary = getGroupCoverageSummary(group, thesis.coverageMap)

          return (
            <AccordionItem key={group.name} value={group.name}>
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{group.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {group.count} companies &middot; {summary}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pl-5">
                  {/* Bulk set for entire group */}
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground mr-auto">Set all:</span>
                    {OEM_COVERAGE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setGroupCoverage(group, opt)}
                        className="text-xs px-2 py-0.5 rounded border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        {COVERAGE_LABELS[opt]}
                      </button>
                    ))}
                  </div>

                  {/* Individual subcategories */}
                  {group.subcategories.map(sub => {
                    const currentCoverage = thesis.coverageMap[sub.name]
                    return (
                      <div key={sub.name} className="py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`size-1.5 rounded-full shrink-0 ${getCoverageIndicator(currentCoverage)}`} />
                            <span className="text-xs font-medium truncate">{sub.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                            {sub.count}
                          </Badge>
                        </div>
                        <RadioGroup
                          value={currentCoverage || "none"}
                          onValueChange={(val) => setCoverage(sub.name, val as OEMCoverage)}
                          className="grid grid-cols-4 gap-1"
                        >
                          {OEM_COVERAGE_OPTIONS.map(opt => (
                            <label
                              key={opt}
                              className="flex items-center gap-1.5 rounded border border-border/50 px-2 py-1 text-[11px] cursor-pointer hover:bg-muted/30 has-[data-state=checked]:border-primary/50 has-[data-state=checked]:bg-primary/5"
                            >
                              <RadioGroupItem value={opt} className="size-3" />
                              <span>{COVERAGE_LABELS[opt]}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
