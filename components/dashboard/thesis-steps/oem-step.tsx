"use client"

import { useMemo } from "react"
import { Company } from "@/lib/company-data"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { OEMThesis, OEMCoverage, OEM_COVERAGE_OPTIONS } from "@/contexts/thesis-context"

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

const COVERAGE_DESCRIPTIONS: Record<OEMCoverage, string> = {
  commercial: "Using off-the-shelf vendor solution",
  customized: "Vendor solution with significant customization",
  homegrown: "Built in-house",
  none: "No solution in place",
}

export function OEMStep({ thesis, onChange, companies }: OEMStepProps) {
  const investmentLists = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of companies) {
      const list = c.investmentList || "Unknown"
      counts[list] = (counts[list] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [companies])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">
          For each software category, indicate your current coverage. Customized and homegrown solutions
          will surface replacement candidates. Uncovered areas will show as coverage gaps.
        </p>
      </div>

      {investmentLists.map(([list, count]) => (
        <section key={list} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{list}</h4>
            <span className="text-xs text-muted-foreground">{count} companies</span>
          </div>
          <RadioGroup
            value={thesis.coverageMap[list] || "none"}
            onValueChange={(val) =>
              onChange({
                ...thesis,
                coverageMap: { ...thesis.coverageMap, [list]: val as OEMCoverage },
              })
            }
            className="grid grid-cols-2 gap-2"
          >
            {OEM_COVERAGE_OPTIONS.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2 rounded-md border border-border/50 p-2 text-sm cursor-pointer hover:bg-muted/30 has-[data-state=checked]:border-primary/50 has-[data-state=checked]:bg-primary/5"
              >
                <RadioGroupItem value={opt} />
                <div>
                  <div className="font-medium text-xs">{COVERAGE_LABELS[opt]}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </section>
      ))}
    </div>
  )
}
