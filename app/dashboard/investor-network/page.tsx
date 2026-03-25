"use client"

import { useState } from "react"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { InvestorNetwork } from "@/components/charts/investor-network"
import { InvestorNetwork3D } from "@/components/charts/investor-network-3d"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Box, LayoutGrid } from "lucide-react"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"

function InvestorNetworkInner() {
  const [mode, setMode] = useState<"2d" | "3d">("2d")
  const { filtered } = useThesisGatedData()

  // Build a set of company names that pass the current filters
  const filteredNames = new Set(filtered.map(c => c.name))

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investor Network</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Which investors back the most startups in this space? Large nodes are investors sized by portfolio count — colored by type (VC Fund, Institutional, Individual). Small nodes are startups colored by investment category.
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


      {mode === "2d" ? (
        <InvestorNetwork className="h-[700px]" filteredCompanyNames={filteredNames} />
      ) : (
        <InvestorNetwork3D className="h-[700px] rounded-xl border border-border" filteredCompanyNames={filteredNames} />
      )}
    </div>
  )
}

export default function InvestorNetworkPage() {
  return (
    <VizPageShell>
      <InvestorNetworkInner />
    </VizPageShell>
  )
}
