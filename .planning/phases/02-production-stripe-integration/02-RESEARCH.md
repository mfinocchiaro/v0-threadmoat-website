# Phase 2: Production Stripe Integration - Research

**Researched:** 2026-03-23
**Domain:** Stripe payments, subscription lifecycle, billing portal
**Confidence:** HIGH

## Summary

The ThreadMoat codebase already has a well-structured Stripe integration in sandbox mode. The checkout flow uses Next.js Server Actions (`app/actions/stripe.ts`), a webhook handler covering 5 event types (`app/api/webhooks/stripe/route.ts`), a billing portal redirect (`ManageSubscriptionButton`), and a tier-based access control system (`lib/tiers.ts`). The database schema (Neon Postgres) has `profiles`, `subscriptions`, and `purchases` tables with the right columns.

Going live requires: (1) creating Stripe Products and Prices in the live dashboard to replace the inline `price_data` approach used today, (2) swapping sandbox API keys for production keys, (3) registering a production webhook endpoint, (4) configuring the Customer Portal in the live Stripe dashboard, and (5) verifying end-to-end flows with real cards. The code changes are relatively small -- the biggest architectural shift is moving from inline `price_data` to stored Stripe Price IDs, which is required for the billing portal's upgrade/downgrade flows to work.

**Primary recommendation:** Create Stripe Products and Prices in the live dashboard first, then update the codebase to reference those Price IDs. The billing portal cannot manage subscriptions created with inline `price_data` -- it requires actual Stripe Price objects.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Stripe live mode onboarding complete (production API keys configured) | Stripe go-live checklist documented below; env var swap required for STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET |
| PAY-02 | Checkout flow works end-to-end with production Stripe (subscribe, pay, access granted) | Current checkout architecture is sound; needs Price ID migration from inline price_data to stored Stripe Price IDs |
| PAY-03 | Subscription lifecycle management (upgrade, downgrade, cancel via billing portal) | Customer Portal must be configured in live Stripe dashboard; portal handles upgrade/downgrade/cancel automatically via webhooks |
| PAY-04 | Stripe webhook handles subscription events (created, updated, deleted, payment_failed) | Webhook already handles 5 events; needs `customer.subscription.created` added and `customer.subscription.trial_will_end` for completeness |
| PAY-05 | Billing portal accessible from dashboard for self-service management | `ManageSubscriptionButton` and `createBillingPortalSession` already exist; portal config needed in Stripe dashboard |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.2.0 (installed) / 20.4.1 (latest) | Stripe Node SDK | Already installed; minor version behind, upgrade optional |
| @neondatabase/serverless | (installed) | Database client | Already in use for subscription tracking |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | (installed) | Transactional email | Already wired for welcome/receipt emails in webhook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline price_data | Stripe Price IDs | Price IDs required for billing portal -- must migrate |
| Custom subscription UI | Stripe Customer Portal | Portal is hosted by Stripe, handles PCI, reduces code |

**No new packages needed.** This phase is configuration and code refactoring, not new library integration.

## Architecture Patterns

### Current Checkout Architecture (Already Built)
```
Pricing Page → Sign Up → Dashboard Settings
                              ↓
                    CheckoutButton (client)
                              ↓
                    createCheckoutSession (server action)
                              ↓
                    Stripe Checkout (hosted page)
                              ↓
                    Webhook: checkout.session.completed
                              ↓
                    DB: INSERT/UPSERT subscriptions
                              ↓
                    Access granted via tiers.ts
```

### Critical Architecture Change: Price ID Migration

**Current (inline price_data -- WILL NOT WORK for billing portal):**
```typescript
// app/actions/stripe.ts — current approach
price_data: {
  currency: 'usd',
  product_data: { name: product.name },
  unit_amount: product.priceInCents,
  recurring: { interval },
},
```

**Required (stored Stripe Price IDs):**
```typescript
// Required approach for billing portal + upgrade/downgrade
line_items: [
  {
    price: 'price_XXXXXXXXXXXXX', // Stripe Price ID from dashboard
    quantity: 1,
  },
],
```

**Why:** The Stripe Customer Portal needs real Price objects to offer upgrade/downgrade options. Inline `price_data` creates ad-hoc prices that the portal cannot reference. This is the single most important architectural change.

### Recommended Product/Price Setup in Stripe Dashboard

Create these in the **live** Stripe dashboard:

| Product | Price ID Pattern | Amount | Billing |
|---------|-----------------|--------|---------|
| 2026 Q1 Market Report | `price_report_*` | $4,999 | One-time |
| The Forge | `price_forge_annual_*` | $18,999/yr | Yearly recurring |
| The Red Keep | `price_redkeep_annual_*` | Custom | Yearly recurring |

### Product ID Mapping

