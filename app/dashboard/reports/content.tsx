"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { ReportGenerator } from "@/components/charts/report-generator"
import { Skeleton } from "@/components/ui/skeleton"

function ReportsInner() {
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
        <h1 className="text-2xl font-bold">Report Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search companies and generate detailed IC-memo style investment reports with score breakdowns, strengths, and weaknesses.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <ReportGenerator data={filtered} className="w-full" />
        </>
      )}
    </div>
  )
}

export function ReportsContent() {
  return (
    <FilterProvider>
      <ReportsInner />
    </FilterProvider>
  )
}
