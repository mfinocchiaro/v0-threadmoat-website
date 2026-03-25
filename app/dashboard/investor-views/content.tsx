"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { InvestorViewsChart } from "@/components/charts/investor-views-chart"
import { Skeleton } from "@/components/ui/skeleton"

function InvestorViewsInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Investor Views Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          10 pre-built investment intelligence views — ask the data natural language questions or click any view to explore filtered company sets.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <InvestorViewsChart data={filtered} className="w-full" />
      )}
    </div>
  )
}

export function InvestorViewsContent() {
  return (
    <VizPageShell>
      <InvestorViewsInner />
    </VizPageShell>
  )
}
