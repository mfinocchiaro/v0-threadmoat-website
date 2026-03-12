"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { MaturityMatrixChart } from "@/components/charts/maturity-matrix-chart"
import { Skeleton } from "@/components/ui/skeleton"

function MaturityMatrixInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Maturity Matrix</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Red Ocean / Blue Ocean positioning — 4×4 matrix mapping categories, startups, and incumbent vendors by market disruption potential and innovation intensity.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <MaturityMatrixChart data={filtered} />
        </>
      )}
    </div>
  )
}

export function MaturityMatrixContent() {
  return (
    <VizPageShell>
      <MaturityMatrixInner />
    </VizPageShell>
  )
}
