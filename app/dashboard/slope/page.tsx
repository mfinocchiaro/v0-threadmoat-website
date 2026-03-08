"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SlopeChart } from "@/components/charts/slope-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SlopeInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Slope Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare two metrics side by side across the top companies. Each line connects a company&apos;s left-axis value
          to its right-axis value. Hover to highlight individual companies.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SlopeChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function SlopePage() {
  return (
    <VizPageShell>
      <SlopeInner />
    </VizPageShell>
  )
}