The codebase uses internal `product_id` values for tier access control. These must map to Stripe Price IDs:

| Internal product_id | Stripe Price | Access Tier |
|---------------------|-------------|-------------|
| `explorer_trial` | (no Stripe price -- free trial) | Recon |
| `coupon_trial` | (no Stripe price -- coupon) | Recon |
| `forge_annual` | `price_forge_annual_*` | Forge |
| `friends_access` | (coupon-granted) | Forge |
| `investor_annual` | (coupon-granted) | Forge |
| `red_keep_annual` | `price_redkeep_annual_*` | Red Keep |
| `market-report-2026-q1` | `price_report_*` | (one-time purchase) |

### Recommended Config File for Price IDs

```typescript
// lib/stripe-prices.ts — NEW file
export const STRIPE_PRICES = {
  forge_annual: process.env.STRIPE_PRICE_FORGE_ANNUAL!,
  red_keep_annual: process.env.STRIPE_PRICE_RED_KEEP_ANNUAL!,
  market_report_q1: process.env.STRIPE_PRICE_REPORT_Q1!,
} as const

// Map Stripe Price ID back to internal product_id for tier resolution
export const PRICE_TO_PRODUCT: Record<string, string> = {
  [STRIPE_PRICES.forge_annual]: 'forge_annual',
  [STRIPE_PRICES.red_keep_annual]: 'red_keep_annual',
  [STRIPE_PRICES.market_report_q1]: 'market-report-2026-q1',
}
```

### Env Vars Needed

**Currently in `.env.local`:**
- `STRIPE_SECRET_KEY` -- exists (sandbox key)
- `STRIPE_WEBHOOK_SECRET` -- exists (no value set)

**Required for production:**
| Env Var | Purpose | Where to Get |
|---------|---------|-------------|
| `STRIPE_SECRET_KEY` | Live mode API key (sk_live_...) | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Live webhook signing secret (whsec_...) | Stripe Dashboard > Developers > Webhooks |
| `STRIPE_PRICE_FORGE_ANNUAL` | Price ID for Forge annual | Stripe Dashboard > Products |
| `STRIPE_PRICE_RED_KEEP_ANNUAL` | Price ID for Red Keep annual | Stripe Dashboard > Products |
| `STRIPE_PRICE_REPORT_Q1` | Price ID for Q1 report | Stripe Dashboard > Products |
| `NEXT_PUBLIC_BASE_URL` | Production URL for success/cancel redirects | Your domain |

**IMPORTANT:** Also set these in Vercel environment variables for production deployment.

### Anti-Patterns to Avoid
- **Using test keys in production:** Never mix sk_test_ and sk_live_ keys. The webhook secret must match the mode.
- **Hardcoding Price IDs in source code:** Use env vars so sandbox and production can use different Price IDs.
- **Skipping webhook signature verification:** Already correctly implemented -- do not remove.
- **Creating a new Stripe instance per request in the webhook handler:** The webhook route creates `new Stripe()` directly instead of using `getStripe()` from `lib/stripe.ts`. Minor inconsistency, not a blocker.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subscription management UI | Custom upgrade/downgrade/cancel forms | Stripe Customer Portal | PCI compliance, handles proration, payment method updates |
| Payment failure retry | Custom retry logic | Stripe Smart Retries | Stripe automatically retries failed payments with ML-optimized timing |
| Invoice generation | Custom invoice PDF | Stripe hosted invoices | `invoice.hosted_invoice_url` already available in webhook data |
| Proration calculation | Manual pro-rata math | Stripe proration | Portal handles this automatically when switching prices |

**Key insight:** The Stripe Customer Portal eliminates the need to build subscription management UI. Configure it once in the dashboard and let `createBillingPortalSession` (already built) handle everything.

## Common Pitfalls

### Pitfall 1: Sandbox Objects Don't Transfer to Live Mode
**What goes wrong:** Products, Prices, Customers, and Subscriptions created in test mode do not exist in live mode. You cannot reference test Price IDs in production.
**Why it happens:** Stripe maintains completely separate object spaces for test and live modes.
**How to avoid:** Create all Products and Prices in the live Stripe dashboard before switching keys. Verify Price IDs match env vars.
**Warning signs:** 404 errors or "resource not found" when creating checkout sessions.

### Pitfall 2: Webhook Endpoint Must Be Registered for Live Mode Separately
**What goes wrong:** You register a webhook for test mode but forget to create a separate live mode webhook endpoint.
**Why it happens:** Webhook registrations are also mode-specific.
**How to avoid:** In Stripe Dashboard > Developers > Webhooks, create a new endpoint for live mode pointing to your production URL (e.g., `https://threadmoat.com/api/webhooks/stripe`). Subscribe to the same events.
**Warning signs:** Payments succeed but database never updates; users pay but don't get access.

