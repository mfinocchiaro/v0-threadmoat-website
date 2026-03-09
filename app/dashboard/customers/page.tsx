"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { CustomerNetwork } from "@/components/charts/customer-network"
import { Skeleton } from "@/components/ui/skeleton"

function CustomersInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customer Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Which enterprise customers appear across multiple startups? Large nodes are customers sized by how many startups serve them. Small nodes are startups colored by investment category.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[700px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <CustomerNetwork data={filtered} className="h-[700px]" />
        </>
      )}
    </div>
  )
}

export default function CustomersPage() {
  return (
    <VizPageShell>
      <CustomersInner />
    </VizPageShell>
  )
}
