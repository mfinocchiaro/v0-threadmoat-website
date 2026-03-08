"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { BoxPlotChart } from "@/components/charts/box-plot-chart"
import { Skeleton } from "@/components/ui/skeleton"

function BoxPlotInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Box Plot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Statistical distribution of metrics across categories. Shows median, quartiles, and outliers for each group.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <BoxPlotChart data={filtered} className="h-[600px]" />
        </>
      )}
    </div>
  )
}

export default function BoxPlotPage() {
  return (
    <VizPageShell>
      <BoxPlotInner />
    </VizPageShell>
  )
}
