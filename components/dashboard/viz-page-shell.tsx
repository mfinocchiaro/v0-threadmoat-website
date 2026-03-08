"use client"

import { ReactNode } from "react"
import { FilterProvider } from "@/contexts/filter-context"
import { ThesisProvider } from "@/contexts/thesis-context"
import { useScenarioOptional } from "@/contexts/scenario-context"

function VizShellInner({ children }: { children: ReactNode }) {
  const ctx = useScenarioOptional()
  return (
    <ThesisProvider profileType={ctx?.scenario}>
      {children}
    </ThesisProvider>
  )
}

export function VizPageShell({ children }: { children: ReactNode }) {
  return (
    <FilterProvider>
      <VizShellInner>{children}</VizShellInner>
    </FilterProvider>
  )
}
