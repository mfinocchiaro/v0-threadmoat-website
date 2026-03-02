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
    id: "threadmoat-analytics-monthly",
    name: "Analytics",
    description: "Full access to curated market intelligence and analytics dashboards",
    priceInCents: 19900, // $199/month
    interval: "month",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables",
      "Weekly release notes (\"what changed\")",
      "500+ curated company profiles",
    ],
  },
  {
    id: "threadmoat-analytics-yearly",
    name: "Analytics (Annual)",
    description: "Full access with annual billing - save $389/year",
    priceInCents: 199900, // $1,999/year
    interval: "year",
    features: [
      "All dashboards + filters + saved views",
      "Watchlists + alerts (weekly digest email)",
      "Exports: charts + aggregated tables",
      "Weekly release notes (\"what changed\")",
      "500+ curated company profiles",
      "2 months free",
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === productId)
}
