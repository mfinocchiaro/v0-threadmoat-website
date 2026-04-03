"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { TargetCustomerProfileChart } from "@/components/charts/target-customer-profile-chart"
import { CellDrilldownDialog, CellDrilldownData } from "@/components/cell-drilldown-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function CustomerProfileInner() {
  const { filtered, isLoading, shortlistedIds } = useThesisGatedData()
  const [drilldown, setDrilldown] = useState<CellDrilldownData | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Target Customer Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Multi-dimensional heatmap profiling each startup&apos;s typical target customer across buyer persona,
          company size, geography, and deployment model — cross-referenced by industry, thesis, workflow, or
          manufacturing type. Reveals which customer segments attract the most startup activity.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <TargetCustomerProfileChart
            data={filtered}
            shortlistedIds={shortlistedIds}
            className="min-h-[500px]"
            onCellClick={(label, companyIds) => setDrilldown({ label, companyIds })}
          />
          <CellDrilldownDialog
            cell={drilldown}
            allData={filtered}
            open={!!drilldown}
            onOpenChange={(open) => { if (!open) setDrilldown(null) }}
          />
        </>
      )}
    </div>
  )
}

export default function CustomerProfilePage() {
  return (
    <VizPageShell>
      <CustomerProfileInner />
    </VizPageShell>
  )
}
