"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { PeriodicTable } from "@/components/charts/periodic-table"
import { Skeleton } from "@/components/ui/skeleton"

function PeriodicTableInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filterCompany } = useFilter()

  useEffect(() => {
    loadCompanyData().then(data => {
      setCompanies(data)
      setIsLoading(false)
    })
  }, [])

  const filtered = companies.filter(filterCompany)

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 50 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <PeriodicTable data={filtered} />
    </div>
  )
}

export default function PeriodicTablePage() {
  return (
    <FilterProvider>
      <PeriodicTableInner />
    </FilterProvider>
  )
}
