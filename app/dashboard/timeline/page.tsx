"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { TimelineChart } from "@/components/charts/timeline-chart"
import { Skeleton } from "@/components/ui/skeleton"

function TimelineInner() {
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
        <h1 className="text-2xl font-bold">Founding Timeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Number of AI PLM startups founded per year. Click any bar to explore the companies founded that year.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <TimelineChart data={filtered} className="h-[600px]" />
        </>
      )}
    </div>
  )
}

export default function TimelinePage() {
  return (
    <FilterProvider>
      <TimelineInner />
    </FilterProvider>
  )
}
