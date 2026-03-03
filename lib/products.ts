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
    description: "Premium written analysis and updates. (Analytics access only; dataset access sold separately.)",
    priceInCents: 19900, // $199/month
    interval: "month",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables (no directory dump)",
      "Weekly release notes (\u201cwhat changed\u201d)",
    ],
  },
  {
    id: "analytics-yearly",
    name: "Analytics — Annual",
    description: "Premium written analysis and updates, billed annually — save ~$389. (Analytics access only; dataset access sold separately.)",
    priceInCents: 199900, // $1,999/year
    interval: "year",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables (no directory dump)",
      "Weekly release notes (\u201cwhat changed\u201d)",
      "Two months free vs. monthly",
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find(p => p.id === productId)
}
