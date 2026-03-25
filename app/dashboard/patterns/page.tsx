"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { PatternsChart } from "@/components/charts/patterns-chart"
import { Skeleton } from "@/components/ui/skeleton"

function PatternsInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Patterns</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Investment list × funding stage density. Cell color intensity = number of companies at each intersection.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <PatternsChart companies={filtered} className="w-full" />
      )}
    </div>
  )
}

export default function PatternsPage() {
  return (
    <VizPageShell>
      <PatternsInner />
    </VizPageShell>
  )
}
