"use client"

import { useMemo } from "react"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { FinancialHeatmapChart } from "@/components/charts/financial-heatmap-chart"
import { Skeleton } from "@/components/ui/skeleton"

function FinancialHeatmapInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  const filteredNames = useMemo(() => {
    return new Set(filtered.map((c) => c.name))
  }, [filtered])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financial Heatmap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Startups ranked by financial health. Qualitative ratings (green = strong, red = weak) plus key numeric metrics across 600+ companies.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <FinancialHeatmapChart className="min-h-[500px]" filteredCompanyNames={filteredNames} />
        </>
      )}
    </div>
  )
}

export default function FinancialHeatmapPage() {
  return (
    <VizPageShell>
      <FinancialHeatmapInner />
    </VizPageShell>
  )
}
