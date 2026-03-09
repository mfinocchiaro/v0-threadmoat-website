"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowRight, Network, Compass, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isFreeTierPath } from "@/lib/free-tier"

const FREE_HIGHLIGHTS = [
  { icon: Network, label: "Network Graph", href: "/dashboard/network" },
  { icon: Compass, label: "Investment Landscape", href: "/dashboard/landscape-intro" },
  { icon: Map, label: "Geography Map", href: "/dashboard/map" },
]

export function FreeUserGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isFreeTierPath(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">Pro Feature</h2>
        <p className="mt-3 text-muted-foreground">
          This visualization is available with an Analytics subscription.
          Upgrade to unlock all 20+ interactive charts, filters, and saved views.
        </p>

        <div className="mt-8">
          <Link href="/pricing">
            <Button size="lg">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 rounded-lg border border-border/40 bg-muted/30 p-6">
          <p className="text-sm font-medium mb-4">Available on your free plan:</p>
          <div className="flex flex-col gap-3">
            {FREE_HIGHLIGHTS.map(({ icon: Icon, label, href }) => (
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
