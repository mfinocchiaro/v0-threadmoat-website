"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { WordcloudChart } from "@/components/charts/wordcloud-chart"
import { Skeleton } from "@/components/ui/skeleton"

function WordcloudInner() {
  const { filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Word Cloud</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tag frequency visualization — larger words appear in more companies.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
          <WordcloudChart data={filtered} className="h-[640px]" />
      )}
    </div>
  )
}

export default function WordcloudPage() {
  return (
    <VizPageShell>
      <WordcloudInner />
    </VizPageShell>
  )
}
