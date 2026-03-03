"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SankeyChart } from "@/components/charts/sankey-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SankeyInner() {
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
        <h1 className="text-2xl font-bold">Flow Diagram</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Follow the flow of AI-PLM startups through lifecycle stages, funding levels, and market impact tiers.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SankeyChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function SankeyPage() {
  return (
    <FilterProvider>
      <SankeyInner />
    </FilterProvider>
  )
}
