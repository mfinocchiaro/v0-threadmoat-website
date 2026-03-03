"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SplomChart } from "@/components/charts/splom-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SplomInner() {
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
        <h1 className="text-2xl font-bold">Scatter Plot Matrix</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pairwise relationships between all key metrics — diagonal shows distributions, off-diagonal shows correlations. Click any dot for company details.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[760px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SplomChart data={filtered} className="h-[760px]" />
        </>
      )}
    </div>
  )
}

export default function SplomPage() {
  return (
    <FilterProvider>
      <SplomInner />
    </FilterProvider>
  )
}
