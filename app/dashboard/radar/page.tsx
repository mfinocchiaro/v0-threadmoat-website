"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { RadarChart } from "@/components/charts/radar-chart"
import { Skeleton } from "@/components/ui/skeleton"

function RadarInner() {
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
        <h1 className="text-2xl font-bold">Radar Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare companies across 6 performance dimensions: Market Opportunity, Team Execution, Tech Differentiation,
          Funding Efficiency, Growth Metrics, and Industry Impact.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <RadarChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function RadarPage() {
  return (
    <FilterProvider>
      <RadarInner />
    </FilterProvider>
  )
}
