"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowRight, Network, Compass, Map, Clock, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isFreeTierPath } from "@/lib/free-tier"

const FREE_HIGHLIGHTS = [
  { icon: Network, label: "Network Graph", href: "/dashboard/network" },
  { icon: Compass, label: "Investment Landscape", href: "/dashboard/landscape-intro" },
  { icon: Map, label: "Geography Map", href: "/dashboard/map" },
]

interface FreeUserGuardProps {
  children: React.ReactNode
  isExpiredTrial?: boolean
  daysRemaining?: number | null
}

export function FreeUserGuard({ children, isExpiredTrial = false, daysRemaining = null }: FreeUserGuardProps) {
  const pathname = usePathname()

  // Active trial — show content but with warning banner when < 7 days left
  if (!isExpiredTrial && daysRemaining !== null && daysRemaining > 0) {
    return (
      <>
        {daysRemaining <= 7 && <TrialExpiryBanner daysRemaining={daysRemaining} />}
        {isFreeTierPath(pathname) ? children : <PaywallBlock isExpiredTrial={false} />}
      </>
    )
  }

  // Expired trial — degraded access (map only)
  if (isExpiredTrial) {
    // Expired explorers keep only the map
    if (pathname === '/dashboard/map' || pathname === '/dashboard/settings' || pathname === '/dashboard') {
      return (
        <>
          <ExpiredTrialBanner />
          {children}
        </>
      )
    }
    return <PaywallBlock isExpiredTrial={true} />
  }

  // No trial (legacy free user) — standard behavior
  if (isFreeTierPath(pathname)) {
    return <>{children}</>
  }

  return <PaywallBlock isExpiredTrial={false} />
}

/** Yellow warning banner shown when trial has < 7 days left */
function TrialExpiryBanner({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
      <span>
        <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left on your Explorer trial.{' '}
        <Link href="/pricing" className="font-medium text-amber-600 underline hover:text-amber-500">
          Upgrade now
        </Link>{' '}
        to keep your access.
      </span>
    </div>
  )
}

/** Red banner shown after trial has expired */
function ExpiredTrialBanner() {
  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      <span>
        Your Explorer trial has ended. You can still view the Geography Map.{' '}
        <Link href="/pricing" className="font-medium text-red-400 underline hover:text-red-300">
          Upgrade to restore full access
        </Link>
      </span>
    </div>
  )
}

/** Paywall block shown on gated pages */
function PaywallBlock({ isExpiredTrial }: { isExpiredTrial: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {isExpiredTrial
            ? <AlertTriangle className="h-8 w-8 text-red-500" />
            : <Lock className="h-8 w-8 text-primary" />
          }
        </div>

        {isExpiredTrial ? (
          <>
            <h2 className="mt-6 text-2xl font-bold">Your Explorer Trial Has Ended</h2>
            <p className="mt-3 text-muted-foreground">
              Your 30-day Explorer window has closed. Upgrade to unlock all dashboards,
              charts, and analytics — or get the full picture with The Red Keep.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-2xl font-bold">Pro Feature</h2>
            <p className="mt-3 text-muted-foreground">
              This visualization is available with an Analytics subscription.
              Upgrade to unlock all 20+ interactive charts, filters, and saved views.
            </p>
          </>
        )}

        {/* Primary CTA — pricing page */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/pricing">
            <Button size="lg">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          {/* Red Keep nudge for expired trials */}
          {isExpiredTrial && (
            <Link
              href="/pricing#red-keep"
              className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4 text-red-500" />
              <span>Learn about <strong>The Red Keep</strong> — full platform access + analyst support</span>
            </Link>
          )}
        </div>

        {/* Show what's still available */}
        <div className="mt-10 rounded-lg border border-border/40 bg-muted/30 p-6">
          <p className="text-sm font-medium mb-4">
            {isExpiredTrial ? 'Still available:' : 'Available on your free plan:'}
          </p>
          <div className="flex flex-col gap-3">
            {(isExpiredTrial
              ? FREE_HIGHLIGHTS.filter(h => h.href === '/dashboard/map')  // expired: map only
              : FREE_HIGHLIGHTS
            ).map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
                <ArrowRight className="ml-auto h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
