"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { ChartCard } from "@/components/dashboard/chart-card"
import { Skeleton } from "@/components/ui/skeleton"
import { SunburstChart } from "@/components/charts/sunburst-chart"
import { Map as MapIcon, Sun } from "lucide-react"
import dynamic from "next/dynamic"

const MapChart = dynamic(
  () => import("@/components/charts/map-chart").then(m => m.MapChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

function GeographicInner() {
  const { filtered, isLoading } = useThesisGatedData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[460px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Geographic Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Global distribution and regional breakdown — {filtered.length} companies
        </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Geography Map"
          subtitle="Startup hubs worldwide"
          href="/dashboard/map"
          icon={MapIcon}
          chartHeight="h-[400px]"
        >
          <MapChart data={filtered} className="h-full" preview />
        </ChartCard>

        <ChartCard
          title="Sunburst"
          subtitle="Hierarchical breakdown by region"
          href="/dashboard/sunburst"
          icon={Sun}
          chartHeight="h-[400px]"
        >
          <SunburstChart data={filtered} className="h-full" preview />
        </ChartCard>
      </div>
    </div>
  )
}

export default function GeographicTabPage() {
  return (
    <VizPageShell>
      <GeographicInner />
    </VizPageShell>
  )
}
