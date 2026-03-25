"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { CorrelationMatrixChart } from "@/components/charts/correlation-matrix-chart"
import { Skeleton } from "@/components/ui/skeleton"

function CorrelationInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Correlation Matrix</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pearson correlation between all performance metrics — green = positive, red = negative. Hover any cell for details.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
          <CorrelationMatrixChart data={filtered} className="h-auto" />
      )}
    </div>
  )
}

export function CorrelationContent() {
  return (
    <VizPageShell>
      <CorrelationInner />
    </VizPageShell>
  )
}
