"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { ReportGenerator } from "@/components/charts/report-generator"
import { Skeleton } from "@/components/ui/skeleton"

function ReportsInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Report Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search companies and generate detailed IC-memo style investment reports with score breakdowns, strengths, and weaknesses.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <ReportGenerator data={filtered} className="w-full" />
        </>
      )}
    </div>
  )
}

export function ReportsContent() {
  return (
    <VizPageShell>
      <ReportsInner />
    </VizPageShell>
  )
}