### Pitfall 3: Inline price_data Breaks Billing Portal
**What goes wrong:** The billing portal shows "No subscriptions" or can't offer upgrade/downgrade options.
**Why it happens:** `price_data` creates ephemeral prices that aren't linked to Stripe Products. The portal needs real Price objects to display plan options.
**How to avoid:** Migrate from `price_data` to stored Stripe Price IDs before going live.
**Warning signs:** Portal session creates successfully but shows empty state.

### Pitfall 4: product_id Mapping Disconnect
**What goes wrong:** User pays for Forge via Stripe, but `getAccessTier()` returns 'explorer' (wrong tier).
**Why it happens:** The webhook stores `subscription.items.data[0]?.price.id` (a Stripe Price ID like `price_abc123`) as `product_id` in the database, but `getAccessTier()` expects internal IDs like `forge_annual`.
**How to avoid:** In the webhook handler, map Stripe Price IDs back to internal product IDs before storing in the database.
**Warning signs:** Users complete checkout but can't access their tier's dashboards.

### Pitfall 5: NEXT_PUBLIC_BASE_URL Not Set in Production
**What goes wrong:** Success/cancel URLs point to `localhost:3000` or a Vercel preview URL.
**Why it happens:** The fallback chain in `createCheckoutSession` uses `VERCEL_URL` (which is a preview URL, not the production domain).
**How to avoid:** Set `NEXT_PUBLIC_BASE_URL` to the production domain (e.g., `https://threadmoat.com`) in Vercel environment variables.
**Warning signs:** After checkout, users redirected to wrong URL or see 404.

### Pitfall 6: Duplicate Webhook Processing
**What goes wrong:** Subscription gets double-updated or emails sent twice.
**Why it happens:** Stripe retries webhook delivery if your endpoint doesn't return 2xx within timeout.
**How to avoid:** The current handler uses `ON CONFLICT ... DO UPDATE` (idempotent) -- this is already correct. Keep it. For emails, they're already fire-and-forget with `.catch()` -- acceptable duplication.
**Warning signs:** Duplicate welcome/receipt emails.

## Code Examples

### Stripe Customer Portal Configuration (Dashboard)
Configure these settings in the Stripe Dashboard (Settings > Billing > Customer Portal):

1. **Subscriptions > Allow customers to switch plans:** Enable, add all subscription Prices
2. **Subscriptions > Allow cancellations:** Enable, set to cancel at end of period
3. **Payment methods > Allow updating:** Enable
4. **Invoice history:** Enable
5. **Custom branding:** Add ThreadMoat logo and brand colors

### Updated Checkout Session (with Price IDs)
```typescript
// app/actions/stripe.ts — updated for production
import { STRIPE_PRICES, PRICE_TO_PRODUCT } from '@/lib/stripe-prices'

// For subscription checkout:
const checkoutSession = await getStripe().checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [
    {
      price: STRIPE_PRICES.forge_annual, // Real Stripe Price ID
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/dashboard?checkout=success`,
  cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
  metadata: { user_id: userId, product_id: 'forge_annual' },
})
```

### Webhook Price-to-Product Mapping
```typescript
// In handleCheckoutCompleted — map Stripe Price ID to internal product_id
import { PRICE_TO_PRODUCT } from '@/lib/stripe-prices'

const stripePriceId = subscription.items.data[0]?.price.id ?? ''
const internalProductId = PRICE_TO_PRODUCT[stripePriceId] ?? stripePriceId

