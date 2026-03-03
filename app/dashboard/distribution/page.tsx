"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { Skeleton } from "@/components/ui/skeleton"

function DistributionInner() {
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
        <h1 className="text-2xl font-bold">Funding Distribution</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Box plot of funding distribution by investment category. Click any box to explore the companies within that
          category.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <DistributionChart data={filtered} className="h-[600px]" />
        </>
      )}
    </div>
  )
}

export default function DistributionPage() {
  return (
    <FilterProvider>
      <DistributionInner />
    </FilterProvider>
  )
}
