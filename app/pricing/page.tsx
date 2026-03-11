import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Calendar, Phone, MapPin, CalendarDays, BarChart2, Network, FileText } from "lucide-react"

// Update this date each week after the Monday refresh
const LAST_UPDATED = "March 3, 2026"

const FREE_FEATURES = [
  "Network Graph — interactive relationship mapping",
  "Investment Landscape — 10 domains, category breakdown",
  "Geography Map — global startup distribution",
  "Updated weekly with the full dataset",
]

const ENTERPRISE_FEATURES = [
  "All 20+ dashboards + filters + saved views",
  "Watchlists + alerts",
  "Exports: charts + aggregated tables",
  "Custom reports + briefings + consulting",
  "Controlled dataset access / bespoke exports under contract",
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
          <nav className="flex items-center gap-8">
            <Link href="/#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
            <Link href="/#expertise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Expertise</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Threaded! Conference Banner */}
      <div className="bg-[#2a2344] border-b border-purple-800/40">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Image
            src="/threaded-logo.jpg"
            alt="Threaded! Conference"
            width={140}
            height={40}
            className="h-8 w-auto rounded"
            unoptimized
          />
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-purple-100">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-300" />
              <strong>Warwick, UK</strong>
              <span className="text-purple-300 mx-1">&middot;</span>
              <CalendarDays className="h-3.5 w-3.5 text-purple-300" />
              Mar 25
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-300" />
              <strong>Miami, FL</strong>
              <span className="text-purple-300 mx-1">&middot;</span>
              <CalendarDays className="h-3.5 w-3.5 text-purple-300" />
              Apr 13
            </span>
          </div>
          <a
            href="https://threaded.live"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            Register Now!
          </a>
        </div>
      </div>

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

          {/* Free — Explorer */}
          <div className="flex flex-col rounded-lg border border-border/40 bg-card p-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Explorer</h3>
                <p className="mt-1 text-sm text-muted-foreground">Free forever</p>
              </div>
              <Network className="h-5 w-5 text-muted-foreground mt-1" />
            </div>
            <div className="mt-6 space-y-1">
              <div>
                <span className="text-4xl font-bold">$0</span>
              </div>
              <div className="text-sm text-muted-foreground">
                No credit card required
              </div>
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">Sign up free</Button>
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="flex flex-col rounded-lg border border-primary/40 bg-card p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Enterprise / VC / PE</h3>
                <p className="mt-1 text-sm text-muted-foreground">Custom engagement</p>
              </div>
              <Phone className="h-5 w-5 text-primary mt-1" />
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
                <Button className="w-full">Book an intro call</Button>
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
            Sample dashboard views and analyst briefing outputs.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              { icon: BarChart2, label: "Funding Stage Distribution", desc: "Bar chart of companies by round (Seed → Series D+)" },
              { icon: Network, label: "Discipline Breakdown", desc: "CAD / CAM / PLM / ERP / Industrial AI by headcount and funding" },
              { icon: FileText, label: "Bi-Monthly Briefing", desc: "30-minute one-on-one analyst call covering portfolio-relevant market moves and emerging signals" },
            ].map(sample => {
              const Icon = sample.icon
              return (
                <div
                  key={sample.label}
                  className="rounded-lg border border-border/40 bg-card overflow-hidden"
                >
                  <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
                    <Icon className="h-12 w-12 text-primary/30" />
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-sm">{sample.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sample.desc}</p>
                  </div>
                </div>
              )
            })}
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
