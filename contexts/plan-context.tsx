"use client"

import { createContext, useContext, ReactNode } from "react"

interface PlanContextValue {
  isFreeUser: boolean
}

const PlanContext = createContext<PlanContextValue>({ isFreeUser: false })

export function PlanProvider({ isFreeUser, children }: { isFreeUser: boolean; children: ReactNode }) {
  return <PlanContext.Provider value={{ isFreeUser }}>{children}</PlanContext.Provider>
}

export function usePlan() {
  return useContext(PlanContext)
}