await sql`
  INSERT INTO subscriptions (user_id, stripe_subscription_id, product_id, ...)
  VALUES (${userId}, ${subscriptionId}, ${internalProductId}, ...)
  ...
`
```

### Missing Webhook Event: customer.subscription.created
```typescript
// Add to the switch statement in webhook handler
case 'customer.subscription.created': {
  const subscription = event.data.object as Stripe.Subscription
  // Same logic as checkout.session.completed for subscription creation
  // Covers cases where subscription is created outside of Checkout
  // (e.g., via Stripe Dashboard or API directly)
  break
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `price_data` inline pricing | Stored Stripe Price IDs | Stripe best practice | Required for billing portal |
| Custom billing UI | Stripe Customer Portal | Portal GA 2020 | Eliminates 80% of subscription management code |
| Manual webhook retry handling | Stripe Smart Retries | Ongoing | Stripe handles retry scheduling automatically |
| `subscription.current_period_start/end` on Subscription object | `subscription.items.data[0].current_period_start/end` | Stripe SDK v15+ | Already handled correctly in `getPeriodDates()` |

## Open Questions

1. **Stripe Account Activation Status**
   - What we know: Stripe requires business information (KYC) before live mode keys work
   - What's unclear: Whether the ThreadMoat Stripe account has completed activation
   - Recommendation: User should verify Stripe account is activated at dashboard.stripe.com/account before starting implementation

2. **Red Keep Pricing**
   - What we know: Pricing page shows "Call For Quote" with email CTA
   - What's unclear: Whether a Stripe Price should be created for Red Keep or if it remains a manual/custom contract
   - Recommendation: Create a Stripe Price anyway (even at a placeholder amount) so the billing portal can manage Red Keep subscriptions. Can be hidden from public checkout.

3. **The Forge Checkout Flow**
   - What we know: Pricing page CTA says "Contact for Subscription" and links to `/about#contact`
   - What's unclear: Whether self-service checkout should be enabled for Forge or if it remains contact-driven
   - Recommendation: Keep contact-driven for now but create the Stripe infrastructure so the admin can manually create subscriptions that are then managed via the portal

4. **Existing Coupon-Granted Subscriptions**
   - What we know: Users with `friends_access`, `investor_annual` product IDs have Forge-tier access via coupon redemption, not Stripe
   - What's unclear: How these interact with the billing portal (they have no `stripe_subscription_id`)
   - Recommendation: The billing portal button should only show for users with a `stripe_customer_id`. Coupon users should see a different UI (already handled -- `ManageSubscriptionButton` errors gracefully if no customer ID).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed -- manual testing required |
| Config file | None |
| Quick run command | `npm run build` (type checking + build verification) |
| Full suite command | `npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Stripe live keys configured | manual-only | Verify env vars set in Vercel | N/A |
| PAY-02 | Checkout flow end-to-end | manual | Use Stripe test card in live mode (if available) or real card | N/A |
| PAY-03 | Upgrade/downgrade/cancel via portal | manual | Click ManageSubscription, test in portal | N/A |
| PAY-04 | Webhook handles all events | manual | Stripe CLI `stripe trigger` or Stripe Dashboard event resend | N/A |
| PAY-05 | Billing portal accessible | manual | Navigate to /dashboard/settings, click Manage Subscription | N/A |

**Justification for manual-only:** Stripe payment flows require real or test API calls that cannot be meaningfully unit-tested without mocking the entire Stripe SDK. The correct validation approach is end-to-end testing with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) and real checkout sessions.

### Sampling Rate
- **Per task commit:** `npm run build` -- ensures no type errors
- **Per wave merge:** Manual checkout test with Stripe CLI forwarding
- **Phase gate:** Successful real-money transaction (can refund immediately) + portal access verified

### Wave 0 Gaps
- None -- no automated test infrastructure needed for this phase. Manual testing with Stripe CLI is the appropriate approach.

## Stripe Go-Live Checklist

Per official Stripe documentation:

1. [ ] Stripe account activated (KYC/business info submitted)
2. [ ] Products and Prices created in live mode dashboard
3. [ ] Customer Portal configured in live mode dashboard
4. [ ] Live API keys obtained (`sk_live_*`)
5. [ ] Live webhook endpoint registered with correct URL
6. [ ] Live webhook signing secret obtained (`whsec_*`)
7. [ ] Environment variables updated in Vercel (production)
8. [ ] `NEXT_PUBLIC_BASE_URL` set to production domain
9. [ ] Code updated to use Price IDs instead of inline `price_data`
10. [ ] Price-to-product-ID mapping implemented in webhook
11. [ ] Test with real card (small amount, refund immediately)
12. [ ] Verify webhook fires and DB updates correctly
13. [ ] Verify billing portal shows subscription and allows management
14. [ ] Verify access tier upgrades correctly after payment

## Sources

### Primary (HIGH confidence)
- [Stripe Go-Live Checklist](https://docs.stripe.com/get-started/checklist/go-live) - Official production readiness guide
- [Stripe Customer Portal Integration](https://docs.stripe.com/customer-management/integrate-customer-portal) - Portal API and configuration
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) - Required webhook events for subscriptions
- [Stripe Event Types](https://docs.stripe.com/api/events/types) - Complete event type reference
- Codebase analysis: `lib/stripe.ts`, `lib/tiers.ts`, `lib/subscription.ts`, `app/actions/stripe.ts`, `app/api/webhooks/stripe/route.ts`

### Secondary (MEDIUM confidence)
- [Stripe + Next.js 2025 Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) - Integration patterns
- [Stripe Account Activation](https://docs.stripe.com/get-started/account/activate) - KYC requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages needed, Stripe SDK already installed
- Architecture: HIGH - codebase thoroughly analyzed, migration path clear
- Pitfalls: HIGH - well-documented Stripe production pitfalls, verified against codebase

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (Stripe API is stable, 30-day validity appropriate)
