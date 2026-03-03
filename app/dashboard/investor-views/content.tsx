"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { InvestorViewsChart } from "@/components/charts/investor-views-chart"
import { Skeleton } from "@/components/ui/skeleton"

function InvestorViewsInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()

  useEffect(() => {
    loadCompanyData().then((data) => { setCompanies(data); setIsLoading(false) })
  }, [])

  const filtered = companies.filter(filterCompany)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Investor Views Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          10 pre-built investment intelligence views — ask the data natural language questions or click any view to explore filtered company sets.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <InvestorViewsChart data={filtered} className="w-full" />
        </>
      )}
    </div>
  )
}

export function InvestorViewsContent() {
  return (
    <FilterProvider>
      <InvestorViewsInner />
    </FilterProvider>
  )
}
