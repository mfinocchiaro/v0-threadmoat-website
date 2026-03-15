"use client"

import { ReactNode, Suspense } from "react"
import type { Session } from "next-auth"
import { ScenarioProvider, useScenario } from "@/contexts/scenario-context"
import { PlanProvider } from "@/contexts/plan-context"
import { SidebarShell } from "./sidebar-shell"
import { FreeUserGuard } from "./free-user-guard"
import { CheckoutToast } from "@/components/checkout/checkout-toast"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import type { AccessTier } from "@/lib/tiers"

interface Profile {
  full_name?: string
  company?: string
  title?: string
  profile_type?: string
}

function LayoutInner({ user, profile, children, isAdmin, isFreeUser, isExpiredTrial, daysRemaining, accessTier }: {
  user: Session["user"]
  profile?: Profile
  children: ReactNode
  isAdmin: boolean
  isFreeUser: boolean
  isExpiredTrial: boolean
  daysRemaining: number | null
  accessTier: AccessTier
}) {
  const { scenario, setScenario } = useScenario()
  useIdleTimeout()
  return (
    <SidebarShell
      user={user}
      profile={profile}
      onSelectScenario={setScenario}
      activeScenario={scenario}
      isAdmin={isAdmin}
      isFreeUser={isFreeUser}
      accessTier={accessTier}
    >
      <Suspense><CheckoutToast /></Suspense>
      {accessTier !== 'admin' ? (
        <FreeUserGuard accessTier={accessTier} isExpiredTrial={isExpiredTrial} daysRemaining={daysRemaining}>
          {children}
        </FreeUserGuard>
      ) : children}
    </SidebarShell>
  )
}

export function DashboardLayoutClient({
  user,
  profile,
  initialScenario,
  isAdmin = false,
  isFreeUser = false,
  isExpiredTrial = false,
  daysRemaining = null,
  accessTier = 'explorer',
  children,
}: {
  user: Session["user"]
  profile?: Profile
  initialScenario?: string
  isAdmin?: boolean
  isFreeUser?: boolean
  isExpiredTrial?: boolean
  daysRemaining?: number | null
  accessTier?: AccessTier
  children: ReactNode
}) {
  return (
    <PlanProvider isFreeUser={isFreeUser}>
      <ScenarioProvider initialScenario={initialScenario}>
        <LayoutInner
          user={user}
          profile={profile}
          isAdmin={isAdmin}
          isFreeUser={isFreeUser}
          isExpiredTrial={isExpiredTrial}
          daysRemaining={daysRemaining}
          accessTier={accessTier}
        >
          {children}
        </LayoutInner>
      </ScenarioProvider>
    </PlanProvider>
  )
}
