"use client"

import { useEffect, useState } from "react"
import { Company, loadCompanyData } from "@/lib/company-data"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { MapChart } from "@/components/charts/map-chart"
import { GlobeChart } from "@/components/charts/globe-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Map, Globe } from "lucide-react"

function MapInner() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"2d" | "3d">("2d")
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Geography Map</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === "2d"
              ? "Startup hubs on a world map — click a bubble to explore companies in that region."
              : "3D interactive globe — points scaled by funding, colored by category."}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={view === "2d" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => setView("2d")}
          >
            <Map className="h-4 w-4" /> 2D Map
          </Button>
          <Button
            variant={view === "3d" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => setView("3d")}
          >
            <Globe className="h-4 w-4" /> 3D Globe
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <>
          <VizFilterBar companies={companies} />
          {view === "2d" ? (
            <MapChart data={filtered} className="h-[600px]" />
          ) : (
            <div className="h-[600px] rounded-xl overflow-hidden border border-border bg-black">
              <GlobeChart data={filtered} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <FilterProvider>
      <MapInner />
    </FilterProvider>
  )
}
