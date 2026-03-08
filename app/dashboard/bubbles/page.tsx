"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { BubbleChart } from "@/components/charts/bubble-chart"
import { Skeleton } from "@/components/ui/skeleton"

function BubblesInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bubble Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">Plot any two metrics as X/Y axes with a third dimension controlling bubble size.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <div className="w-full" style={{ aspectRatio: "1 / 1", maxHeight: "85vh" }}>
            <BubbleChart data={filtered} className="h-full" />
          </div>
        </>
      )}
    </div>
  )
}

export default function BubblesPage() {
  return (
    <VizPageShell>
      <BubblesInner />
    </VizPageShell>
  )
}
