"use client"

import { useState, useMemo } from "react"
import { Company, formatCurrency } from "@/lib/company-data"
import { useThesis, ScoredCompany } from "@/contexts/thesis-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ThesisResultsProps {
  companies: Company[]
}

const MAX_EXPANDED = 25
const MAX_CATEGORIES = 4

function VCResults({ results, expanded }: { results: ScoredCompany[]; expanded: boolean }) {
  // Limit to top investment categories to avoid exposing the full database
  const filtered = useMemo(() => {
    const catCounts = new Map<string, number>()
    for (const r of results) {
      const cat = r.company.investmentList || "Other"
      catCounts.set(cat, (catCounts.get(cat) || 0) + 1)
    }
    const topCats = [...catCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CATEGORIES)
      .map(([cat]) => cat)
    return results.filter(r => topCats.includes(r.company.investmentList || "Other"))
  }, [results])

  const visible = expanded ? filtered.slice(0, MAX_EXPANDED) : filtered.slice(0, 10)
  return (
    <div className="space-y-2">
      {visible.map(({ company, score }) => (
        <div key={company.id} className="flex items-center gap-3 text-sm">
          <div className="w-32 truncate font-medium">{company.name}</div>
          <Progress value={score} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{score}%</span>
          <Badge variant="outline" className="text-xs shrink-0">{company.investmentList}</Badge>
        </div>
      ))}
    </div>
  )
}

function ISVResults({ results, expanded }: { results: ScoredCompany[]; expanded: boolean }) {
  const whitespace = results.filter(r => r.label === "Whitespace")
  const adjacent = results.filter(r => r.label === "Adjacent")
  const visibleWS = expanded ? whitespace.slice(0, MAX_EXPANDED) : whitespace.slice(0, 5)
  const visibleAdj = expanded ? adjacent.slice(0, MAX_EXPANDED) : adjacent.slice(0, 5)

  return (
    <div className="space-y-4">
      {whitespace.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Whitespace Opportunities ({whitespace.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleWS.map(({ company }) => (
              <div key={company.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">New</Badge>
                <span className="truncate">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {adjacent.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Adjacent Opportunities ({adjacent.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleAdj.map(({ company }) => (
              <div key={company.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Badge variant="outline" className="text-xs">Adj</Badge>
                <span className="truncate">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {whitespace.length === 0 && adjacent.length === 0 && (
        <p className="text-sm text-muted-foreground">No opportunities found — try adjusting your coverage.</p>
      )}
    </div>
  )
}

function OEMResults({ results, expanded }: { results: ScoredCompany[]; expanded: boolean }) {
  const replacements = results.filter(r => r.label === "Replacement Candidate")
  const gaps = results.filter(r => r.label === "Coverage Gap")
  const visibleRep = expanded ? replacements.slice(0, MAX_EXPANDED) : replacements.slice(0, 5)
  const visibleGap = expanded ? gaps.slice(0, MAX_EXPANDED) : gaps.slice(0, 5)

  return (
    <div className="space-y-4">
      {replacements.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Replacement Candidates ({replacements.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleRep.map(({ company }) => (
              <div key={company.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs">Replace</Badge>
                <span className="truncate">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {gaps.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Coverage Gaps ({gaps.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleGap.map(({ company }) => (
              <div key={company.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Badge variant="outline" className="text-xs">Gap</Badge>
                <span className="truncate">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {replacements.length === 0 && gaps.length === 0 && (
        <p className="text-sm text-muted-foreground">No results — adjust your coverage mapping.</p>
      )}
    </div>
  )
}

export function ThesisResults({ companies }: ThesisResultsProps) {
  const { activeThesis, activeConfig, scoreCompanies } = useThesis()
  const [expanded, setExpanded] = useState(false)

  const results = useMemo(() => {
    if (!activeThesis) return []
    const scored = scoreCompanies(companies)
    // Only show qualifying matches — never expose the full database
    if (activeThesis === "vc" || activeThesis === "founder") {
      return scored.filter(r => r.score >= 50)
    }
    if (activeThesis === "isv") {
      return scored.filter(r => r.label !== "Covered")
    }
    if (activeThesis === "oem") {
      return scored.filter(r => r.label !== "Commercial")
    }
    return scored
  }, [activeThesis, companies, scoreCompanies])

  if (!activeThesis || !activeConfig || results.length === 0) return null

  const totalMatches = results.length

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{activeConfig.resultTitle}</CardTitle>
          <span className="text-xs text-muted-foreground">{totalMatches} matches from {companies.length} companies</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(activeThesis === "vc" || activeThesis === "founder") && <VCResults results={results} expanded={expanded} />}
        {activeThesis === "isv" && <ISVResults results={results} expanded={expanded} />}
        {activeThesis === "oem" && <OEMResults results={results} expanded={expanded} />}

        {totalMatches > 10 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs"
          >
            {expanded ? (
              <><ChevronUp className="mr-1 h-3 w-3" /> Show less</>
            ) : (
              <><ChevronDown className="mr-1 h-3 w-3" /> Show more (top {Math.min(totalMatches, MAX_EXPANDED)})</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
