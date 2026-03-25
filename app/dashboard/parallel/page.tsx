"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { ParallelCoordsChart } from "@/components/charts/parallel-coords-chart"
import { Skeleton } from "@/components/ui/skeleton"

function ParallelInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Parallel Coordinates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Multi-dimensional company analysis. Drag vertically on any axis to filter companies. Click an axis label to
          clear its filter.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
          <ParallelCoordsChart data={filtered} className="h-[640px]" />
      )}
    </div>
  )
}

export default function ParallelPage() {
  return (
    <VizPageShell>
      <ParallelInner />
    </VizPageShell>
  )
}
