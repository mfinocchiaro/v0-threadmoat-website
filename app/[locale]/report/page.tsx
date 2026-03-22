import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Download, BookOpen, BarChart2, Users, Globe, Layers,
  MapPin, CalendarDays, ArrowRight, FileText, Target,
  TrendingUp, Building2, Briefcase, ShieldCheck, Zap,
} from "lucide-react"

const REPORT_TOC = [
  { part: "Executive Summary", desc: "Market state overview and key findings" },
  { part: "Part 0: Key Signals", desc: "Five developments indicating market disruption and evolution" },
  { part: "Part 1: Incumbents vs. Challengers", desc: "The structural tension reshaping engineering software" },
  { part: "Part 2: The Incumbent Landscape", desc: "How Siemens, Dassault, PTC, and Autodesk are responding" },
  { part: "Part 3: Structural Trends", desc: "Cloud migration, AI integration, and pricing disruption" },
  { part: "Part 4: The Startup Ecosystem", desc: "632 startups across 10 investment categories" },
  { part: "Part 5: Customer Adoption", desc: "Enterprise buying patterns and deployment signals" },
  { part: "Part 6: The Investor Landscape", desc: "2,788 investors mapped across funding stages" },
  { part: "Part 7: Revised Market Sizing", desc: "$120-140B market forecast through 2028" },
  { part: "Part 8: The Consolidation Signal", desc: "$50B+ M&A activity analysis (2022-2025)" },
  { part: "Part 9: Red Ocean / Blue Ocean", desc: "Strategic positioning and whitespace opportunities" },
  { part: "Part 10: Vertical Deep Dives", desc: "Sector-specific analysis: Aero, Auto, Pharma, MedDev" },
  { part: "Part 11: Pricing Disruption", desc: "How challengers are unbundling incumbent pricing" },
  { part: "Part 12: M&A Prediction Framework", desc: "Who gets acquired next and why" },
  { part: "Part 13: Emerging Signals", desc: "Contrarian calls and early-stage bets" },
  { part: "Part 14: Technology Buyers", desc: "What this means for OEMs, ISVs, and platform companies" },
  { part: "Appendix A", desc: "Company profiles — all 632 startups profiled" },
  { part: "Appendix B", desc: "Investor directory — 2,788 investors and VCs" },
]

const HERO_STATS = [
  { value: "632", label: "Startups Tracked", icon: Building2 },
  { value: "$16.2B", label: "VC Funding Mapped", icon: TrendingUp },
  { value: "2,788", label: "Investors Mapped", icon: Users },
  { value: "43", label: "Countries Covered", icon: Globe },
  { value: "200+", label: "Founder Interviews", icon: Briefcase },
  { value: "31", label: "Incumbent Vendors", icon: Layers },
]

