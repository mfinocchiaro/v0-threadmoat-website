"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { IPDependencyChart } from "@/components/charts/ip-dependency-chart"
import { CellDrilldownDialog, CellDrilldownData } from "@/components/cell-drilldown-dialog"
import { Skeleton } from "@/components/ui/skeleton"

function IPDependencyInner() {
  const { filtered, isLoading, shortlistedIds } = useThesisGatedData()
  const [drilldown, setDrilldown] = useState<CellDrilldownData | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">IP Dependency Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How exposed are startups to third-party platform risk? Explore IP risk tiers and vendor dependencies across
          deployment models, investment theses, and workflow segments.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <IPDependencyChart
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

export default function IPDependencyPage() {
  return (
    <VizPageShell>
      <IPDependencyInner />
    </VizPageShell>
  )
}
