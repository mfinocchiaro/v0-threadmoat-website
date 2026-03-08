"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { TreemapChart } from "@/components/charts/treemap-chart"
import { Skeleton } from "@/components/ui/skeleton"

function TreemapInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Segment Treemap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hierarchical view of startups by investment category and subcategory. Click a group to drill down.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <TreemapChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function TreemapPage() {
  return (
    <VizPageShell>
      <TreemapInner />
    </VizPageShell>
  )
}
