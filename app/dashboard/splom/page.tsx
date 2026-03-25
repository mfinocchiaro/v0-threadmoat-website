"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { SplomChart } from "@/components/charts/splom-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SplomInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scatter Plot Matrix</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pairwise relationships between all key metrics — diagonal shows distributions, off-diagonal shows correlations. Click any dot for company details.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[760px] rounded-xl" />
      ) : (
          <SplomChart data={filtered} className="h-[760px]" />
      )}
    </div>
  )
}

export default function SplomPage() {
  return (
    <VizPageShell>
      <SplomInner />
    </VizPageShell>
  )
}
