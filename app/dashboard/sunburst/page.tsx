"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SunburstChart } from "@/components/charts/sunburst-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SunburstInner() {
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
        <h1 className="text-2xl font-bold">Sunburst Hierarchy</h1>
        <p className="text-muted-foreground text-sm mt-1">Radial hierarchy view of the ecosystem by Investment List or Industry Segment, with a secondary grouping dimension.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SunburstChart data={filtered} />
        </>
      )}
    </div>
  )
}

export default function SunburstPage() {
  return (
    <FilterProvider>
      <SunburstInner />
    </FilterProvider>
  )
}
