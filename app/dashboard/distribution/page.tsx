"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { Skeleton } from "@/components/ui/skeleton"

function DistributionInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Funding Distribution</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Box plot of funding distribution by investment category. Click any box to explore the companies within that
          category.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <DistributionChart data={filtered} className="h-[600px]" />
        </>
      )}
    </div>
  )
}

export default function DistributionPage() {
  return (
    <VizPageShell>
      <DistributionInner />
    </VizPageShell>
  )
}
