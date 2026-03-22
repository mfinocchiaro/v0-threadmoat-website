import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Download, BookOpen, Users, Globe, Layers,
  MapPin, CalendarDays, ArrowRight, FileText, Target,
  TrendingUp, Building2, Briefcase, ShieldCheck, Zap,
} from "lucide-react"
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Report' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function ReportPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Report')
  const tCommon = await getTranslations('Common')

  const REPORT_TOC = Array.from({ length: 18 }, (_, i) => ({
    part: t(`chapters.ch${i + 1}`),
    desc: t(`chapters.ch${i + 1}d`),
  }))

  const HERO_STATS = [
    { value: "632", label: t('stats.startupsTracked'), icon: Building2 },
    { value: "$16.2B", label: t('stats.vcFunding'), icon: TrendingUp },
    { value: "2,788", label: t('stats.investorsMapped'), icon: Users },
    { value: "43", label: t('stats.countriesCovered'), icon: Globe },
    { value: "200+", label: t('stats.founderInterviews'), icon: Briefcase },
    { value: "31", label: t('stats.incumbentVendors'), icon: Layers },
  ]

  const WHO_IS_THIS_FOR = [
    { title: t('audience.vcTitle'), desc: t('audience.vcDesc'), icon: Target },
    { title: t('audience.corpTitle'), desc: t('audience.corpDesc'), icon: Briefcase },
    { title: t('audience.startupTitle'), desc: t('audience.startupDesc'), icon: Zap },
    { title: t('audience.buyerTitle'), desc: t('audience.buyerDesc'), icon: ShieldCheck },
  ]

  const METHODOLOGY_ITEMS = [
    t('methodology.m1'), t('methodology.m2'), t('methodology.m3'),
    t('methodology.m4'), t('methodology.m5'), t('methodology.m6'),
  ]

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
            <Link href="/#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.services')}</Link>
            <Link href="/#expertise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.expertise')}</Link>
            <Link href="/report" className="text-sm text-foreground font-medium transition-colors">{tCommon('nav.marketReport')}</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.about')}</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.contactUs')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">{tCommon('nav.signIn')}</Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm">{tCommon('nav.viewPricing')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Conference banner: intentionally English-only, time-sensitive */}
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
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mt-2 font-medium">
              {t('hero.subtitle')}
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t('hero.description')}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>{t('hero.author')}</strong>
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/pricing">
                <Button size="lg" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {t('hero.purchaseCta')}
                </Button>
              </Link>
              <a
                href="/reports/2026-q1-market-report-sample.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('hero.sampleCta')}
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Cover image placeholder */}
          <div className="relative">
            <div className="rounded-lg border border-border/60 bg-gradient-to-br from-[#1a1433] to-[#0d0a1a] p-8 shadow-xl">
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
          <h2 className="text-2xl font-bold text-center mb-2">{t('toc.title')}</h2>
          <p className="text-center text-muted-foreground mb-10">
            {t('toc.subtitle')}
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
          <h2 className="text-2xl font-bold text-center mb-2">{t('audience.title')}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            {t('audience.subtitle')}
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
          <h2 className="text-2xl font-bold mb-2">{t('methodology.title')}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('methodology.subtitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {METHODOLOGY_ITEMS.map(item => (
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
          <h2 className="text-2xl font-bold mb-3">{t('cta.title')}</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pricing">
              <Button size="lg" className="gap-2">
                <FileText className="h-4 w-4" />
                {t('cta.purchaseCta')}
              </Button>
            </Link>
            <a
              href="/reports/2026-q1-market-report-sample.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                {t('cta.sampleCta')}
              </Button>
            </a>
            <Link href="/pricing">
              <Button variant="ghost" size="lg" className="gap-2">
                {t('cta.seePlans')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>{tCommon('footer.copyrightResearch', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">{tCommon('footer.home')}</Link>
            <Link href="/pricing" className="hover:text-foreground">{tCommon('footer.pricing')}</Link>
            <Link href="/about" className="hover:text-foreground">{tCommon('footer.about')}</Link>
            <a href="mailto:michael@threadmoat.com" className="hover:text-foreground">{tCommon('footer.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
