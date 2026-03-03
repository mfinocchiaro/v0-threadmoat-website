"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { NetworkGraph } from "@/components/charts/network-graph"
import { Skeleton } from "@/components/ui/skeleton"

function NetworkInner() {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Network Graph</h1>
        <p className="text-muted-foreground text-sm mt-1">Force-directed graph showing relationships between companies, manufacturing types, industries, and countries. Drag nodes to explore.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[calc(100vh-12rem)] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          <NetworkGraph data={filtered} />
        </>
      )}
    </div>
  )
}

export default function NetworkPage() {
  return (
    <FilterProvider>
      <NetworkInner />
    </FilterProvider>
  )
}
