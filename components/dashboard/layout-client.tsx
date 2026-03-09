"use client"

import { ReactNode } from "react"
import type { Session } from "next-auth"
import { ScenarioProvider, useScenario } from "@/contexts/scenario-context"
import { PlanProvider } from "@/contexts/plan-context"
import { SidebarShell } from "./sidebar-shell"
import { FreeUserGuard } from "./free-user-guard"

interface Profile {
  full_name?: string
  company?: string
  title?: string
  profile_type?: string
}

function LayoutInner({ user, profile, children, isAdmin, isFreeUser }: { user: Session["user"]; profile?: Profile; children: ReactNode; isAdmin: boolean; isFreeUser: boolean }) {
  const { scenario, setScenario } = useScenario()
  return (
    <SidebarShell
      user={user}
      profile={profile}
      onSelectScenario={setScenario}
      activeScenario={scenario}
      isAdmin={isAdmin}
      isFreeUser={isFreeUser}
    >
      {isFreeUser ? <FreeUserGuard>{children}</FreeUserGuard> : children}
    </SidebarShell>
  )
}

export function DashboardLayoutClient({
  user,
  profile,
  initialScenario,
  isAdmin = false,
  isFreeUser = false,
  children,
}: {
  user: Session["user"]
  profile?: Profile
  initialScenario?: string
  isAdmin?: boolean
  isFreeUser?: boolean
  children: ReactNode
}) {
  return (
    <PlanProvider isFreeUser={isFreeUser}>
      <ScenarioProvider initialScenario={initialScenario}>
        <LayoutInner user={user} profile={profile} isAdmin={isAdmin} isFreeUser={isFreeUser}>
          {children}
        </LayoutInner>
      </ScenarioProvider>
    </PlanProvider>
  )
}
