import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Calendar, MapPin, CalendarDays, BarChart2, Network, FileText, BookOpen, Download, Briefcase, Castle, Flame, Crosshair } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// Update this date each week after the Monday refresh
const LAST_UPDATED = "March 11, 2026"

const REPORT_FEATURES = [
  "150+ page deep-dive analysis",
  "600+ companies, >$16B VC funding mapped",
  "Based on 200+ primary research interviews",
  "Incumbent landscape — $22–24B anchor vendors profiled",
  "Startup ecosystem — 10 investment categories ranked",
  "$50B+ M&A consolidation analysis (2022–2025)",
  "5-year market forecast ($120–140B by 2028)",
  "ThreadMoat Top 25 rankings with 7-dimension scoring",
  "Personalized, watermarked copy with unique Copy ID",
]

const RECON_FEATURES = [
  "Startup Ecosystem Graph — interactive relationship mapping",
  "Investment Landscape — 10 domains, category breakdown",
  "Geography Map — global startup distribution",
  "Updated weekly with the full dataset",
]

const FORGE_FEATURES = [
  "All Recon graphs plus 10 interactive analytics charts",
  "Magic Quadrant — competitive positioning",
  "Bubble Chart — multi-dimensional scatter analysis",
  "Full Landscape — grouped company tiles by category",
  "Top Rankings — companies ranked by any metric",
  "Category Treemap — hierarchical market view",
  "Founding Timeline — ecosystem evolution",
  "Industry Sunburst — radial market hierarchy",
  "Metro Areas — geographic concentration analysis",
  "Radar Chart — multi-axis company comparison",
  "Periodic Table — company tiles at a glance",
  "All four quarterly reports included",
  "60-min analyst briefing with Michael Finocchiaro",
]

const RED_KEEP_FEATURES = [
  "Dedicated analyst support & quarterly strategy sessions",
  "All Forge dashboards plus 15 advanced analytics",
  "Company Compare — side-by-side deep dives",
  "Customer & Investor Networks — full relationship mapping",
  "Sankey, Chord, Marimekko — advanced flow analysis",
  "Parallel Coordinates, Box Plots, SPLOM — statistical views",
  "Annual Market State Reports (all quarters)",
  "Watchlists + alerts on portfolio companies",
  "Exports: charts + aggregated tables",
  "Custom reports + briefings + consulting",
]

