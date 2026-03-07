"use client"

import { ReactNode } from "react"
import type { Session } from "next-auth"
import { ScenarioProvider, useScenario } from "@/contexts/scenario-context"
import { SidebarShell } from "./sidebar-shell"

interface Profile {
  full_name?: string
  company?: string
  title?: string
  profile_type?: string
}

function LayoutInner({ user, profile, children }: { user: Session["user"]; profile?: Profile; children: ReactNode }) {
  const { scenario, setScenario } = useScenario()
  return (
    <SidebarShell
      user={user}
      profile={profile}
      onSelectScenario={setScenario}
      activeScenario={scenario}
    >
      {children}
    </SidebarShell>
  )
}

export function DashboardLayoutClient({
  user,
  profile,
  initialScenario,
  children,
}: {
  user: Session["user"]
  profile?: Profile
  initialScenario?: string
  children: ReactNode
}) {
  return (
    <ScenarioProvider initialScenario={initialScenario}>
      <LayoutInner user={user} profile={profile}>
        {children}
      </LayoutInner>
    </ScenarioProvider>
  )
}
