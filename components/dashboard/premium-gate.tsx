import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PremiumGateProps {
  isPremium: boolean
  featureName: string
  description?: string
  children: React.ReactNode
}

export function PremiumGate({ isPremium, featureName, description, children }: PremiumGateProps) {
  if (isPremium) return <>{children}</>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {featureName}
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
            <Lock className="h-3 w-3" /> Enterprise
          </span>
        </h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>

      <div className="relative rounded-xl border border-border overflow-hidden">
        {/* blurred placeholder */}
        <div className="h-[480px] bg-gradient-to-b from-muted/30 to-muted/60 blur-sm pointer-events-none select-none flex items-start p-6 gap-3 flex-wrap">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/80 border border-border" style={{ width: `${120 + (i % 4) * 40}px` }} />
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background/60 backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-7 w-7 text-amber-500" />
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold">{featureName} is an Enterprise feature</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Custom reports, IC memos, and investor intelligence views are available on the Enterprise plan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:hello@threadmoat.com?subject=Enterprise%20Enquiry">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
