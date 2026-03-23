/**
 * Stripe Price ID Configuration & Mapping
 *
 * Maps between Stripe Price IDs (from dashboard) and internal product IDs
 * (used by getAccessTier in lib/tiers.ts). All Price IDs are env-var driven
 * so test and live modes use different values.
 *
 * Env vars:
 *   STRIPE_PRICE_ANALYST_ANNUAL     — Price ID for Analyst annual subscription
 *   STRIPE_PRICE_STRATEGIST_ANNUAL  — Price ID for Strategist annual subscription
 *   STRIPE_PRICE_REPORT_Q1          — Price ID for 2026 Q1 Market Report (one-time)
 */

/** Stripe Price IDs keyed by internal product identifier */
export const STRIPE_PRICES: Record<string, string> = {
  analyst_annual: process.env.STRIPE_PRICE_ANALYST_ANNUAL || '',
  strategist_annual: process.env.STRIPE_PRICE_STRATEGIST_ANNUAL || '',
  market_report_q1: process.env.STRIPE_PRICE_REPORT_Q1 || '',
}

/**
 * Internal product IDs that map to what getAccessTier() expects.
 * Keys here match STRIPE_PRICES keys; values match product IDs in
 * lib/products.ts and lib/tiers.ts.
 */
const INTERNAL_PRODUCT_IDS: Record<string, string> = {
  analyst_annual: 'analyst_annual',
  strategist_annual: 'strategist_annual',
  market_report_q1: 'market-report-2026-q1',
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