const WHO_IS_THIS_FOR = [
  {
    title: "VC & PE Firms",
    desc: "Identify deal flow, validate theses, map co-investors, and benchmark portfolio companies against 632 peers.",
    icon: Target,
  },
  {
    title: "Corporate Strategy / M&A",
    desc: "Find acquisition targets, evaluate build vs. buy, and understand the competitive dynamics in each segment.",
    icon: Briefcase,
  },
  {
    title: "Startup Founders",
    desc: "Understand your competitive landscape, identify positioning gaps, and prepare for investor conversations.",
    icon: Zap,
  },
  {
    title: "Technology Buyers",
    desc: "Map the vendor landscape, compare incumbents vs. challengers, and make informed platform decisions.",
    icon: ShieldCheck,
  },
]

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
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
            <Link href="/report" className="text-sm text-foreground font-medium transition-colors">Market Report</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm">View Pricing</Button>
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Report details */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
              <BookOpen className="h-3.5 w-3.5" />
              1Q2026 Market State Report
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Engineering Software &amp; Industrial AI
            </h1>
            <p className="text-xl text-muted-foreground mt-2 font-medium">
              Market State Report — 1Q2026
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The most comprehensive analysis of the engineering software startup ecosystem.
              150+ pages of original research covering 632 startups, 31 incumbent vendors,
              and $16.2B in VC funding — based on 200+ founder interviews and proprietary data.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>ThreadMoat Research</strong> — Michael Finocchiaro — March 2026
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/pricing">
                <Button size="lg" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Purchase Report — $4,999
                </Button>
              </Link>
              <a
                href="/reports/2026-q1-market-report-sample.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Download className="h-4 w-4" />
                  Free Sample (30 pages)
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Cover image placeholder */}
          <div className="relative">
            <div className="rounded-lg border border-border/60 bg-gradient-to-br from-[#1a1433] to-[#0d0a1a] p-8 shadow-xl">
              {/* Report cover styling inspired by the Threaded branding */}
              <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 rounded-lg p-6 mb-6">
                <Image
                  src="/threaded-logo.jpg"
                  alt="Threaded"
                  width={200}
                  height={50}
                  className="h-10 w-auto mx-auto"
                  unoptimized
                />
              </div>
              <h2 className="text-white text-2xl font-bold leading-tight">
                Engineering Software &amp; Industrial AI
              </h2>
              <p className="text-purple-200 text-lg font-medium mt-1">
                Market State Report 1Q2026
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm">
                <span><span className="text-purple-400 font-semibold">632</span> <span className="text-purple-200">Startups</span></span>
                <span><span className="text-purple-400 font-semibold">31</span> <span className="text-purple-200">Incumbents</span></span>
                <span><span className="text-purple-400 font-semibold">$16.2B</span> <span className="text-purple-200">VC Mapped</span></span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                <span><span className="text-purple-400 font-semibold">2,788</span> <span className="text-purple-200">Investors</span></span>
                <span><span className="text-purple-400 font-semibold">43</span> <span className="text-purple-200">Countries</span></span>
                <span><span className="text-purple-400 font-semibold">200+</span> <span className="text-purple-200">Interviews</span></span>
              </div>
              <div className="border-t border-purple-700/50 mt-6 pt-4">
                <p className="text-purple-300 text-xs">ThreadMoat Research — Michael Finocchiaro — March 2026</p>
                <p className="text-purple-400/60 text-[10px] mt-1 italic">
                  Proprietary data pipeline — 200+ founder interviews including AI Across the Product Lifecycle podcast
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {HERO_STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">What&apos;s Inside</h2>
          <p className="text-center text-muted-foreground mb-10">
            150+ pages across 14 chapters, two appendices, and an executive summary.
          </p>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {REPORT_TOC.map((item, i) => (
              <div
                key={item.part}
                className="flex items-start gap-3 rounded-lg border border-border/30 bg-card/50 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="text-xs font-semibold text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.part}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">Who Is This For</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Strategic intelligence for anyone navigating the $120B+ engineering software market.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {WHO_IS_THIS_FOR.map(item => (
              <Card key={item.title} className="bg-card">
                <CardContent className="pt-6">
                  <item.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Methodology</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Every data point curated by a single domain expert — not scraped, not AI-hallucinated.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {[
              "200+ primary research founder interviews",
              "Weekly Airtable database updates (Mondays CET)",
              "7-dimension competitive scoring (1-5 scale)",
              "Financial health modeling with burn & runway",
              "Customer signal analysis (1,644 mentions)",
              "Cross-referenced with Crunchbase, PitchBook, LinkedIn",
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-primary/5">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to access the full report?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            150+ pages of proprietary research. Personalized, watermarked copy with unique Copy ID.
            One legal entity, internal use only.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pricing">
              <Button size="lg" className="gap-2">
                <FileText className="h-4 w-4" />
                Purchase Report — $4,999
              </Button>
            </Link>
            <a
              href="/reports/2026-q1-market-report-sample.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                Download Free Sample
              </Button>
            </a>
            <Link href="/pricing">
              <Button variant="ghost" size="lg" className="gap-2">
                See All Plans <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ThreadMoat Research / Michael Finocchiaro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <a href="mailto:michael@threadmoat.com" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
