"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { QuadrantChart } from "@/components/charts/quadrant-chart"
import { Skeleton } from "@/components/ui/skeleton"

function QuadrantInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Magic Quadrant</h1>
        <p className="text-muted-foreground text-sm mt-1">Position companies across Visionaries, Leaders, Niche Players, and Challengers. Zoom to explore, drag to pan.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <QuadrantChart data={filtered} />
        </>
      )}
    </div>
  )
}

export default function QuadrantPage() {
  return (
    <VizPageShell>
      <QuadrantInner />
    </VizPageShell>
  )
}
