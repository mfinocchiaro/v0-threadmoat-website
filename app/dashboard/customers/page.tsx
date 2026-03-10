"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizFilterBar } from "@/components/viz-filter-bar"
import { CustomerNetwork } from "@/components/charts/customer-network"
import { CustomerNetwork3D } from "@/components/charts/customer-network-3d"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Box, LayoutGrid } from "lucide-react"

function CustomersInner() {
  const { companies, filtered, isLoading } = useThesisGatedData()
  const [mode, setMode] = useState<"2d" | "3d">("2d")

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Network</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Which enterprise customers appear across multiple startups? Large nodes are customers sized by how many startups serve them. Small nodes are startups colored by investment category.
          </p>
        </div>
        <ToggleGroup type="single" value={mode} onValueChange={v => v && setMode(v as "2d" | "3d")} className="shrink-0">
          <ToggleGroupItem value="2d" aria-label="2D view" className="gap-1.5 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
            2D
          </ToggleGroupItem>
          <ToggleGroupItem value="3d" aria-label="3D view" className="gap-1.5 text-xs">
            <Box className="h-3.5 w-3.5" />
            3D
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isLoading ? (
        <Skeleton className="h-[700px] rounded-xl" />
      ) : (
        <>
          {mode === "2d" && <VizFilterBar companies={companies} />}
          {mode === "2d" ? (
            <CustomerNetwork data={filtered} className="h-[700px]" />
          ) : (
            <CustomerNetwork3D data={filtered} className="h-[700px] rounded-xl border border-border" />
          )}
        </>
      )}
    </div>
  )
}

export default function CustomersPage() {
  return (
    <VizPageShell>
      <CustomersInner />
    </VizPageShell>
  )
}
