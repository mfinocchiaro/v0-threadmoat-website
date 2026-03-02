import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Check } from "lucide-react"
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

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Get full access to the ThreadMoat database with our Pro subscription.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="flex flex-col rounded-lg border border-border/40 bg-card p-8"
            >
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">
                  ${(product.priceInCents / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">/{product.interval}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/sign-up" className="mt-8">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          ))}
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
