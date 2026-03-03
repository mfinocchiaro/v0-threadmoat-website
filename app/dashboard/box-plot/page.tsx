"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { BoxPlotChart } from "@/components/charts/box-plot-chart"
import { Skeleton } from "@/components/ui/skeleton"

function BoxPlotInner() {
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
        <h1 className="text-2xl font-bold">Box Plot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Statistical distribution of metrics across categories. Shows median, quartiles, and outliers for each group.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <BoxPlotChart data={filtered} className="h-[600px]" />
        </>
      )}
    </div>
  )
}

export default function BoxPlotPage() {
  return (
    <FilterProvider>
      <BoxPlotInner />
    </FilterProvider>
  )
}
