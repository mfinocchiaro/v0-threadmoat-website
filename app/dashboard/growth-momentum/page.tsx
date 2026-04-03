"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { GrowthMomentumChart } from "@/components/charts/growth-momentum-chart"
import { CellDrilldownDialog, CellDrilldownData } from "@/components/cell-drilldown-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function GrowthMomentumInner() {
  const { filtered, isLoading, shortlistedIds } = useThesisGatedData()
  const [drilldown, setDrilldown] = useState<CellDrilldownData | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Growth Momentum</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Startup growth trajectory across industries. Accelerating companies show strong recent
          funding and revenue signals; stalled companies have declining metrics.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <GrowthMomentumChart
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

export default function GrowthMomentumPage() {
  return (
    <VizPageShell>
      <GrowthMomentumInner />
    </VizPageShell>
  )
}
