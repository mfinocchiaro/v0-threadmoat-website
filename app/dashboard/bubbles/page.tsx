"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { BubbleChart } from "@/components/charts/bubble-chart"
import { Skeleton } from "@/components/ui/skeleton"

function BubblesInner() {
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
        <h1 className="text-2xl font-bold">Bubble Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">Plot any two metrics as X/Y axes with a third dimension controlling bubble size.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <div className="w-full" style={{ aspectRatio: "1 / 1", maxHeight: "85vh" }}>
            <BubbleChart data={filtered} className="h-full" />
          </div>
        </>
      )}
    </div>
  )
}

export default function BubblesPage() {
  return (
    <FilterProvider>
      <BubblesInner />
    </FilterProvider>
  )
}
