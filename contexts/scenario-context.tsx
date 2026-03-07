"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

interface ScenarioContextType {
  scenario: string | undefined
  setScenario: (key: string) => void
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined)

export function ScenarioProvider({ children, initialScenario }: { children: ReactNode; initialScenario?: string }) {
  const [scenario, setScenarioState] = useState<string | undefined>(initialScenario)

  const setScenario = useCallback((key: string) => {
    setScenarioState(key)
    // Persist to DB
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_type: key }),
    }).catch(() => {})
  }, [])

  return (
    <ScenarioContext.Provider value={{ scenario, setScenario }}>
      {children}
    </ScenarioContext.Provider>
  )
}

export function useScenario() {
  const ctx = useContext(ScenarioContext)
  if (!ctx) throw new Error("useScenario must be used within ScenarioProvider")
  return ctx
}

export function useScenarioOptional() {
  return useContext(ScenarioContext) ?? null
}
