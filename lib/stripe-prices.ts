/**
 * Stripe Price ID Configuration & Mapping
 *
 * Maps between Stripe Price IDs (from dashboard) and internal product IDs
 * (used by getAccessTier in lib/tiers.ts). All Price IDs are env-var driven
 * so test and live modes use different values.
 *
 * Products:
 *   Analyst    — one-time $4,999 purchase (1 report + 10 charts)
 *   Strategist — annual €18,999 subscription (4 reports + 25+ charts)
 *
 * Env vars:
 *   STRIPE_PRICE_ANALYST             — Price ID for Analyst one-time purchase
 *   STRIPE_PRICE_STRATEGIST_ANNUAL   — Price ID for Strategist annual subscription
 */

/** Stripe Price IDs keyed by internal product identifier */
export const STRIPE_PRICES: Record<string, string> = {
  analyst: process.env.STRIPE_PRICE_ANALYST || '',
  strategist_annual: process.env.STRIPE_PRICE_STRATEGIST_ANNUAL || '',
}

/**
 * Internal product IDs that map to what getAccessTier() expects.
 * Keys here match STRIPE_PRICES keys; values match product IDs in
 * lib/tiers.ts.
 *
 * Analyst (one-time) → 'analyst' tier access
 * Strategist (annual) → 'strategist' tier access
 */
const INTERNAL_PRODUCT_IDS: Record<string, string> = {
  analyst: 'analyst_annual',
  strategist_annual: 'strategist_annual',
}

/**
 * Resolve a Stripe Price ID to the internal product_id used by getAccessTier.
 *
 * Iterates STRIPE_PRICES to find the key whose value matches the given
 * stripePriceId, then returns the corresponding internal product ID.
 * Falls back to the raw stripePriceId if no match is found (safe default
 * for coupon/manual subscriptions).
 */
export function getInternalProductId(stripePriceId: string): string {
  for (const [key, priceId] of Object.entries(STRIPE_PRICES)) {
    if (priceId && priceId === stripePriceId) {
      return INTERNAL_PRODUCT_IDS[key] ?? key
    }
  }
  return stripePriceId
}

/**
 * Look up the Stripe Price ID for a given internal product ID.
 *
 * Returns undefined if no mapping exists (e.g. coupon-granted access,
 * free trials, or products not yet configured in Stripe).
 */
export function getStripePriceId(internalProductId: string): string | undefined {
  // Direct key match (e.g. "analyst_annual")
  const directMatch = STRIPE_PRICES[internalProductId]
  if (directMatch) return directMatch

  // Reverse lookup through INTERNAL_PRODUCT_IDS (e.g. "market-report-2026-q1" → "market_report_q1")
  for (const [key, internalId] of Object.entries(INTERNAL_PRODUCT_IDS)) {
    if (internalId === internalProductId) {
      const priceId = STRIPE_PRICES[key]
      if (priceId) return priceId
    }
  }

  return undefined
}
