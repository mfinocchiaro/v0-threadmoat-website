"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { ChartCard } from "@/components/dashboard/chart-card"
import { Skeleton } from "@/components/ui/skeleton"
import { QuadrantChart } from "@/components/charts/quadrant-chart"
import { BubbleChart } from "@/components/charts/bubble-chart"
import { PeriodicTable } from "@/components/charts/periodic-table"
import { Compass, GitBranch, Circle, Table2, LayoutGrid, GitCompare } from "lucide-react"
import dynamic from "next/dynamic"

const LandscapeChart = dynamic(
  () => import("@/components/charts/landscape-chart").then(m => m.LandscapeChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

function MarketInner() {
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
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Competitive positioning, landscape mapping, and market structure — {filtered.length} companies
        </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Magic Quadrant"
          subtitle="Competitive positioning matrix"
          href="/dashboard/quadrant"
          icon={GitBranch}
        >
          <QuadrantChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Bubble Chart"
          subtitle="Multi-dimensional comparison"
          href="/dashboard/bubbles"
          icon={Circle}
        >
          <BubbleChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Periodic Table"
          subtitle="Investment domain master list"
          href="/dashboard/periodic-table"
          icon={Table2}
        >
          <PeriodicTable data={filtered} compact preview />
        </ChartCard>

        <ChartCard
          title="Landscape"
          subtitle="Domain tile cards"
          href="/dashboard/landscape"
          icon={LayoutGrid}
        >
          <LandscapeChart data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Investment Landscape"
          subtitle="10 investment domains"
          href="/dashboard/landscape-intro"
          icon={Compass}
          chartHeight="h-[300px]"
        >
          <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
            <div className="text-center">
              <Compass className="size-10 text-primary/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Interactive domain explorer</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{filtered.length} companies across 10 domains</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Compare"
          subtitle="Side-by-side company analysis"
          href="/dashboard/compare"
          icon={GitCompare}
          chartHeight="h-[300px]"
        >
          <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
            <div className="text-center">
              <GitCompare className="size-10 text-primary/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Compare up to 5 companies</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tags, scores, financials</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export default function MarketTabPage() {
  return (
    <VizPageShell>
      <MarketInner />
    </VizPageShell>
  )
}
