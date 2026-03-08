"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, X, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Company, formatCurrency } from "@/lib/company-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { Skeleton } from "@/components/ui/skeleton"

const SCORE_COLOR = (v: number) =>
  v >= 4 ? "text-emerald-500 font-medium" : v >= 3 ? "text-amber-500" : "text-red-500"

function CompareInner() {
  const { companies: allCompanies, isLoading } = useThesisGatedData()
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const preSelected = useRef(false)

  // Pre-select top 3 by score once data loads
  useEffect(() => {
    if (allCompanies.length > 0 && !preSelected.current) {
      preSelected.current = true
      const top3 = [...allCompanies]
        .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
        .slice(0, 3)
        .map(c => c.id)
      setSelected(top3)
    }
  }, [allCompanies])

  const suggestions = allCompanies
    .filter(c => !selected.includes(c.id) && c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6)

  const selectedCompanies = allCompanies.filter(c => selected.includes(c.id))

  const addCompany = (id: string) => {
    if (selected.length < 5) setSelected([...selected, id])
  }
  const removeCompany = (id: string) => setSelected(selected.filter(s => s !== id))

  const OVERVIEW_ROWS: { label: string; key: keyof Company; fmt?: (v: any) => string }[] = [
    { label: "Weighted Score", key: "weightedScore", fmt: v => (v || 0).toFixed(2) },
    { label: "Total Funding", key: "totalFunding", fmt: formatCurrency },
    { label: "Headcount", key: "headcount", fmt: v => v?.toLocaleString() ?? "—" },
    { label: "Founded", key: "founded", fmt: v => v?.toString() ?? "—" },
    { label: "Investment List", key: "investmentList" },
    { label: "Lifecycle Phase", key: "lifecyclePhase" },
    { label: "Location", key: "country" },
  ]

  const MOAT_ROWS: { label: string; key: keyof Company }[] = [
    { label: "Competitive Moat", key: "competitiveMoat" },
    { label: "Market Opportunity", key: "marketOpportunity" },
    { label: "Tech Differentiation", key: "techDifferentiation" },
    { label: "Team Execution", key: "teamExecution" },
    { label: "Industry Impact", key: "industryImpact" },
    { label: "Growth Metrics", key: "growthMetrics" },
    { label: "Funding Efficiency", key: "fundingEfficiency" },
  ]

  const FUNDING_ROWS: { label: string; key: keyof Company; fmt?: (v: any) => string }[] = [
    { label: "Total Funding", key: "totalFunding", fmt: formatCurrency },
    { label: "Last Amount", key: "lastFundingAmount", fmt: formatCurrency },
    { label: "Estimated Market Value", key: "estimatedMarketValue", fmt: formatCurrency },
    { label: "Funding Round", key: "latestFundingRound" },
    { label: "Funding Year", key: "fundingYear", fmt: v => v?.toString() ?? "—" },
    { label: "Est. Revenue", key: "estimatedRevenue", fmt: formatCurrency },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compare Companies</h1>
          <p className="text-muted-foreground">Select up to 5 companies to compare side-by-side.</p>
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compare Companies</h1>
        <p className="text-muted-foreground">Select up to 5 companies to compare side-by-side.</p>
      </div>

      {/* Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selected ({selected.length}/5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.map(c => (
              <Badge key={c.id} variant="secondary" className="gap-1 pl-3 pr-1 py-1.5">
                {c.name}
                <Button variant="ghost" size="icon" className="size-5 ml-1" onClick={() => removeCompany(c.id)}>
                  <X className="size-3" />
                </Button>
              </Badge>
            ))}
            {selected.length === 0 && (
              <p className="text-sm text-muted-foreground">No companies selected. Search below to add.</p>
            )}
          </div>

          {selected.length < 5 && (
            <div className="space-y-2">
              <Input
                placeholder="Search companies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {suggestions.map(c => (
                  <Button key={c.id} variant="outline" size="sm" onClick={() => addCompany(c.id)} className="gap-1">
                    <Plus className="size-3" />
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison */}
      {selectedCompanies.length >= 2 && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="moat">Scores</TabsTrigger>
                <TabsTrigger value="funding">Funding</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Metric</TableHead>
                      {selectedCompanies.map(c => <TableHead key={c.id}>{c.name}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OVERVIEW_ROWS.map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        {selectedCompanies.map(c => (
                          <TableCell key={c.id}>{row.fmt ? row.fmt(c[row.key]) : String(c[row.key] ?? "—")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="moat">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Dimension</TableHead>
                      {selectedCompanies.map(c => <TableHead key={c.id}>{c.name}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOAT_ROWS.map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        {selectedCompanies.map(c => {
                          const v = c[row.key] as number
                          return (
                            <TableCell key={c.id}>
                              <span className={SCORE_COLOR(v)}>{v ? v.toFixed(2) : "—"}</span>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="funding">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Metric</TableHead>
                      {selectedCompanies.map(c => <TableHead key={c.id}>{c.name}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FUNDING_ROWS.map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        {selectedCompanies.map(c => (
                          <TableCell key={c.id}>{row.fmt ? row.fmt(c[row.key]) : String(c[row.key] ?? "—")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedCompanies.length >= 2 && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const headers = ["Metric", ...selectedCompanies.map(c => c.name)].join(",")
            const rows = OVERVIEW_ROWS.map(row =>
              [row.label, ...selectedCompanies.map(c => row.fmt ? row.fmt(c[row.key]) : String(c[row.key] ?? ""))].join(",")
            )
            const csv = [headers, ...rows].join("\n")
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
            const a = document.createElement("a"); a.href = url; a.download = "comparison.csv"; a.click()
          }}>
            Export CSV
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <VizPageShell>
      <CompareInner />
    </VizPageShell>
  )
}
