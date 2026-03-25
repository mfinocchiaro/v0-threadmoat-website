"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { SunburstChart } from "@/components/charts/sunburst-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SunburstInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sunburst Hierarchy</h1>
        <p className="text-muted-foreground text-sm mt-1">Radial hierarchy view of the ecosystem by Investment List or Industry Segment, with a secondary grouping dimension.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
          <SunburstChart data={filtered} />
      )}
    </div>
  )
}

export default function SunburstPage() {
  return (
    <VizPageShell>
      <SunburstInner />
    </VizPageShell>
  )
}
