"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowRight, Network, Compass, Map, Clock, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isPathAllowed, getRequiredTier, getTierLabel, type AccessTier } from "@/lib/tiers"

const FREE_HIGHLIGHTS = [
  { icon: Network, label: "Startup Ecosystem", href: "/dashboard/network" },
  { icon: Compass, label: "Investment Landscape", href: "/dashboard/landscape-intro" },
  { icon: Map, label: "Geography Map", href: "/dashboard/map" },
]

interface FreeUserGuardProps {
  children: React.ReactNode
  accessTier: AccessTier
  isExpiredTrial?: boolean
  daysRemaining?: number | null
}

export function FreeUserGuard({ children, accessTier, isExpiredTrial = false, daysRemaining = null }: FreeUserGuardProps) {
  const pathname = usePathname()
  const allowed = isPathAllowed(pathname, accessTier)

  // Expired Explorer trial — degraded to map + settings only
  if (isExpiredTrial) {
    const degradedAllowed = pathname === '/dashboard/map' || pathname === '/dashboard/settings' || pathname === '/dashboard'
    if (degradedAllowed) {
      return (
        <>
          <ExpiredTrialBanner />
          {children}
        </>
      )
    }
    return <PaywallBlock accessTier={accessTier} pathname={pathname} isExpiredTrial />
  }

  // Active trial with warning banner when < 7 days left
  if (accessTier === 'explorer' && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7) {
    return (
      <>
        <TrialExpiryBanner daysRemaining={daysRemaining} />
        {allowed ? children : <PaywallBlock accessTier={accessTier} pathname={pathname} />}
      </>
    )
  }

  // Path allowed at this tier — render content
  if (allowed) return <>{children}</>

  // Path not allowed — show tier-appropriate paywall
  return <PaywallBlock accessTier={accessTier} pathname={pathname} />
}

/** Yellow warning banner shown when trial has < 7 days left */
function TrialExpiryBanner({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
      <span>
        <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left on your Recon trial.{' '}
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
        Your Recon trial has ended. You can still view the Geography Map.{' '}
        <Link href="/pricing" className="font-medium text-red-400 underline hover:text-red-300">
          Upgrade to restore full access
        </Link>
      </span>
    </div>
  )
}

/** Paywall block shown on gated pages — messaging adapts to the user's tier */
function PaywallBlock({ accessTier, pathname, isExpiredTrial = false }: { accessTier: AccessTier; pathname: string; isExpiredTrial?: boolean }) {
  const requiredTier = getRequiredTier(pathname)
  const requiredLabel = requiredTier ? getTierLabel(requiredTier) : 'Premium'
  const isRedKeepFeature = requiredTier === 'red_keep'

  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {isExpiredTrial
            ? <AlertTriangle className="h-8 w-8 text-red-500" />
            : isRedKeepFeature
              ? <Shield className="h-8 w-8 text-red-500" />
              : <Lock className="h-8 w-8 text-primary" />
          }
        </div>

        {isExpiredTrial ? (
          <>
            <h2 className="mt-6 text-2xl font-bold">Your Recon Trial Has Ended</h2>
            <p className="mt-3 text-muted-foreground">
              Your 30-day Explorer window has closed. Upgrade to unlock all dashboards,
              charts, and analytics — or get the full picture with The Red Keep.
            </p>
          </>
        ) : isRedKeepFeature ? (
          <>
            <h2 className="mt-6 text-2xl font-bold">The Red Keep</h2>
            <p className="mt-3 text-muted-foreground">
              This visualization is exclusive to The Red Keep — full platform access
              with all 20+ charts, exports, watchlists, and dedicated analyst support.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-2xl font-bold">{requiredLabel} Feature</h2>
            <p className="mt-3 text-muted-foreground">
              This visualization requires the <strong>{requiredLabel}</strong> plan.
              Upgrade to unlock {requiredTier === 'forge' ? '10 interactive charts and strategic analytics' : 'additional features'}.
            </p>
          </>
        )}

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/pricing" target="_blank">
            <Button size="lg">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          {/* Red Keep nudge for Explorer/Investor users on Red Keep pages */}
          {isRedKeepFeature && accessTier !== 'red_keep' && (
            <Link
              href="/pricing#red-keep"
              className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4 text-red-500" />
              <span>Learn about <strong>The Red Keep</strong> — full platform access + analyst support</span>
            </Link>
          )}
        </div>

        {/* Invite code hint */}
        <p className="mt-6 text-sm text-muted-foreground">
          Have an invite code?{' '}
          <Link href="/dashboard/settings" className="font-medium text-primary underline hover:text-primary/80">
            Redeem it in Settings
          </Link>
        </p>

        {/* Show what's available at current tier */}
        <div className="mt-6 rounded-lg border border-border/40 bg-muted/30 p-6">
          <p className="text-sm font-medium mb-4">
            {isExpiredTrial ? 'Still available:' : `Available on your ${getTierLabel(accessTier)} plan:`}
          </p>
          <div className="flex flex-col gap-3">
            {(isExpiredTrial
              ? FREE_HIGHLIGHTS.filter(h => h.href === '/dashboard/map')
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
