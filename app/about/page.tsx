import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, BookOpen, Mail } from "lucide-react"
import { FaYoutube, FaSpotify, FaApple, FaAmazon, FaDeezer, FaLinkedin } from "react-icons/fa6"

export default function AboutPage() {
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
            <Link href="/about" className="text-sm font-medium text-foreground transition-colors">About</Link>
            <Link href="/about#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="https://calendly.com/mfinocchiaro/15min" target="_blank" rel="noopener noreferrer">Schedule Call</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Section 1: About ThreadMoat — text left, screenshot right */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-5">
            <h1 className="text-3xl font-bold tracking-tight">
              About <span className="text-primary">ThreadMoat</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              ThreadMoat is the market intelligence platform for Industrial AI and engineering software,
              built and maintained by Michael Finocchiaro &mdash; an independent analyst with 30+ years
              at Dassault Syst&egrave;mes, PTC, IBM, and HP, now advising the companies disrupting them.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every profile is hand-curated &mdash; not scraped or AI-hallucinated &mdash;
              and updated weekly with funding events, product launches, and competitive scoring.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {[
                { stat: "600+", label: "Startups Tracked" },
                { stat: ">$16B", label: "VC Funding Mapped" },
                { stat: "43", label: "Countries" },
                { stat: "10", label: "Market Subsegments" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-primary">{s.stat}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 md:w-[480px] relative overflow-hidden rounded-lg border border-border/40 shadow-lg">
            <div className="flex animate-screenshot-cycle" style={{ width: "300%" }}>
              <Image
                src="/threadmoat-screenshot.jpg"
                alt="ThreadMoat Dashboard — Network Graph visualization"
                width={480}
                height={360}
                className="w-1/3 shrink-0 object-cover"
                unoptimized
              />
              <Image
                src="/threadmoat-screenshot-periodic.jpg"
                alt="ThreadMoat Dashboard — Periodic Table of Startups"
                width={480}
                height={360}
                className="w-1/3 shrink-0 object-cover"
                unoptimized
              />
              <Image
                src="/threadmoat-screenshot-investor.jpg"
                alt="ThreadMoat Dashboard — Investor Statistics"
                width={480}
                height={360}
                className="w-1/3 shrink-0 object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: About Michael Finocchiaro — headshot left, bio right */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-12 items-start">
            <div className="flex flex-col items-center md:items-start shrink-0">
              <Image
                src="/michael-finocchiaro.jpeg"
                alt="Michael Finocchiaro"
                width={240}
                height={240}
                className="rounded-full border-4 border-primary/20"
                unoptimized
              />
              <h2 className="mt-4 text-xl font-semibold text-center md:text-left">Michael Finocchiaro</h2>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Industry Analyst &middot; Consultant &middot; Advisor
              </p>
              <p className="text-xs text-muted-foreground mt-1">Paris, France</p>
            </div>
            <div className="flex-1 space-y-5">
              <h2 className="text-2xl font-bold tracking-tight">
                About <span className="text-primary">Michael Finocchiaro</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Michael is an independent senior PLM and manufacturing industry analyst and the host of
                <em> AI Across the Product Lifecycle</em> and <em>The Future of PLM</em> podcasts, focused
                on digital thread and industrial AI adoption across engineering and manufacturing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With 30+ years at Dassault Syst&egrave;mes (Sr. Director, 3DEXPERIENCE), PTC, IBM, and HP,
                Michael now advises startups and industrial companies on positioning, go-to-market strategy,
                and enterprise deployment. He is also the author of <em>Kernel Wars</em> &mdash; a history
                of CAD, PLM, and the geometric kernel battles that shaped the industry.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <FaLinkedin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">26K+ Followers on LinkedIn</span>
              </div>
              <div className="pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Worked At</p>
                <div className="flex items-center gap-4">
                  {[
                    { name: "IBM", logo: "/logos/companies/ibm.png", href: "https://www.ibm.com" },
                    { name: "HP", logo: "/logos/companies/hp.png", href: "https://www.hp.com" },
                    { name: "PTC", logo: "/logos/companies/ptc.png", href: "https://www.ptc.com" },
                    { name: "Dassault Syst\u00e8mes", logo: "/logos/companies/dassault.png", href: "https://www.3ds.com" },
                    { name: "Aras", logo: "/logos/companies/aras.png", href: "https://www.aras.com" },
                  ].map(company => (
                    <a
                      key={company.name}
                      href={company.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={company.name}
                      className="rounded-lg border border-border/40 bg-background p-2 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain"
                        unoptimized
                      />
                    </a>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Worked With</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: "Airbus", logo: "/logos/companies/airbus.png", href: "https://www.airbus.com" },
                    { name: "Boeing", logo: "/logos/companies/boeing.png", href: "https://www.boeing.com" },
                    { name: "NASA", logo: "/logos/companies/nasa.png", href: "https://www.nasa.gov" },
                    { name: "Lockheed Martin", logo: "/logos/companies/lockheed-martin.png", href: "https://www.lockheedmartin.com" },
                    { name: "BAE Systems", logo: "/logos/companies/bae-systems.png", href: "https://www.baesystems.com" },
                    { name: "Pratt & Whitney", logo: "/logos/companies/pratt-whitney.png", href: "https://www.prattwhitney.com" },
                    { name: "Safran", logo: "/logos/companies/safran.png", href: "https://www.safrangroup.com" },
                    { name: "Dassault Aviation", logo: "/logos/companies/dassault-aviation.png", href: "https://www.dassault-aviation.com" },
                    { name: "Naval Group", logo: "/logos/companies/naval-group.png", href: "https://www.naval-group.com" },
                    { name: "Thales", logo: "/logos/companies/thales.png", href: "https://www.thalesgroup.com" },
                    { name: "TE Connectivity", logo: "/logos/companies/te-connectivity.png", href: "https://www.te.com" },
                    { name: "Procter & Gamble", logo: "/logos/companies/pg.png", href: "https://www.pg.com" },
                    { name: "Nike", logo: "/logos/companies/nike.png", href: "https://www.nike.com" },
                    { name: "Unilever", logo: "/logos/companies/unilever.png", href: "https://www.unilever.com" },
                    { name: "Volkswagen", logo: "/logos/companies/volkswagen.png", href: "https://www.volkswagen.com" },
                    { name: "Renault", logo: "/logos/companies/renault.png", href: "https://www.renault.com" },
                    { name: "Schlumberger", logo: "/logos/companies/slb.png", href: "https://www.slb.com" },
                    { name: "GE Healthcare", logo: "/logos/companies/ge-healthcare.png", href: "https://www.gehealthcare.com" },
                    { name: "Dell", logo: "/logos/companies/dell.png", href: "https://www.dell.com" },
                    { name: "Rolex", logo: "/logos/companies/rolex.png", href: "https://www.rolex.com" },
                    { name: "Foxconn", logo: "/logos/companies/foxconn.png", href: "https://www.foxconn.com" },
                    { name: "Meyer Werft", logo: "/logos/companies/meyer-werft.png", href: "https://www.meyerwerft.de" },
                    { name: "BOBST", logo: "/logos/companies/bobst.png", href: "https://www.bobst.com" },
                    { name: "KTM", logo: "/logos/companies/ktm.png", href: "https://www.ktm.com" },
                    { name: "Manitowoc", logo: "/logos/companies/manitowoc.png", href: "https://www.manitowoc.com" },
                    { name: "WABCO", logo: "/logos/companies/wabco.png", href: "https://www.wabco-auto.com" },
                    { name: "AGCO", logo: "/logos/companies/agco.png", href: "https://www.agcocorp.com" },
                    { name: "Aker Solutions", logo: "/logos/companies/aker-solutions.png", href: "https://www.akersolutions.com" },
                    { name: "CAE", logo: "/logos/companies/cae.png", href: "https://www.cae.com" },
                    { name: "Harman", logo: "/logos/companies/harman.png", href: "https://www.harman.com" },
                    { name: "ENI", logo: "/logos/companies/eni.png", href: "https://www.eni.com" },
                    { name: "Reebok", logo: "/logos/companies/reebok.png", href: "https://www.reebok.com" },
                    { name: "Methode Electronics", logo: "/logos/companies/methode.png", href: "https://www.methode.com" },
                    { name: "Richemont", logo: "/logos/companies/richemont.png", href: "https://www.richemont.com" },
                    { name: "Siemens", logo: "/logos/companies/siemens.png", href: "https://www.siemens.com" },
                    { name: "Porsche", logo: "/logos/companies/porsche.png", href: "https://www.porsche.com" },
                  ].map(company => (
                    <a
                      key={company.name}
                      href={company.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={company.name}
                      className="rounded-lg border border-border/40 bg-background p-1.5 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                        unoptimized
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Threaded! — text left, logo right */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-bold">
              Threaded! <span className="text-primary">Conference Series</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Threaded! brings together startups and industry leaders for fast-paced working sessions
              on how AI is transforming engineering and manufacturing. Presenters must explicitly show
              how their products connect to the digital thread &mdash; what systems they integrate with,
              what decisions they improve, and what measurable outcomes they enable.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Co-sponsored by Aras Corporation and the <em>AI Across the Product Lifecycle</em> podcast,
              Threaded! connects next-generation solution providers with enterprise leaders across PLM
              and the digital thread. Guided solution sharing and structured feedback help founders
              refine product direction, sharpen ICPs, and build credible proof points that resonate
              with enterprise buyers.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-lg border border-border/40 bg-card px-4 py-3 text-center">
                <p className="text-sm font-semibold">Threaded! Warwick</p>
                <p className="text-xs text-muted-foreground">at Develop3D Live</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-card px-4 py-3 text-center">
                <p className="text-sm font-semibold">Threaded! Miami</p>
                <p className="text-xs text-muted-foreground">at Aras ACE 2026</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-card px-4 py-3 text-center">
                <p className="text-sm font-semibold">More dates</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <div className="pt-2">
              <Button asChild>
                <a href="https://threaded.live" target="_blank" rel="noopener noreferrer">
                  Visit threaded.live
                </a>
              </Button>
            </div>
          </div>
          <div className="shrink-0 md:w-[360px]">
            <Image
              src="/threaded-logo.jpg"
              alt="Threaded! Conference"
              width={360}
              height={120}
              className="rounded-lg"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* Section 4: Podcasts & Content */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12">Podcasts &amp; Content</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {/* AI Across the Product Lifecycle */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                    <Mic className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">AI Across the Product Lifecycle</h3>
                  <p className="text-sm text-muted-foreground">
                    Candid conversations with founders, CTOs, and enterprise leaders building and deploying
                    AI in engineering and manufacturing. Deep-tech startups, real adoption stories.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a href="https://www.youtube.com/@TheFutureOfPLM" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaYoutube className="h-4 w-4 text-[#FF0000]" /> YouTube
                    </a>
                    <a href="https://podcasts.apple.com/us/podcast/ai-across-the-product-lifecycle-podcast/id1802500855" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaApple className="h-4 w-4 text-[#A855F7]" /> Apple Podcasts
                    </a>
                    <a href="https://open.spotify.com/show/17QLxn46pk4fbPv1wLqaI2?si=CFnFeoPvTny13JLA7gTImw" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaSpotify className="h-4 w-4 text-[#1DB954]" /> Spotify
                    </a>
                    <a href="https://music.amazon.com/podcasts/38240867-f48d-4185-85d1-272f780691a1/ai-across-the-product-lifecycle-podcast" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaAmazon className="h-4 w-4 text-[#FF9900]" /> Amazon Music
                    </a>
                    <a href="https://www.deezer.com/us/show/1002732531" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaDeezer className="h-4 w-4 text-[#A238FF]" /> Deezer
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* The Future of PLM */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">The Future of PLM</h3>
                  <p className="text-sm text-muted-foreground">
                    Video podcast featuring industry thought leaders discussing the evolution of product
                    lifecycle management, digital thread strategy, and market dynamics.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a href="https://www.youtube.com/@TheFutureOfPLM" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-primary/10 transition-colors">
                      <FaYoutube className="h-4 w-4 text-[#FF0000]" /> YouTube
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Where to connect with me */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-8">Where to connect with me</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://www.linkedin.com/in/mfinocchiaro" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-5 py-3 text-sm font-medium hover:border-primary/50 transition-colors">
              <FaLinkedin className="h-5 w-5 text-[#0A66C2]" /> LinkedIn
            </a>
            <a href="https://demystifyingplm.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-5 py-3 text-sm font-medium hover:border-primary/50 transition-colors">
              <Image src="/demystifyingplm-logo.png" alt="DemystifyingPLM" width={80} height={20} className="h-5 w-auto object-contain" unoptimized />
            </a>
            <a href="mailto:fino@demystifyingplm.com"
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-5 py-3 text-sm font-medium hover:border-primary/50 transition-colors">
              <Mail className="h-5 w-5" /> Email
            </a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Based in Paris &middot; Bilingual French/English &middot; Working across US and EU time zones
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Finocchiaro Consulting / ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/auth/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
