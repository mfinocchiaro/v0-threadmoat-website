"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { ChartCard } from "@/components/dashboard/chart-card"
import { Skeleton } from "@/components/ui/skeleton"
import { NetworkGraphToggle } from "@/components/charts/network-graph-toggle"
import { SankeyChart } from "@/components/charts/sankey-chart"
import { ChordChart } from "@/components/charts/chord-chart"
import { Network, Users, GitBranch, Wind, Link2 } from "lucide-react"
import dynamic from "next/dynamic"

const CustomerNetwork = dynamic(
  () => import("@/components/charts/customer-network").then(m => m.CustomerNetwork),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

const InvestorNetwork = dynamic(
  () => import("@/components/charts/investor-network").then(m => m.InvestorNetwork),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
)

function NetworkInner() {
  const { filtered, isLoading } = useThesisGatedData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Network & Relationships</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ecosystem connections, investor flows, and customer relationships — {filtered.length} companies
        </p>
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Startup Ecosystem"
          subtitle="Force-directed ecosystem map"
          href="/dashboard/network"
          icon={Network}
          chartHeight="h-[400px]"
        >
          <NetworkGraphToggle data={filtered} className="h-full" preview />
        </ChartCard>

        <ChartCard
          title="Customer Network"
          subtitle="Enterprise customer connections"
          href="/dashboard/customers"
          icon={Users}
          chartHeight="h-[400px]"
        >
          <CustomerNetwork data={filtered} className="h-full" />
        </ChartCard>

        <ChartCard
          title="Investor Network"
          subtitle="VC portfolio overlaps"
          href="/dashboard/investor-network"
          icon={GitBranch}
          chartHeight="h-[400px]"
        >
          <InvestorNetwork className="h-full" />
        </ChartCard>

        <ChartCard
          title="Sankey Flow"
          subtitle="Category-to-funding flows"
          href="/dashboard/sankey"
          icon={Wind}
          chartHeight="h-[400px]"
        >
          <SankeyChart data={filtered} className="h-full" />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Chord Diagram"
          subtitle="Cross-category relationships"
          href="/dashboard/chord"
          icon={Link2}
        >
          <ChordChart data={filtered} className="h-full" />
        </ChartCard>
      </div>
    </div>
  )
}

export default function NetworkTabPage() {
  return (
    <VizPageShell>
      <NetworkInner />
    </VizPageShell>
  )
}
