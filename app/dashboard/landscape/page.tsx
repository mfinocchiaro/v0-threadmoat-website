"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { LandscapeChart } from "@/components/charts/landscape-chart"
import { Skeleton } from "@/components/ui/skeleton"

function LandscapeInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Market Landscape</h1>
        <p className="text-muted-foreground text-sm mt-1">Companies grouped by investment category and subsegment — hover to zoom, click to view details.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <LandscapeChart data={filtered} />
      )}
    </div>
  )
}

export default function LandscapePage() {
  return (
    <VizPageShell>
      <LandscapeInner />
    </VizPageShell>
  )
}
