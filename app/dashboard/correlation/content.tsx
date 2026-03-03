"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { CorrelationMatrixChart } from "@/components/charts/correlation-matrix-chart"
import { Skeleton } from "@/components/ui/skeleton"

function CorrelationInner() {
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
        <h1 className="text-2xl font-bold">Correlation Matrix</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pearson correlation between all performance metrics — green = positive, red = negative. Hover any cell for details.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <CorrelationMatrixChart data={filtered} className="h-auto" />
        </>
      )}
    </div>
  )
}

export function CorrelationContent() {
  return (
    <FilterProvider>
      <CorrelationInner />
    </FilterProvider>
  )
}
