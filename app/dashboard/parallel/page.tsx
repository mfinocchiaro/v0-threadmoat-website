"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { ParallelCoordsChart } from "@/components/charts/parallel-coords-chart"
import { Skeleton } from "@/components/ui/skeleton"

function ParallelInner() {
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
        <h1 className="text-2xl font-bold">Parallel Coordinates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Multi-dimensional company analysis. Drag vertically on any axis to filter companies. Click an axis label to
          clear its filter.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <ParallelCoordsChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function ParallelPage() {
  return (
    <FilterProvider>
      <ParallelInner />
    </FilterProvider>
  )
}
