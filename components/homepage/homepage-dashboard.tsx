"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { Company, formatCurrency } from "@/lib/company-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NetworkGraph } from "@/components/charts/network-graph"
import { SunburstChart } from "@/components/charts/sunburst-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FilterProvider } from "@/contexts/filter-context"

const GlobeChart = dynamic(
  () => import("@/components/charts/globe-chart").then(m => m.GlobeChart),
  { ssr: false, loading: () => <Skeleton className="w-full h-full min-h-[450px] rounded-lg" /> }
)

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

        {/* Network Graph — preview mode: no controls, no drill-down */}
        <div className="mb-6">
          <ChartCard title="Ecosystem Network" subtitle={`${data.length} companies across ${investmentLists} investment domains`}>
            <NetworkGraph data={data} className="h-[450px]" preview />
          </ChartCard>
        </div>

        {/* 3D Globe */}
        <div className="mb-6">
          <ChartCard title="Global Startup Footprint" subtitle={`${data.length} companies across ${countries} countries`}>
            <div className="h-[500px] rounded-lg overflow-hidden bg-black">
              <GlobeChart data={data} />
            </div>
          </ChartCard>
        </div>

        {/* Sunburst — preview mode: no controls, max 5 names per slice */}
        <div className="mb-6">
          <ChartCard title="Ecosystem Structure" subtitle="Investment domains by funding round">
            <SunburstChart data={data} className="h-[650px]" preview />
          </ChartCard>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/auth/login">
            <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
              <Lock className="h-4 w-4" />
              Sign in to unlock full analytics on all {data.length} companies
            </Button>
          </Link>
        </div>
      </div>
    </section>
    </FilterProvider>
  )
}
