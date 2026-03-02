import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Database, TrendingUp, Users } from "lucide-react"
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpg"
              alt="ThreadMoat"
              width={40}
              height={40}
              className="rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-xl font-bold">ThreadMoat</span>
          </div>
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
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.jpg"
            alt="ThreadMoat Logo"
            width={120}
            height={120}
            className="rounded-xl shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Navigate the Future of
          <br />
          <span className="text-primary">Industrial AI & Engineering Software</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Leverage 35+ years of market expertise, exclusive access to over 500 startups backed by $13.2B+ in VC investment, and warm
          introductions to 100+ founders to build your portfolio with tomorrow{"'"}s unicorns.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <Database className="h-5 w-5" />
              View Database
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>
      {/* Features Section */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <h2 className="text-center text-3xl font-bold">Why ThreadMoat?</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Database className="h-10 w-10" />}
              title="Comprehensive Startup Database"
              description="Access detailed profiles on 500+ AI-driven CAD, CAM, and PLM startups reshaping industrial software."
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10" />}
              title="Expert Analysis"
              description="Benefit from 35+ years of PLM market intelligence and deep industry expertise to identify high-potential investments."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Investor Network"
              description="Get warm introductions to 100+ founders and connect directly with the entrepreneurs building the future."
            />
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-4xl font-bold text-primary">500+</p>
            <p className="mt-2 text-muted-foreground">Startups Tracked</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary">$13.2B+</p>
            <p className="mt-2 text-muted-foreground">VC Investment (as of March 2026)</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary">35+</p>
            <p className="mt-2 text-muted-foreground">Years of Market Expertise</p>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold">Ready to discover your next investment?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start your subscription today and get full access to the ThreadMoat startup database.
        </p>
        <div className="mt-8">
          <Link href="/auth/sign-up">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/auth/login" className="hover:text-foreground">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-6">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  )
}