const METHODOLOGY_FIELDS = [
  { label: "Company Profile", items: ["Name, URL, HQ location, country, founded", "Estimated headcount", "Known customers"] },
  { label: "Market Position", items: ["Discipline (CAD, CAM, PLM, ERP…)", "Lifecycle phase & workflow segment", "Sector focus & industries served"] },
  { label: "Technical Stack", items: ["Differentiation tags", "Deployment model (Cloud, On-Prem, Edge, Hybrid…)", "Operating model (SaaS, B2B, Direct Sales…)", "Manufacturing type & integration points"] },
  { label: "Financials", items: ["Latest funding round & year", "Total known funding level", "Estimated revenue & market value"] },
  { label: "Investment Context", items: ["Investors & VCs", "Investment list membership", "Stripe customer & buyer maturity signals"] },
  { label: "Competitive Scoring", items: ["Market Opportunity", "Team & Execution", "Funding Efficiency", "Growth Metrics", "Technical Differentiation", "Industry Impact", "Competitive Moat", "Weighted score (0–10)"] },
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
            <Link href="/report" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Market Report</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
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
          600+ curated companies. Weekly updates. Technical taxonomy maintained by a domain expert
          with 35+ years in engineering software markets.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground border border-border/40 rounded-lg px-4 py-2 bg-muted/30">
          <strong>Analytics access only.</strong> Raw directory available exclusively via Red Keep engagement.
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-center text-2xl font-bold mb-2">Access to ThreadMoat</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Choose your level of intelligence. Every tier includes weekly data updates and the full 600+ company dataset.
        </p>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-4">

          {/* Recon — Free */}
          <div className="flex flex-col rounded-lg border border-border/40 bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recon</h3>
                <p className="mt-1 text-xs text-muted-foreground">Scout the landscape &mdash; no credit card</p>
              </div>
              <Crosshair className="h-5 w-5 text-primary mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">$0</span>
              <p className="text-xs text-muted-foreground mt-1">Free &mdash; 3 interactive graphs</p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {RECON_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full" size="sm">Sign up free</Button>
              </Link>
            </div>
          </div>

          {/* Latest Quarterly Report */}
          <div className="flex flex-col rounded-lg border-2 border-primary/60 bg-card p-6 shadow-md relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
              Most Popular
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Latest Quarterly Report</h3>
                <p className="mt-1 text-xs text-muted-foreground">One legal entity, internal use only</p>
              </div>
              <BookOpen className="h-5 w-5 text-primary mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">$4,999</span>
              <p className="text-xs text-muted-foreground mt-1">One-time purchase</p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {REPORT_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2.5">
              <Link href="/auth/sign-up?product=market-report-2026-q1">
                <Button className="w-full" size="sm">Purchase Report</Button>
              </Link>
              <a
                href="/reports/2026-q1-market-report-sample.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                Download free sample (30 pages)
              </a>
            </div>
          </div>

          {/* The Forge — Annual Subscription */}
          <div className="flex flex-col rounded-lg border border-amber-600/40 bg-gradient-to-b from-card to-amber-950/10 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">The Forge</h3>
                <p className="mt-1 text-xs text-muted-foreground">Strategic analytics + quarterly reports</p>
              </div>
              <Flame className="h-5 w-5 text-amber-500 mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">$18,999</span>
              <span className="text-lg text-muted-foreground font-normal">/year</span>
              <p className="text-xs text-muted-foreground mt-1">Annual subscription &mdash; 13 graphs</p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {FORGE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a href="/about#contact">
                <Button className="w-full border-amber-600/40 hover:bg-amber-950/20" variant="outline" size="sm">Contact for Subscription</Button>
              </a>
            </div>
          </div>

          {/* The Red Keep — Enterprise */}
          <div className="flex flex-col rounded-lg border border-red-800/40 bg-gradient-to-b from-card to-red-950/10 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none">
              <Castle className="h-32 w-32 -mt-4 -mr-4" />
            </div>
            <div className="flex items-start justify-between relative">
              <div>
                <h3 className="text-lg font-semibold">The Red Keep</h3>
                <p className="mt-1 text-xs text-muted-foreground">Full command &mdash; nothing hidden</p>
              </div>
              <Castle className="h-5 w-5 text-red-400 mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">Call For Quote</span>
              <p className="text-xs text-muted-foreground mt-1">Annual contract &mdash; 28+ graphs</p>
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {RED_KEEP_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a href="mailto:michael.finocchiaro@gmail.com?subject=ThreadMoat%20Red%20Keep%20Inquiry">
                <Button variant="outline" className="w-full border-red-800/40 hover:bg-red-950/20 hover:text-red-300" size="sm">Email Us</Button>
              </a>
            </div>
          </div>
        </div>

        {/* Sample download callout */}
        <div className="mx-auto max-w-2xl mt-10 rounded-lg border border-border/60 bg-muted/30 p-6 text-center">
          <Download className="h-6 w-6 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">Not sure yet? Download the free sample.</h3>
          <p className="text-xs text-muted-foreground mb-4">
            30-page preview with executive summary, methodology, sample vendor analysis, and structural trends.
            No sign-up required.
          </p>
          <a
            href="/reports/2026-q1-market-report-sample.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Download Sample Report (PDF)
            </Button>
          </a>
        </div>
      </section>

      {/* Sample Outputs */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-center text-2xl font-bold mb-2">See what you get</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Sample dashboard views and analyst briefing outputs.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { img: "/sample-investor-network.jpg", label: "Investor Network", desc: "Interactive network graph mapping investors, portfolio companies, and co-investment relationships" },
              { img: "/sample-funding-distribution.jpg", label: "Funding Distribution", desc: "Bar chart of companies by funding stage (Seed → Series D+) with total capital deployed" },
              { img: "/sample-discipline-breakdown.jpg", label: "Discipline Breakdown", desc: "CAD / CAM / PLM / ERP / Industrial AI by headcount and funding — full ecosystem view" },
              { img: "/sample-ic-memo.jpg", label: "Analyst Briefing", desc: "Investment Committee Memo with scoring breakdown, financials, and competitive analysis" },
            ].map(sample => (
              <div
                key={sample.label}
                className="rounded-lg border border-border/40 bg-card overflow-hidden"
              >
                <div className="h-40 overflow-hidden">
                  <Image
                    src={sample.img}
                    alt={sample.label}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
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
