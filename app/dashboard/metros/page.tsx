"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { MetroChart } from "@/components/charts/metro-chart"
import { Skeleton } from "@/components/ui/skeleton"

function MetrosInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Metro Areas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Startup concentration by metropolitan area — cities grouped into regional hubs.
          Sort by company count or total funding. Filter by region.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <MetroChart data={filtered} />
      )}
    </div>
  )
}

export default function MetrosPage() {
  return (
    <VizPageShell>
      <MetrosInner />
    </VizPageShell>
  )
}
