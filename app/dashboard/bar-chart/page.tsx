"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { BarChart } from "@/components/charts/bar-chart"
import { Skeleton } from "@/components/ui/skeleton"

function BarChartInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bar Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">Top companies ranked by funding, score, headcount, or market opportunity.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <BarChart data={filtered} />
      )}
    </div>
  )
}

export default function BarChartPage() {
  return (
    <VizPageShell>
      <BarChartInner />
    </VizPageShell>
  )
}
