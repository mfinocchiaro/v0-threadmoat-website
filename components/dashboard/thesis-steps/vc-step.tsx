"use client"

import { useMemo } from "react"
import { Company } from "@/lib/company-data"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  VCThesis, FUNDING_STAGES, DEAL_SIZE_BRACKETS,
  SCORE_DIMENSIONS, ScoreDimensionKey,
} from "@/contexts/thesis-context"
import { getInvestmentColor } from "@/lib/investment-colors"

interface VCStepProps {
  thesis: VCThesis
  onChange: (thesis: VCThesis) => void
  companies: Company[]
  variant?: "founder" | "investor"
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

function CheckboxGrid({ items, selected, onToggle, showColorDot }: {
  items: [string, number][]
  selected: string[]
  onToggle: (item: string) => void
  showColorDot?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(([item, count]) => (
        <label key={item} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
          <Checkbox
            checked={selected.includes(item)}
            onCheckedChange={() => onToggle(item)}
          />
          {showColorDot && (
            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: getInvestmentColor(item) }} />
          )}
          <span className="truncate flex-1 min-w-0">{item}</span>
          <span className="text-muted-foreground text-xs tabular-nums shrink-0">{count}</span>
        </label>
      ))}
    </div>
  )
}

function PillGrid({ items, selected, onToggle, limit = 20 }: {
  items: [string, number][]
  selected: string[]
  onToggle: (item: string) => void
  limit?: number
}) {
  const visible = items.slice(0, limit)
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map(([item, count]) => {
        const active = selected.includes(item)
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
            }`}
          >
            {item}
            <span className="opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function VCStep({ thesis, onChange, companies, variant = "investor" }: VCStepProps) {
  const isFounder = variant === "founder"

  const investmentLists = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      const list = c.investmentList || "Unknown"
      counts[list] = (counts[list] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [companies])

  const subcategories = useMemo(() => {
    const counts: Record<string, number> = {}
    // Only show subcategories matching selected investment lists
    const selectedLists = thesis.investmentLists ?? []
    for (const c of companies) {
      if (selectedLists.length > 0 && !selectedLists.includes(c.investmentList)) continue
      const sub = c.subcategories
      if (sub) counts[sub] = (counts[sub] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [companies, thesis.investmentLists])

  const categoryTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      for (const tag of c.categoryTags || []) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [companies])

  const operatingModelTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      for (const tag of c.operatingModelTags || []) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [companies])

  const countries = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      if (c.country) counts[c.country] = (counts[c.country] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20) as [string, number][]
  }, [companies])

  return (
    <div className="space-y-6">
      {isFounder ? (
        /* ── FOUNDER: Competitive landscape focus ── */
        <>
          <p className="text-xs text-muted-foreground">
            Define your competitive space. Select your sector and subcategory to find direct competitors,
            then refine by what they do and how they operate.
          </p>

          {/* Sector (Investment List) */}
          <section>
            <h4 className="text-sm font-medium mb-2">Your Sector</h4>
            <CheckboxGrid
              items={investmentLists}
              selected={thesis.investmentLists ?? []}
              onToggle={item => onChange({ ...thesis, investmentLists: toggleItem(thesis.investmentLists ?? [], item) })}
              showColorDot
            />
          </section>

          {/* Subcategory drill-down */}
          {subcategories.length > 0 && (
            <section>
              <h4 className="text-sm font-medium mb-2">Your Subcategory</h4>
              <p className="text-xs text-muted-foreground mb-2">Narrows to direct competitors in your space.</p>
              <CheckboxGrid
                items={subcategories}
                selected={thesis.subcategories ?? []}
                onToggle={item => onChange({ ...thesis, subcategories: toggleItem(thesis.subcategories ?? [], item) })}
              />
            </section>
          )}

          {/* Category/Function Tags — what do competitors do */}
          <section>
            <h4 className="text-sm font-medium mb-2">Competitor Capabilities</h4>
            <p className="text-xs text-muted-foreground mb-2">What technologies or functions matter in your space?</p>
            <PillGrid
              items={categoryTags}
              selected={thesis.categoryTags ?? []}
              onToggle={item => onChange({ ...thesis, categoryTags: toggleItem(thesis.categoryTags ?? [], item) })}
              limit={24}
            />
          </section>

          {/* Competitor funding stages */}
          <section>
            <h4 className="text-sm font-medium mb-2">Competitor Funding Stages</h4>
            <div className="grid grid-cols-3 gap-2">
              {FUNDING_STAGES.map(stage => (
                <label key={stage} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(thesis.fundingStages ?? []).includes(stage)}
                    onCheckedChange={() => onChange({ ...thesis, fundingStages: toggleItem(thesis.fundingStages ?? [], stage) })}
                  />
                  {stage}
                </label>
              ))}
            </div>
          </section>

          {/* Geography */}
          <section>
            <h4 className="text-sm font-medium mb-2">Geographic Competition</h4>
            <CheckboxGrid
              items={countries}
              selected={thesis.countries ?? []}
              onToggle={item => onChange({ ...thesis, countries: toggleItem(thesis.countries ?? [], item) })}
            />
          </section>

          {/* Score Weights */}
          <section>
            <h4 className="text-sm font-medium mb-3">What Matters Most</h4>
            <ScoreWeightSliders thesis={thesis} onChange={onChange} />
          </section>
        </>
      ) : (
        /* ── INVESTOR: Deal flow focus ── */
        <>
          <p className="text-xs text-muted-foreground">
            Define your investment criteria. Filter by stage, size, and business model
            to surface the best deal flow from {companies.length} companies.
          </p>

          {/* Funding Stages */}
          <section>
            <h4 className="text-sm font-medium mb-2">Target Funding Stages</h4>
            <div className="grid grid-cols-3 gap-2">
              {FUNDING_STAGES.map(stage => (
                <label key={stage} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(thesis.fundingStages ?? []).includes(stage)}
                    onCheckedChange={() => onChange({ ...thesis, fundingStages: toggleItem(thesis.fundingStages ?? [], stage) })}
                  />
                  {stage}
                </label>
              ))}
            </div>
          </section>

          {/* Deal Size */}
          <section>
            <h4 className="text-sm font-medium mb-2">Deal Size Range</h4>
            <div className="grid grid-cols-3 gap-2">
              {DEAL_SIZE_BRACKETS.map(bracket => (
                <label key={bracket} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(thesis.dealSizeBrackets ?? []).includes(bracket)}
                    onCheckedChange={() => onChange({ ...thesis, dealSizeBrackets: toggleItem(thesis.dealSizeBrackets ?? [], bracket) })}
                  />
                  {bracket}
                </label>
              ))}
            </div>
          </section>

          {/* Sectors */}
          <section>
            <h4 className="text-sm font-medium mb-2">Sectors</h4>
            <CheckboxGrid
              items={investmentLists}
              selected={thesis.investmentLists ?? []}
              onToggle={item => onChange({ ...thesis, investmentLists: toggleItem(thesis.investmentLists ?? [], item) })}
              showColorDot
            />
          </section>

          {/* Operating Model Tags — how the company operates */}
          <section>
            <h4 className="text-sm font-medium mb-2">Business Model Filter</h4>
            <p className="text-xs text-muted-foreground mb-2">SaaS, platform, marketplace, hardware — what operating models interest you?</p>
            <PillGrid
              items={operatingModelTags}
              selected={thesis.operatingModelTags ?? []}
              onToggle={item => onChange({ ...thesis, operatingModelTags: toggleItem(thesis.operatingModelTags ?? [], item) })}
              limit={20}
            />
          </section>

          {/* Category/Function Tags */}
          <section>
            <h4 className="text-sm font-medium mb-2">Technology Focus</h4>
            <p className="text-xs text-muted-foreground mb-2">What capabilities or technologies are you looking for?</p>
            <PillGrid
              items={categoryTags}
              selected={thesis.categoryTags ?? []}
              onToggle={item => onChange({ ...thesis, categoryTags: toggleItem(thesis.categoryTags ?? [], item) })}
              limit={24}
            />
          </section>

          {/* Geography */}
          <section>
            <h4 className="text-sm font-medium mb-2">Geography</h4>
            <CheckboxGrid
              items={countries}
              selected={thesis.countries ?? []}
              onToggle={item => onChange({ ...thesis, countries: toggleItem(thesis.countries ?? [], item) })}
            />
          </section>

          {/* Score Weights */}
          <section>
            <h4 className="text-sm font-medium mb-3">Score Weights</h4>
            <ScoreWeightSliders thesis={thesis} onChange={onChange} />
          </section>
        </>
      )}
    </div>
  )
}

function ScoreWeightSliders({ thesis, onChange }: { thesis: VCThesis; onChange: (t: VCThesis) => void }) {
  const weights = thesis.scoreWeights ?? {}
  return (
    <div className="space-y-4">
      {SCORE_DIMENSIONS.map(dim => (
        <div key={dim.key} className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{dim.label}</Label>
            <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
              {weights[dim.key] ?? 5}
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[weights[dim.key] ?? 5]}
            onValueChange={([val]) =>
              onChange({
                ...thesis,
                scoreWeights: { ...weights, [dim.key]: val },
              })
            }
          />
        </div>
      ))}
    </div>
  )
}
