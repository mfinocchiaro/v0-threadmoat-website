"use client"

import { useMemo } from "react"
import { useThesisGatedData } from "@/hooks/use-thesis-gated-data"
import { VizPageShell } from "@/components/dashboard/viz-page-shell"
import { CandlestickChart } from "@/components/charts/candlestick-chart"
import { Skeleton } from "@/components/ui/skeleton"

function CandlestickInner() {
  const { filtered, isLoading } = useThesisGatedData()

  const filteredNames = useMemo(() => {
    return new Set(filtered.map((c) => c.name))
  }, [filtered])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Valuation Candlestick</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stock-ticker style visualization of startup valuation ranges. Each candlestick shows the spread
          between Funding Floor, ARR-based Valuation, Final Estimate, and Market Value — colored by
          Financial Confidence (green = strong, amber = medium, red = low). Toggle to Revenue vs Burn
          view for runway analysis.
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-[640px] rounded-xl" />
      ) : (
          <CandlestickChart className="min-h-[600px]" filteredCompanyNames={filteredNames} />
      )}
    </div>
  )
}

export function CandlestickContent() {
  return (
    <VizPageShell>
      <CandlestickInner />
    </VizPageShell>
  )
}
