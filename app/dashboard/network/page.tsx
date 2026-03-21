"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle"
import { Skeleton } from "@/components/ui/skeleton"

function NetworkInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Startup Ecosystem</h1>
        <p className="text-muted-foreground text-sm mt-1">Force-directed graph showing relationships between startups, manufacturing types, industries, and countries. Drag nodes to explore.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <NetworkGraphToggle data={filtered} />
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
