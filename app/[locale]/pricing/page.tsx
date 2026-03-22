import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Calendar, MapPin, CalendarDays, BookOpen, Download, Castle, Flame, Crosshair } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildAlternates, buildOpenGraph } from '@/lib/metadata'

// Update this date each week after the Monday refresh
const LAST_UPDATED = "March 11, 2026"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Pricing' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: buildAlternates(locale, '/pricing'),
    openGraph: buildOpenGraph(t('meta.title'), t('meta.description'), locale, '/pricing'),
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
  }
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Pricing')
  const tCommon = await getTranslations('Common')

  const RECON_FEATURES = [
    t('features.reconF1'), t('features.reconF2'), t('features.reconF3'), t('features.reconF4'),
  ]

  const REPORT_FEATURES = [
    t('features.reportF1'), t('features.reportF2'), t('features.reportF3'),
    t('features.reportF4'), t('features.reportF5'), t('features.reportF6'),
    t('features.reportF7'), t('features.reportF8'), t('features.reportF9'),
  ]

  const FORGE_FEATURES = [
    t('features.forgeF1'), t('features.forgeF2'), t('features.forgeF3'),
    t('features.forgeF4'), t('features.forgeF5'), t('features.forgeF6'),
    t('features.forgeF7'), t('features.forgeF8'), t('features.forgeF9'),
    t('features.forgeF10'), t('features.forgeF11'), t('features.forgeF12'),
    t('features.forgeF13'),
  ]

  const RED_KEEP_FEATURES = [
    t('features.redKeepF1'), t('features.redKeepF2'), t('features.redKeepF3'),
    t('features.redKeepF4'), t('features.redKeepF5'), t('features.redKeepF6'),
    t('features.redKeepF7'), t('features.redKeepF8'), t('features.redKeepF9'),
    t('features.redKeepF10'),
  ]

  const METHODOLOGY_FIELDS = [
    { label: t('methodology.companyProfile'), items: t('methodology.companyProfileItems').split('|') },
    { label: t('methodology.marketPosition'), items: t('methodology.marketPositionItems').split('|') },
    { label: t('methodology.technicalStack'), items: t('methodology.technicalStackItems').split('|') },
    { label: t('methodology.financials'), items: t('methodology.financialsItems').split('|') },
    { label: t('methodology.investmentContext'), items: t('methodology.investmentContextItems').split('|') },
    { label: t('methodology.competitiveScoring'), items: t('methodology.competitiveScoringItems').split('|') },
  ]

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
            <Link href="/#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.services')}</Link>
            <Link href="/#expertise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.expertise')}</Link>
            <Link href="/report" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.marketReport')}</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.about')}</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.contactUs')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">{tCommon('nav.signIn')}</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">{tCommon('nav.getStarted')}</Button>
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

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-6">
          <Calendar className="h-3.5 w-3.5" />
          {t('hero.badge', { lastUpdated: LAST_UPDATED })}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground border border-border/40 rounded-lg px-4 py-2 bg-muted/30">
          {t('hero.accessNote')}
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-center text-2xl font-bold mb-2">{t('tiers.sectionTitle')}</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('tiers.sectionSubtitle')}
        </p>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-4">

          {/* Recon — Free */}
          <div className="flex flex-col rounded-lg border border-border/40 bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('tiers.reconTitle')}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t('tiers.reconSubtitle')}</p>
              </div>
              <Crosshair className="h-5 w-5 text-primary mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">{t('tiers.reconPrice')}</span>
              <p className="text-xs text-muted-foreground mt-1">{t('tiers.reconPriceNote')}</p>
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
                <Button variant="outline" className="w-full" size="sm">{t('tiers.reconCta')}</Button>
              </Link>
            </div>
          </div>

          {/* Latest Quarterly Report */}
          <div className="flex flex-col rounded-lg border-2 border-primary/60 bg-card p-6 shadow-md relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
              {t('tiers.mostPopular')}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('tiers.reportTitle')}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t('tiers.reportSubtitle')}</p>
              </div>
              <BookOpen className="h-5 w-5 text-primary mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">{t('tiers.reportPrice')}</span>
              <p className="text-xs text-muted-foreground mt-1">{t('tiers.reportPriceNote')}</p>
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
                <Button className="w-full" size="sm">{t('tiers.reportCta')}</Button>
              </Link>
              <a
                href="/reports/2026-q1-market-report-sample.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" />
                {t('tiers.reportSample')}
              </a>
            </div>
          </div>

          {/* The Forge — Annual Subscription */}
          <div className="flex flex-col rounded-lg border border-amber-600/40 bg-gradient-to-b from-card to-amber-950/10 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('tiers.forgeTitle')}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t('tiers.forgeSubtitle')}</p>
              </div>
              <Flame className="h-5 w-5 text-amber-500 mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">{t('tiers.forgePrice')}</span>
              <span className="text-lg text-muted-foreground font-normal">/year</span>
              <p className="text-xs text-muted-foreground mt-1">{t('tiers.forgePriceNote')}</p>
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
                <Button className="w-full border-amber-600/40 hover:bg-amber-950/20" variant="outline" size="sm">{t('tiers.forgeCta')}</Button>
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
                <h3 className="text-lg font-semibold">{t('tiers.redKeepTitle')}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t('tiers.redKeepSubtitle')}</p>
              </div>
              <Castle className="h-5 w-5 text-red-400 mt-1" />
            </div>
            <div className="mt-5">
              <span className="text-3xl font-bold">{t('tiers.redKeepPrice')}</span>
              <p className="text-xs text-muted-foreground mt-1">{t('tiers.redKeepPriceNote')}</p>
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
                <Button variant="outline" className="w-full border-red-800/40 hover:bg-red-950/20 hover:text-red-300" size="sm">{t('tiers.redKeepCta')}</Button>
              </a>
            </div>
          </div>
        </div>

        {/* Sample download callout */}
        <div className="mx-auto max-w-2xl mt-10 rounded-lg border border-border/60 bg-muted/30 p-6 text-center">
          <Download className="h-6 w-6 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">{t('sample.title')}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {t('sample.subtitle')}
          </p>
          <a
            href="/reports/2026-q1-market-report-sample.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" />
              {t('sample.cta')}
            </Button>
          </a>
        </div>
      </section>

      {/* Sample Outputs */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-center text-2xl font-bold mb-2">{t('outputs.title')}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            {t('outputs.subtitle')}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { img: "/sample-investor-network.jpg", label: t('outputs.investorNetwork'), desc: t('outputs.investorNetworkDesc') },
              { img: "/sample-funding-distribution.jpg", label: t('outputs.fundingDistribution'), desc: t('outputs.fundingDistributionDesc') },
              { img: "/sample-discipline-breakdown.jpg", label: t('outputs.disciplineBreakdown'), desc: t('outputs.disciplineBreakdownDesc') },
              { img: "/sample-ic-memo.jpg", label: t('outputs.analystBriefing'), desc: t('outputs.analystBriefingDesc') },
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
        <h2 className="text-center text-2xl font-bold mb-2">{t('methodology.title')}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          {t('methodology.subtitle')}
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
          <p>{tCommon('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">{tCommon('footer.home')}</Link>
            <Link href="/auth/login" className="hover:text-foreground">{tCommon('footer.signIn')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
