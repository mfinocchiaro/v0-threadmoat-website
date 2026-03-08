"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { NetworkGraph } from "@/components/charts/network-graph"
import { Skeleton } from "@/components/ui/skeleton"

function NetworkInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Network Graph</h1>
        <p className="text-muted-foreground text-sm mt-1">Force-directed graph showing relationships between companies, manufacturing types, industries, and countries. Drag nodes to explore.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <NetworkGraph data={filtered} />
        </>
      )}
    </div>
  )
}

export default function NetworkPage() {
  return (
    <VizPageShell>
      <NetworkInner />
    </VizPageShell>
  )
}
