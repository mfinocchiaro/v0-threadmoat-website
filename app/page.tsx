import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Database, Users, TrendingUp, Mail, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="https://threadmoat.vercel.app/finocchiaro-logo.png"
              alt="ThreadMoat"
              width={150}
              height={40}
              className="h-10 w-auto"
              unoptimized
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#expertise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Expertise</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="mailto:fino@demystifyingplm.com">Schedule Call</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Trusted by Leading Investment Firms
        </div>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl mb-6">
          Navigate the Future of{" "}
          <span className="text-primary">Industrial AI &amp; Engineering Software</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Leverage 35+ years of market expertise, exclusive access to nearly 300 startups, and warm
          introductions to 100+ founders to build your portfolio with tomorrow&apos;s unicorns.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <Database className="h-5 w-5" />
              View Database
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">View Pricing</Button>
          </Link>
        </div>
      </section>

      {/* Organization Selector */}
      <section className="border-t border-border/40 bg-muted/30" id="services">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-center text-3xl font-bold mb-4">Tell us about your organization</h2>
          <p className="text-center text-muted-foreground mb-12">Select the option that best describes you</p>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { title: "Established Company", desc: "Engineering software, PLM, or Industrial AI company" },
              { title: "Startup", desc: "Engineering software, PLM, or Industrial AI startup" },
              { title: "VC or PE Firm", desc: "Investment firm seeking opportunities" },
            ].map((org) => (
              <Card key={org.title} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{org.title}</h3>
                  <p className="text-sm text-muted-foreground">{org.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 text-center">
            <div><p className="text-4xl font-bold text-primary">35+</p><p className="text-sm text-muted-foreground mt-1">Years of Market Experience</p></div>
            <div><p className="text-4xl font-bold text-primary">~300</p><p className="text-sm text-muted-foreground mt-1">Startups in Database</p></div>
            <div><p className="text-4xl font-bold text-primary">~100</p><p className="text-sm text-muted-foreground mt-1">Warm Founder Introductions</p></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Personalized Services for Strategic Investors</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            We provide comprehensive support to help VCs and PEs identify, evaluate, and connect with the most promising startups in engineering software and Industrial AI.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Database className="h-6 w-6" />,
              title: "Market Intelligence",
              desc: "Access our curated database of nearly 300 engineering software and Industrial AI startups.",
              features: ["Comprehensive startup profiles", "Market trend analysis", "Investment readiness assessments"],
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: "Founder Introductions",
              desc: "Leverage our extensive network to secure warm introductions to nearly 100 founders.",
              features: ["Pre-vetted founder relationships", "Facilitated meetings", "Ongoing relationship management"],
            },
            {
              icon: <TrendingUp className="h-6 w-6" />,
              title: "Portfolio Strategy",
              desc: "Develop a winning investment thesis with our deep domain expertise in engineering software.",
              features: ["Sector-specific strategy", "Technical due diligence", "Market sizing and assessment"],
            },
            {
              icon: <ArrowRight className="h-6 w-6" />,
              title: "Custom Research",
              desc: "Commission tailored research reports on specific market segments or competitive dynamics.",
              features: ["Deep-dive market reports", "Competitive intelligence", "Emerging trend identification"],
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
            <h2 className="text-3xl font-bold">Decades of Deep Domain Expertise</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              With over 35 years immersed in the engineering software and Industrial AI markets, we bring unparalleled insight into technology trends, market dynamics, and the founders shaping the future of industrial innovation.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { title: "Engineering Software", desc: "PLM, CAD, CAE, simulation, digital twin, generative design, and next-generation design tools transforming product development." },
              { title: "Industrial AI", desc: "Machine learning for manufacturing, predictive maintenance, computer vision for quality control, and AI-powered optimization." },
              { title: "Market Intelligence", desc: "Comprehensive understanding of buyer personas, sales cycles, competitive dynamics, and go-to-market strategies in B2B industrial tech." },
            ].map((area) => (
              <Card key={area.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3 text-primary">{area.title}</h3>
                  <p className="text-sm text-muted-foreground">{area.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mt-16 text-center">
            <div><p className="text-3xl font-bold text-primary">300+</p><p className="text-xs text-muted-foreground mt-1">Startups Tracked</p></div>
            <div><p className="text-3xl font-bold text-primary">Series A-C</p><p className="text-xs text-muted-foreground mt-1">Growth Stage</p></div>
            <div><p className="text-3xl font-bold text-primary">Seed</p><p className="text-xs text-muted-foreground mt-1">Early Stage</p></div>
            <div><p className="text-3xl font-bold text-primary">Pre-Seed</p><p className="text-xs text-muted-foreground mt-1">Emerging</p></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center" id="contact">
        <h2 className="text-3xl font-bold mb-4">Ready to Build Your Portfolio?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Let&apos;s discuss how our expertise and network can help you identify and invest in the next generation of engineering software and Industrial AI unicorns.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <a href="mailto:fino@demystifyingplm.com">
              <Mail className="h-5 w-5" />
              Schedule a Call
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://l6ttgr1jhsxnwfgh.public.blob.vercel-storage.com/VC%20Diligence%20Brief.pdf" target="_blank" rel="noopener noreferrer">
              View Sample Report
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Finocchiaro Consulting / ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/auth/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
