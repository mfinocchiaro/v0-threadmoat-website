"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { TreemapChart } from "@/components/charts/treemap-chart"
import { Skeleton } from "@/components/ui/skeleton"

function TreemapInner() {
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
        <h1 className="text-2xl font-bold">Segment Treemap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hierarchical view of startups by investment category and subcategory. Click a group to drill down.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <TreemapChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function TreemapPage() {
  return (
    <FilterProvider>
      <TreemapInner />
    </FilterProvider>
  )
}
