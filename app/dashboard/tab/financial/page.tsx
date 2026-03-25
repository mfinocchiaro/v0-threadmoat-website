"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { ChartCard } from "@/components/dashboard/chart-card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart } from "@/components/charts/bar-chart"
import { TreemapChart } from "@/components/charts/treemap-chart"
import { MarimekkoChart } from "@/components/charts/marimekko-chart"
import { TimelineChart } from "@/components/charts/timeline-chart"
import { BarChart2, TreePine, BarChart3, Clock, TrendingUp, GridIcon } from "lucide-react"
import dynamic from "next/dynamic"

const SpiralTimelineChart = dynamic(
  () => import("@/components/charts/spiral-timeline-chart").then(m => m.SpiralTimelineChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

const PatternsChart = dynamic(
  () => import("@/components/charts/patterns-chart").then(m => m.PatternsChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

function FinancialInner() {
  const { filtered, isLoading } = useThesisGatedData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financial Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Funding flows, revenue patterns, and financial structure — {filtered.length} companies
        </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Bar Chart"
          subtitle="Funding & headcount breakdown"
          href="/dashboard/bar-chart"
          icon={BarChart2}
        >
          <BarChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Treemap"
          subtitle="Hierarchical funding view"
          href="/dashboard/treemap"
          icon={TreePine}
        >
          <TreemapChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Marimekko"
          subtitle="Two-dimensional market structure"
          href="/dashboard/marimekko"
          icon={BarChart3}
        >
          <MarimekkoChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Timeline"
          subtitle="Founding year distribution"
          href="/dashboard/timeline"
          icon={Clock}
        >
          <TimelineChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Spiral Timeline"
          subtitle="Cyclical time-based view"
          href="/dashboard/spiral"
          icon={TrendingUp}
        >
          <SpiralTimelineChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Patterns"
          subtitle="Recurring data signatures"
          href="/dashboard/patterns"
          icon={GridIcon}
        >
          <PatternsChart companies={filtered} className="h-full" />
        </ChartCard>
      </div>
    </div>
  )
}

export default function FinancialTabPage() {
  return (
    <VizPageShell>
      <FinancialInner />
    </VizPageShell>
  )
}
