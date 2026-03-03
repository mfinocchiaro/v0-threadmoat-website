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

interface VCStepProps {
  thesis: VCThesis
  onChange: (thesis: VCThesis) => void
  companies: Company[]
  variant?: "founder" | "investor"
}

const LABELS = {
  founder: {
    fundingStages: "Competitor Funding Stages",
    dealSize: "Competitor Funding Range",
    sectors: "Your Sector",
    geography: "Geographic Competition",
    scoreWeights: "What Matters Most",
  },
  investor: {
    fundingStages: "Target Funding Stages",
    dealSize: "Deal Size Range",
    sectors: "Sectors",
    geography: "Geography (Top 20)",
    scoreWeights: "Score Weights",
  },
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

export function VCStep({ thesis, onChange, companies, variant = "investor" }: VCStepProps) {
  const l = LABELS[variant]

  const investmentLists = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      const list = c.investmentList || "Unknown"
      counts[list] = (counts[list] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [companies])

  const countries = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      if (c.country) counts[c.country] = (counts[c.country] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
  }, [companies])

  return (
    <div className="space-y-6">
      {/* Funding Stages */}
      <section>
        <h4 className="text-sm font-medium mb-3">{l.fundingStages}</h4>
        <div className="grid grid-cols-3 gap-2">
          {FUNDING_STAGES.map(stage => (
            <label key={stage} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.fundingStages.includes(stage)}
                onCheckedChange={() =>
                  onChange({ ...thesis, fundingStages: toggleItem(thesis.fundingStages, stage) })
                }
              />
              {stage}
            </label>
          ))}
        </div>
      </section>

      {/* Deal Size */}
      <section>
        <h4 className="text-sm font-medium mb-3">{l.dealSize}</h4>
        <div className="grid grid-cols-3 gap-2">
          {DEAL_SIZE_BRACKETS.map(bracket => (
            <label key={bracket} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.dealSizeBrackets.includes(bracket)}
                onCheckedChange={() =>
                  onChange({ ...thesis, dealSizeBrackets: toggleItem(thesis.dealSizeBrackets, bracket) })
                }
              />
              {bracket}
            </label>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section>
        <h4 className="text-sm font-medium mb-3">{l.sectors}</h4>
        <div className="grid grid-cols-2 gap-2">
          {investmentLists.map(([list, count]) => (
            <label key={list} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.investmentLists.includes(list)}
                onCheckedChange={() =>
                  onChange({ ...thesis, investmentLists: toggleItem(thesis.investmentLists, list) })
                }
              />
              <span className="truncate">{list}</span>
              <span className="text-muted-foreground ml-auto text-xs">{count}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Geography */}
      <section>
        <h4 className="text-sm font-medium mb-3">{l.geography}</h4>
        <div className="grid grid-cols-2 gap-2">
          {countries.map(([country, count]) => (
            <label key={country} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={thesis.countries.includes(country)}
                onCheckedChange={() =>
                  onChange({ ...thesis, countries: toggleItem(thesis.countries, country) })
                }
              />
              <span className="truncate">{country}</span>
              <span className="text-muted-foreground ml-auto text-xs">{count}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Score Weights */}
      <section>
        <h4 className="text-sm font-medium mb-3">{l.scoreWeights}</h4>
        <div className="space-y-4">
          {SCORE_DIMENSIONS.map(dim => (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{dim.label}</Label>
                <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">
                  {thesis.scoreWeights[dim.key]}
                </span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[thesis.scoreWeights[dim.key]]}
                onValueChange={([val]) =>
                  onChange({
                    ...thesis,
                    scoreWeights: { ...thesis.scoreWeights, [dim.key]: val },
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
