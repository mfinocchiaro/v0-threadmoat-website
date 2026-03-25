"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { RadarChart } from "@/components/charts/radar-chart"
import { Skeleton } from "@/components/ui/skeleton"

function RadarInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Radar Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare companies across 6 performance dimensions: Market Opportunity, Team Execution, Tech Differentiation,
          Funding Efficiency, Growth Metrics, and Industry Impact.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <RadarChart data={filtered} className="h-[640px]" />
      )}
    </div>
  )
}

export default function RadarPage() {
  return (
    <VizPageShell>
      <RadarInner />
    </VizPageShell>
  )
}
