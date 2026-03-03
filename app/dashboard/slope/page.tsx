"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { SlopeChart } from "@/components/charts/slope-chart"
import { Skeleton } from "@/components/ui/skeleton"

function SlopeInner() {
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
        <h1 className="text-2xl font-bold">Slope Chart</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare two metrics side by side across the top companies. Each line connects a company&apos;s left-axis value
          to its right-axis value. Hover to highlight individual companies.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <SlopeChart data={filtered} className="h-[640px]" />
        </>
      )}
    </div>
  )
}

export default function SlopePage() {
  return (
    <FilterProvider>
      <SlopeInner />
    </FilterProvider>
  )
}
