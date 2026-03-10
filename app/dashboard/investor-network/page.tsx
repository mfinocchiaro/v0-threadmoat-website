"use client"

import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { InvestorNetwork } from "@/components/charts/investor-network"

function InvestorNetworkInner() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Investor Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Which investors back the most startups in this space? Large nodes are investors sized by portfolio count — colored by type (VC Fund, Institutional, Individual). Small nodes are startups colored by investment category.
        </p>
      </div>
      <InvestorNetwork className="h-[700px]" />
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
