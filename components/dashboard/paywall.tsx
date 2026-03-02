import Link from "next/link"
import { Check, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/products"
import { CheckoutButton } from "@/components/checkout/checkout-button"

type User = {
  id: string
  email: string
  profile_type: string
  company_name: string | null
  title: string | null
  is_admin: boolean
}

export function Paywall({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ThreadMoat</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{user.email}</span>
          </div>
        </div>
      </header>
      {/* Paywall Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Subscribe to Access the Database</h1>
          <p className="mt-4 text-muted-foreground">
            You&apos;re signed in as {user.email}. Subscribe to ThreadMoat Analytics to unlock
            full access to the Industrial AI &amp; Engineering Software market intelligence.
          </p>
        </div>
        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
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
              <div className="mt-8">
                <CheckoutButton productId={product.id} userEmail={user.email} />
              </div>
            </div>
          ))}
        </div>
        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
