"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { SankeyChart } from "@/components/charts/sankey-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SankeyInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Flow Diagram</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Follow the flow of AI-PLM startups through lifecycle stages, funding levels, and market impact tiers.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <SankeyChart data={filtered} className="h-[640px]" />
      )}
    </div>
  )
}

export default function SankeyPage() {
  return (
    <VizPageShell>
      <SankeyInner />
    </VizPageShell>
  )
}
