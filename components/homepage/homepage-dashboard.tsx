"use client"

import dynamic from "next/dynamic"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NetworkGraph } from "@/components/charts/network-graph"
import { SunburstChart } from "@/components/charts/sunburst-chart"
import { BubbleChart } from "@/components/charts/bubble-chart"
import { QuadrantChart } from "@/components/charts/quadrant-chart"
import { TreemapChart } from "@/components/charts/treemap-chart"
import { PeriodicTable } from "@/components/charts/periodic-table"
import { BarChart } from "@/components/charts/bar-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FilterProvider } from "@/contexts/filter-context"

const MapChart = dynamic(
  () => import("@/components/charts/map-chart").then(m => m.MapChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full min-h-[450px] rounded-lg" /> }
)

const MAX_TABLE_ITEMS = 50

function ChartCard({ title, subtitle, children, className }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`relative overflow-hidden ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-3">{children}</CardContent>
    </Card>
  )
}

export function HomepageDashboard({ data }: { data: Company[] }) {
  const totalFunding = data.reduce((sum, c) => sum + (c.totalFunding || 0), 0)
  const countries = new Set(data.map(c => c.country).filter(Boolean)).size
  const investmentLists = new Set(data.map(c => c.investmentList).filter(Boolean)).size

  const tableData = data
    .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
    .slice(0, MAX_TABLE_ITEMS)

  return (
    <FilterProvider>
    <section className="border-t border-border/40 bg-muted/10" id="preview">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Live Market Intelligence</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Real-time analytics across {data.length} startups, {countries} countries,
            and {formatCurrency(totalFunding)} in tracked funding.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-primary">{data.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Startups Tracked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalFunding)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Funding</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-primary">{countries}</p>
              <p className="text-xs text-muted-foreground mt-1">Countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-primary">{investmentLists}</p>
              <p className="text-xs text-muted-foreground mt-1">Investment Domains</p>
            </CardContent>
          </Card>
        </div>

        {/* Row 1: Global Map */}
        <div className="mb-6">
          <ChartCard title="Global Startup Footprint" subtitle={`${data.length} companies across ${countries} countries`}>
            <MapChart data={data} className="h-[450px]" />
          </ChartCard>
        </div>

        {/* Row 2: Network + Sunburst */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Ecosystem Network" subtitle={`${data.length} companies`}>
            <NetworkGraph data={data} className="min-h-[420px]" />
          </ChartCard>
          <ChartCard title="Market Taxonomy" subtitle="Investment domains and subcategories">
            <SunburstChart data={data} className="min-h-[420px]" />
          </ChartCard>
        </div>

        {/* Row 3: Bubbles + Quadrant */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Funding Distribution" subtitle="Total funding by company">
            <BubbleChart data={data} className="h-[400px]" />
          </ChartCard>
          <ChartCard title="Competitive Positioning" subtitle="Technology vs market opportunity">
            <QuadrantChart data={data} className="h-[400px]" />
          </ChartCard>
        </div>

        {/* Row 4: Bar Chart + Treemap */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Startup Distribution" subtitle="Companies per investment domain">
            <BarChart data={data} className="h-[400px]" />
          </ChartCard>
          <ChartCard title="Market Segments" subtitle="Relative sizing by company count">
            <TreemapChart data={data} className="h-[400px]" />
          </ChartCard>
        </div>

        {/* Row 5: Periodic Table (capped) */}
        <div className="mb-6 relative">
          <ChartCard
            title="Enterprise Recon List"
            subtitle={`Showing top ${MAX_TABLE_ITEMS} of ${data.length} companies by weighted score`}
          >
            <PeriodicTable data={tableData} compact={true} />
          </ChartCard>
          {/* Fade overlay with CTA */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/80 to-transparent rounded-b-lg flex items-end justify-center pb-4">
            <Link href="/auth/login">
              <Button size="sm" variant="secondary" className="gap-2 shadow-lg">
                <Lock className="h-3.5 w-3.5" />
                Sign in to explore all {data.length} companies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
    </FilterProvider>
  )
}
