"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { MarketMomentumHeatmap } from "@/components/charts/market-momentum-heatmap"
import { CellDrilldownDialog, CellDrilldownData } from "@/components/cell-drilldown-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function MarketMomentumInner() {
  const { filtered, isLoading, shortlistedIds } = useThesisGatedData()
  const [drilldown, setDrilldown] = useState<CellDrilldownData | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Market Momentum</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Composite momentum intensity across startups — blending growth metrics, customer signal
          scores, and momentum multipliers into a single heatmap view.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <MarketMomentumHeatmap
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

export default function MarketMomentumPage() {
  return (
    <VizPageShell>
      <MarketMomentumInner />
    </VizPageShell>
  )
}
