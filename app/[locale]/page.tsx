import React from "react"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Database, Users, TrendingUp, Mail, CheckCircle2, MapPin, CalendarDays, Link2, Shield, Layers } from "lucide-react"
import { loadCompaniesFromCSV, stripSensitiveFields } from "@/lib/load-companies-server"
import { HomepageDashboard } from "@/components/homepage/homepage-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildAlternates, buildOpenGraph } from '@/lib/metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Home' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: buildAlternates(locale, '/'),
    openGraph: buildOpenGraph(t('meta.title'), t('meta.description'), locale, '/'),
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  let companies: Awaited<ReturnType<typeof loadCompaniesFromCSV>> = []
  try {
    const raw = await loadCompaniesFromCSV()
    companies = stripSensitiveFields(raw)
  } catch {
    // Data load failed — page renders without dashboard
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
                              src="/logo.png"
              alt="ThreadMoat"
                              width={160}
                              height={42}
              className="h-10 w-auto"
              unoptimized
            />
          </div>
          <nav className="flex items-center gap-8">
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.services')}</a>
            <a href="#expertise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('nav.expertise')}</a>
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
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="https://calendly.com/mfinocchiaro/15min" target="_blank" rel="noopener noreferrer">{tCommon('nav.scheduleCall')}</a>
            </Button>
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
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {t('hero.badge')}
        </div>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl mb-6">
          {t('hero.title')}{" "}
          <span className="text-primary">{t('hero.titleHighlight')}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/auth/login">
            <Button size="lg" className="gap-2">
              <Database className="h-5 w-5" />
              {t('hero.seeAnalytics')}
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">{t('hero.viewPricing')}</Button>
          </Link>
        </div>
      </section>

      {/* Digital Thread Thesis */}
      <section className="border-t border-border/40 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">{t('thesis.label')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              {t('thesis.title')}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('thesis.description')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-12">
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('thesis.threadTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('thesis.threadDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('thesis.moatTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('thesis.moatDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('thesis.intelligenceTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('thesis.intelligenceDesc')}
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <blockquote className="border-l-4 border-primary pl-6 py-2">
              <p className="text-muted-foreground italic">
                &ldquo;{t('thesis.quote')}&rdquo;
              </p>
              <footer className="mt-3 text-sm font-medium text-foreground">
                {t('thesis.quoteAuthor')}
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Live Dashboard Preview */}
      {companies.length > 0 && <HomepageDashboard data={companies} />}

      {/* Organization Selector */}
      <section className="border-t border-border/40 bg-muted/30" id="services">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-center text-3xl font-bold mb-4">{t('profiles.title')}</h2>
          <p className="text-center text-muted-foreground mb-12">{t('profiles.subtitle')}</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {[
              { title: t('profiles.isvTitle'), desc: t('profiles.isvDesc') },
              { title: t('profiles.startupTitle'), desc: t('profiles.startupDesc') },
              { title: t('profiles.vcTitle'), desc: t('profiles.vcDesc') },
              { title: t('profiles.oemTitle'), desc: t('profiles.oemDesc') },
            ].map((org) => (
              <Card key={org.title} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{org.title}</h3>
                  <p className="text-sm text-muted-foreground">{org.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mt-16 text-center">
            <div><p className="text-4xl font-bold text-primary">35+</p><p className="text-sm text-muted-foreground mt-1">{t('profiles.yearsExperience')}</p></div>
            <div><p className="text-4xl font-bold text-primary">550+</p><p className="text-sm text-muted-foreground mt-1">{t('profiles.startupsInDb')}</p></div>
            <div><p className="text-4xl font-bold text-primary">200+</p><p className="text-sm text-muted-foreground mt-1">{t('profiles.founderInterviews')}</p></div>
            <Link href="/landscape" className="hover:opacity-80 transition-opacity"><p className="text-4xl font-bold text-primary">10</p><p className="text-sm text-muted-foreground mt-1 underline underline-offset-2">{t('profiles.investmentDomains')}</p></Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">{t('services.title')}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Database className="h-6 w-6" />,
              title: t('services.miTitle'),
              desc: t('services.miDesc'),
              features: [t('services.miF1'), t('services.miF2'), t('services.miF3')],
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: t('services.fiTitle'),
              desc: t('services.fiDesc'),
              features: [t('services.fiF1'), t('services.fiF2'), t('services.fiF3')],
            },
            {
              icon: <TrendingUp className="h-6 w-6" />,
              title: t('services.psTitle'),
              desc: t('services.psDesc'),
              features: [t('services.psF1'), t('services.psF2'), t('services.psF3')],
            },
            {
              icon: <ArrowRight className="h-6 w-6" />,
              title: t('services.crTitle'),
              desc: t('services.crDesc'),
              features: [t('services.crF1'), t('services.crF2'), t('services.crF3')],
            },
          ].map((service) => (
            <Card key={service.title} className="flex flex-col">
              <CardContent className="pt-6 flex-1">
                <div className="rounded-md bg-primary/10 p-2 w-fit text-primary mb-4">{service.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Expertise Section */}
      <section className="border-t border-border/40 bg-muted/30" id="expertise">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">{t('expertise.title')}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {t('expertise.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { title: t('expertise.esTitle'), desc: t('expertise.esDesc') },
              { title: t('expertise.aiTitle'), desc: t('expertise.aiDesc') },
              { title: t('expertise.miTitle'), desc: t('expertise.miDesc') },
            ].map((area) => (
              <Card key={area.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3 text-primary">{area.title}</h3>
                  <p className="text-sm text-muted-foreground">{area.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 max-w-5xl mx-auto mt-16 text-center">
            <div><p className="text-3xl font-bold text-primary">{t('expertise.bootstrap')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.bootstrapSub')}</p></div>
            <div><p className="text-3xl font-bold text-primary">{t('expertise.preSeed')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.preSeedSub')}</p></div>
            <div><p className="text-3xl font-bold text-primary">{t('expertise.seed')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.seedSub')}</p></div>
            <div><p className="text-3xl font-bold text-primary">{t('expertise.seriesA')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.seriesASub')}</p></div>
            <div><p className="text-3xl font-bold text-primary">{t('expertise.seriesB')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.seriesBSub')}</p></div>
            <div><p className="text-3xl font-bold text-primary">{t('expertise.seriesC')}</p><p className="text-xs text-muted-foreground mt-1">{t('expertise.seriesCSub')}</p></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center" id="contact">
        <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          {t('cta.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <a href="https://calendly.com/mfinocchiaro/15min" target="_blank" rel="noopener noreferrer">
              <Mail className="h-5 w-5" />
              {t('cta.scheduleCall')}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://l6ttgr1jhsxnwfgh.public.blob.vercel-storage.com/VC%20Diligence%20Brief.pdf" target="_blank" rel="noopener noreferrer">
              {t('cta.viewSampleReport')}
            </a>
          </Button>
        </div>
      </section>

      {/* Full Access CTA */}
      <section className="container mx-auto px-4 py-12 text-center">
        <Link href="/pricing">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8 py-6 gap-2 shadow-lg">
            {t('cta.fullAccess')}
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>{tCommon('footer.copyrightFino', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">{tCommon('footer.pricing')}</Link>
            <Link href="/about" className="hover:text-foreground">{tCommon('footer.about')}</Link>
            <Link href="/auth/login" className="hover:text-foreground">{tCommon('footer.signIn')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
