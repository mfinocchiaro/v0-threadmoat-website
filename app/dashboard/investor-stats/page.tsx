"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { InvestorStatsChart } from "@/components/charts/investor-stats-chart"
import { InvestorExplorerChart } from "@/components/charts/investor-explorer-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function InvestorStatsInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()

  useEffect(() => {
    loadCompanyData().then((data) => {
      setCompanies(data)
      setIsLoading(false)
    })
  }, [])

  const filtered = companies.filter(filterCompany)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Investor Statistics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore investors, their portfolio companies, investment list coverage, and funding distribution.
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
    <FilterProvider>
      <InvestorStatsInner />
    </FilterProvider>
  )
}
