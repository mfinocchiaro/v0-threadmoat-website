"use client"

import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { InvestorStatsChart } from "@/components/charts/investor-stats-chart"
import { InvestorExplorerChart } from "@/components/charts/investor-explorer-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function InvestorStatsInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Investor Statistics</h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Founders Only</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Explore investors, their portfolio companies, investment list coverage, and funding distribution. Bootstrapped, angel funded, and undisclosed investors are excluded.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <Tabs defaultValue="explorer" className="w-full">
            <TabsList>
              <TabsTrigger value="explorer">Investor Explorer</TabsTrigger>
              <TabsTrigger value="charts">Funding Charts</TabsTrigger>
            </TabsList>
            <TabsContent value="explorer" className="mt-4">
              <InvestorExplorerChart data={filtered} className="w-full" />
            </TabsContent>
            <TabsContent value="charts" className="mt-4">
              <InvestorStatsChart data={filtered} className="w-full" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default function InvestorStatsPage() {
  return (
    <VizPageShell>
      <InvestorStatsInner />
    </VizPageShell>
  )
}
