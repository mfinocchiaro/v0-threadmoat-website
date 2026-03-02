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
    id: "threadmoat-pro-monthly",
    name: "ThreadMoat Pro",
    description: "Full access to the ThreadMoat database with monthly billing",
    priceInCents: 2999, // $29.99/month
    interval: "month",
    features: [
      "Unlimited database access",
      "Real-time threat intelligence",
      "API access",
      "Priority support",
    ],
  },
  {
    id: "threadmoat-pro-yearly",
    name: "ThreadMoat Pro (Annual)",
    description: "Full access to the ThreadMoat database with annual billing - save 20%",
    priceInCents: 28788, // $287.88/year ($23.99/month equivalent)
    interval: "year",
    features: [
      "Unlimited database access",
      "Real-time threat intelligence",
      "API access",
      "Priority support",
      "2 months free",
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId)
}
