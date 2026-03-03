"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SpiralTimelineChart } from "@/components/charts/spiral-timeline-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SpiralInner() {
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
        <h1 className="text-2xl font-bold">Spiral Timeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Companies plotted along a spiral by founding year — center is earliest, outer edge is most recent. Click any dot for details.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[680px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SpiralTimelineChart data={filtered} className="w-full" />
        </>
      )}
    </div>
  )
}

export default function SpiralPage() {
  return (
    <FilterProvider>
      <SpiralInner />
    </FilterProvider>
  )
}
