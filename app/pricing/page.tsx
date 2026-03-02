import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Check, Database, RefreshCw, BarChart3, FileText, Building2 } from "lucide-react"
import { PRODUCTS } from "@/lib/products"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ThreadMoat</span>
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

      {/* Value Proposition */}
      <section className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-balance">Built for Decision-Making, Not Browsing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
            500+ high-relevance companies (not 50,000 generic profiles). Each company tagged with technical approach, workflow insertion point, buyer persona, and competitive adjacency.
          </p>
        </div>

        {/* Data Quality Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm">
            <RefreshCw className="h-4 w-4 text-primary" />
            <span>Updated Weekly (Mondays CET)</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm">
            <Database className="h-4 w-4 text-primary" />
            <span>500+ Curated Companies</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Domain Expert Taxonomy</span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {/* Analytics Plans */}
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={`flex flex-col rounded-lg border bg-card p-8 ${
                product.interval === "year" ? "border-primary ring-1 ring-primary" : "border-border/40"
              }`}
            >
              {product.interval === "year" && (
                <span className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Best Value
                </span>
              )}
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">
                  ${(product.priceInCents / 100).toLocaleString()}
                </span>
                <span className="text-muted-foreground">/{product.interval}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/sign-up" className="mt-8">
                <Button className="w-full" variant={product.interval === "year" ? "default" : "outline"}>
                  Get Started
                </Button>
              </Link>
            </div>
          ))}

          {/* Enterprise Tier */}
          <div className="flex flex-col rounded-lg border border-border/40 bg-card p-8">
            <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-semibold">Enterprise / VC / PE</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Custom reports, briefings, and consulting for institutional investors
            </p>
            <div className="mt-6">
              <span className="text-2xl font-bold">Custom Pricing</span>
            </div>
            <ul className="mt-8 flex-1 space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-sm">Everything in Analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-sm">Custom reports + briefings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-sm">Consulting engagements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-sm">Controlled dataset access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <span className="text-sm">Bespoke exports under contract</span>
              </li>
            </ul>
            <a href="https://calendly.com/mfinocchiaro/15min" target="_blank" rel="noopener noreferrer" className="mt-8">
              <Button className="w-full" variant="outline">Contact Us</Button>
            </a>
          </div>
        </div>

        {/* No Raw Data Note */}
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          Analytics access only. Raw directory data available exclusively via Enterprise engagement.
        </p>
      </section>

      {/* Methodology Section */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">What We Track</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Our technical taxonomy is maintained by domain experts with 35+ years of market experience in engineering software and Industrial AI.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                "Technical Stack & Approach",
                "Integration Points",
                "Workflow Insertion Point",
                "Buyer Persona",
                "Competitive Adjacency",
                "Funding & Investors",
                "Company Maturity",
                "Market Segment",
                "Growth Signals",
              ].map((field) => (
                <div key={field} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card px-4 py-3">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{field}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">
              Home
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
