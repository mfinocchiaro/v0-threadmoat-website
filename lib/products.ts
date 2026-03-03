export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: "month" | "year"
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "analytics-monthly",
    name: "Analytics — Monthly",
    description: "Self-serve analytics access, billed monthly",
    priceInCents: 19900, // $199/month
    interval: "month",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables (no directory dump)",
      "Weekly release notes ("what changed")",
    ],
  },
  {
    id: "analytics-yearly",
    name: "Analytics — Annual",
    description: "Self-serve analytics access, billed annually — save ~$389",
    priceInCents: 199900, // $1,999/year
    interval: "year",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables (no directory dump)",
      "Weekly release notes ("what changed")",
      "Two months free vs. monthly",
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find(p => p.id === productId)
}
