import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Calendar, Database, Phone } from "lucide-react"

// Update this date each week after the Monday refresh
const LAST_UPDATED = "March 3, 2026"

const ANALYTICS_FEATURES = [
  "All dashboards + filters + saved views",
  "Watchlists + alerts (weekly digest email)",
  "Exports: charts + aggregated tables (no directory dump)",
  "Weekly release notes ("what changed")",
]

const ENTERPRISE_FEATURES = [
  "Custom reports + briefings + consulting",
  "Optional: controlled dataset access / bespoke exports under contract",
  "Dedicated analyst support",
  "Quarterly strategy sessions",
]

const METHODOLOGY_FIELDS = [
  { label: "Company Profile", items: ["Name, URL, HQ location, country, founded", "Estimated headcount", "Known customers"] },
  { label: "Market Position", items: ["Discipline (CAD, CAM, PLM, ERP…)", "Lifecycle phase & workflow segment", "Sector focus & industries served"] },
  { label: "Technical Stack", items: ["Differentiation tags", "Operating model (SaaS, B2B, cloud-native…)", "Manufacturing type & integration points"] },
  { label: "Financials", items: ["Latest funding round & year", "Total known funding level", "Estimated revenue & market value"] },
  { label: "Investment Context", items: ["Investors & VCs", "Investment list membership", "Stripe customer & buyer maturity signals"] },
  { label: "Competitive Scoring", items: ["Team & execution", "Technology differentiation", "Funding efficiency, growth metrics", "Industry impact, competitive moat", "Weighted score (0–10)"] },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ThreadMoat"
              width={160}
              height={42}
              className="h-10 w-auto"
              unoptimized
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-6">
          <Calendar className="h-3.5 w-3.5" />
          Updated weekly (Mondays CET) &mdash; Last updated: {LAST_UPDATED}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Market Intelligence for Industrial AI<br className="hidden md:block" /> &amp; Engineering Software
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          500+ curated companies. Weekly updates. Technical taxonomy maintained by a domain expert
          with 35+ years in engineering software markets.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground border border-border/40 rounded-lg px-4 py-2 bg-muted/30">
          <strong>Analytics access only.</strong> Raw directory available exclusively via Enterprise engagement.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">

          {/* Analytics — Self-serve */}
          <div className="flex flex-col rounded-lg border border-primary/40 bg-card p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Analytics</h3>
                <p className="mt-1 text-sm text-muted-foreground">Self-serve</p>
              </div>
              <Database className="h-5 w-5 text-primary mt-1" />
            </div>
            <div className="mt-6 space-y-1">
              <div>
                <span className="text-4xl font-bold">$199</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <div className="text-sm text-muted-foreground">
                or{" "}
                <span className="font-medium text-foreground">$1,999/yr</span>
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  save ~$389
                </span>
              </div>
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {ANALYTICS_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-3">
              <Link href="/auth/sign-up">
                <Button className="w-full">Get started — $199/mo</Button>
              </Link>
              <Link href="/auth/sign-up?plan=annual">
                <Button variant="outline" className="w-full">Get started — $1,999/yr</Button>
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="flex flex-col rounded-lg border border-border/40 bg-card p-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Enterprise / VC / PE</h3>
                <p className="mt-1 text-sm text-muted-foreground">Call us</p>
              </div>
              <Phone className="h-5 w-5 text-muted-foreground mt-1" />
            </div>
            <div className="mt-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="/#contact">
                <Button variant="outline" className="w-full">Book an intro call</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Outputs */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-center text-2xl font-bold mb-2">See what you get</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Sample dashboard views and the weekly "Market Moves" digest.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              { label: "Funding Stage Distribution", desc: "Bar chart of companies by round (Seed → Series D+)" },
              { label: "Discipline Breakdown", desc: "CAD / CAM / PLM / ERP / Industrial AI by headcount and funding" },
              { label: "Weekly Market Moves", desc: "\"3 Series B rounds closed this week; 2 new entrants in Generative CAD\"" },
            ].map(sample => (
              <div
                key={sample.label}
                className="rounded-lg border border-border/40 bg-card overflow-hidden"
              >
                <div className="h-40 bg-muted/60 flex items-center justify-center text-muted-foreground text-sm">
                  [screenshot]
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm">{sample.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sample.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center text-2xl font-bold mb-2">What we track</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Every company is profiled across six dimensions — updated weekly by a single domain expert,
          not scraped or AI-hallucinated.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {METHODOLOGY_FIELDS.map(section => (
            <div key={section.label} className="rounded-lg border border-border/40 bg-card p-6">
              <h3 className="font-semibold text-sm text-primary mb-3">{section.label}</h3>
              <ul className="space-y-1.5">
                {section.items.map(item => (
                  <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/auth/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
