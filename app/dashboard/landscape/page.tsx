"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { LandscapeChart } from "@/components/charts/landscape-chart"
import { Skeleton } from "@/components/ui/skeleton"

function LandscapeInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()

  useEffect(() => {
    loadCompanyData().then(data => {
      setCompanies(data)
      setIsLoading(false)
    })
  }, [])

  const filtered = companies.filter(filterCompany)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Market Landscape</h1>
        <p className="text-muted-foreground text-sm mt-1">Companies grouped by investment category and subsegment — hover to zoom, click to view details.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <LandscapeChart data={filtered} />
        </>
      )}
    </div>
  )
}

export default function LandscapePage() {
  return (
    <FilterProvider>
      <LandscapeInner />
    </FilterProvider>
  )
}
