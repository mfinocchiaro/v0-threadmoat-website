"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { TimelineChart } from "@/components/charts/timeline-chart"
import { Skeleton } from "@/components/ui/skeleton"

function TimelineInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Founding Timeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Number of AI PLM startups founded per year. Click any bar to explore the companies founded that year.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <TimelineChart data={filtered} className="h-[600px]" />
      )}
    </div>
  )
}

export default function TimelinePage() {
  return (
    <VizPageShell>
      <TimelineInner />
    </VizPageShell>
  )
}
