"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { SwotChart } from "@/components/charts/swot-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SwotInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">SWOT Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Derived Strengths, Weaknesses, Opportunities, and Threats for each startup — auto-generated from
          scoring data, financial signals, and competitive positioning within each investment segment.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
          <SwotChart data={filtered} className="min-h-[640px]" />
      )}
    </div>
  )
}

export function SwotContent() {
  return (
    <VizPageShell>
      <SwotInner />
    </VizPageShell>
  )
}
