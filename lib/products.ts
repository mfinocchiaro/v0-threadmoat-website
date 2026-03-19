export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  mode: "payment" | "subscription"
  interval?: "month" | "year"
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: "market-report-2026-q1",
    name: "2026 Q1 Market State Report",
    description:
      "Engineering Software & Industrial AI — 150+ page analysis covering 600+ companies, >$16B in VC funding, M&A trends, and 5-year market forecasts.",
    priceInCents: 499900, // $4,999
    mode: "payment",
    features: [
      "150+ page deep-dive analysis",
      "600+ companies, >$16B VC funding mapped",
      "Incumbent landscape — $22–24B anchor vendors",
      "Startup ecosystem — 10 investment categories",
      "$50B+ M&A consolidation analysis (2022–2025)",
      "5-year market forecast ($120–140B by 2028)",
      "Top 10 company rankings with scoring methodology",
      "Delivered as PDF within 24 hours of purchase",
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find(p => p.id === productId)
}
