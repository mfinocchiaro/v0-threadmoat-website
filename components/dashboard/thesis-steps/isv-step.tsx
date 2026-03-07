"use client"

import { useMemo, useState } from "react"
import { Company } from "@/lib/company-data"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ISVThesis } from "@/contexts/thesis-context"
import { Search, AlertCircle } from "lucide-react"

interface ISVStepProps {
  thesis: ISVThesis
  onChange: (thesis: ISVThesis) => void
  companies: Company[]
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

export function ISVStep({ thesis, onChange, companies }: ISVStepProps) {
  const [industrySearch, setIndustrySearch] = useState("")

  const investmentLists = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      const list = c.investmentList || "Unknown"
      counts[list] = (counts[list] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [companies])

  const lifecycles = useMemo(() => {
    const set = new Set<string>()
    for (const c of companies) {
      const phase = c.lifecyclePhase || c.startupLifecyclePhase
      if (phase) set.add(phase)
    }
    return [...set].sort()
  }, [companies])

  const industries = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      if (c.industriesServed) {
        for (const ind of c.industriesServed) {
          counts[ind] = (counts[ind] || 0) + 1
        }
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [companies])

  const operatingModelTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      for (const tag of c.operatingModelTags || []) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [companies])

  const filteredIndustries = useMemo(() => {
    if (!industrySearch) return industries.slice(0, 30)
    const q = industrySearch.toLowerCase()
    return industries.filter(([ind]) => ind.toLowerCase().includes(q)).slice(0, 30)
  }, [industries, industrySearch])

  const maxLists = 3
  const atListLimit = thesis.coveredInvestmentLists.length >= maxLists

  return (
    <div className="space-y-6">
      {/* Investment Lists You Cover */}
      <section>
        <h4 className="text-sm font-medium mb-1">Investment Lists You Cover</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Select areas where you already have solutions (max {maxLists}). Uncovered areas become acquisition targets.
        </p>
        {atListLimit && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
            <AlertCircle className="size-3.5" /> Maximum {maxLists} investment lists selected.
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {investmentLists.map(([list, count]) => {
            const checked = thesis.coveredInvestmentLists.includes(list)
            return (
              <label key={list} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={checked}
                  disabled={!checked && atListLimit}
                  onCheckedChange={() =>
                    onChange({ ...thesis, coveredInvestmentLists: toggleItem(thesis.coveredInvestmentLists, list) })
                  }
                />
                <span className="truncate">{list}</span>
                <span className="text-muted-foreground ml-auto text-xs">{count}</span>
              </label>
            )
          })}
        </div>
      </section>

      {/* Operating Model Tags */}
      <section>
        <h4 className="text-sm font-medium mb-1">Operating Model Filter</h4>
        <p className="text-xs text-muted-foreground mb-3">
          SaaS, platform, marketplace, hardware — what models interest you?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {operatingModelTags.slice(0, 20).map(([tag, count]) => {
            const active = (thesis.operatingModelTags || []).includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onChange({ ...thesis, operatingModelTags: toggleItem(thesis.operatingModelTags || [], tag) })}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                {tag}
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Lifecycle Phases */}
      <section>
        <h4 className="text-sm font-medium mb-1">Lifecycle Phases You Serve</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Select phases where your product is active.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {lifecycles.map(phase => (
            <label key={phase} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.coveredLifecycles.includes(phase)}
                onCheckedChange={() =>
                  onChange({ ...thesis, coveredLifecycles: toggleItem(thesis.coveredLifecycles, phase) })
                }
              />
              <span className="truncate">{phase}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Target Industries */}
      <section>
        <h4 className="text-sm font-medium mb-1">Target Industries</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Search and select industries you want to target.
        </p>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search industries..."
            value={industrySearch}
            onChange={e => setIndustrySearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {thesis.targetIndustries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {thesis.targetIndustries.map(ind => (
              <button
                key={ind}
                onClick={() =>
                  onChange({ ...thesis, targetIndustries: toggleItem(thesis.targetIndustries, ind) })
                }
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
              >
                {ind} &times;
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
          {filteredIndustries.map(([ind, count]) => (
            <label key={ind} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.targetIndustries.includes(ind)}
                onCheckedChange={() =>
                  onChange({ ...thesis, targetIndustries: toggleItem(thesis.targetIndustries, ind) })
                }
              />
              <span className="truncate">{ind}</span>
              <span className="text-muted-foreground ml-auto text-xs">{count}</span>
            </label>
          ))}
          {filteredIndustries.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No industries match your search.</p>
          )}
        </div>
      </section>
    </div>
  )
}
