"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { IndustryPenetrationChart } from "@/components/charts/industry-penetration-chart"
import { CellDrilldownDialog, CellDrilldownData } from "@/components/cell-drilldown-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function IndustryPenetrationInner() {
  const { filtered, isLoading, shortlistedIds } = useThesisGatedData()
  const [drilldown, setDrilldown] = useState<CellDrilldownData | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Industry Penetration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How many startups target each industry, cross-referenced by investment thesis, workflow segment, or manufacturing type.
          Hotspots reveal crowded markets; white spaces signal opportunity gaps.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <IndustryPenetrationChart
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

export default function IndustryPenetrationPage() {
  return (
    <VizPageShell>
      <IndustryPenetrationInner />
    </VizPageShell>
  )
}
