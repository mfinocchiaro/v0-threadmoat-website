---
phase: 02-production-stripe-integration
plan: 01
subsystem: payments
tags: [stripe, checkout, webhook, price-ids, subscription]

# Dependency graph
requires:
  - phase: existing
    provides: Stripe sandbox integration (lib/stripe.ts, app/actions/stripe.ts, webhook handler)
provides:
  - Stripe Price ID mapping layer (lib/stripe-prices.ts)
  - Checkout using stored Stripe Price IDs instead of inline price_data
  - Webhook product_id resolution for correct tier access
  - customer.subscription.created event handling
affects: [02-production-stripe-integration, billing-portal, subscription-lifecycle]

# Tech tracking
tech-stack:
  added: []
  patterns: [env-var-driven Price ID config, bidirectional price mapping, fallback to inline price_data]

key-files:
  created: [lib/stripe-prices.ts]
  modified: [app/actions/stripe.ts, app/api/webhooks/stripe/route.ts]

key-decisions:
  - "Graceful empty string fallback for env vars instead of non-null assertions"
  - "Fallback to inline price_data when no Stripe Price ID configured (supports coupon/manual products)"
  - "Removed duplicate getStripe() in webhook; uses shared lib/stripe import"

patterns-established:
  - "Price ID mapping: all Stripe Price IDs read from env vars via lib/stripe-prices.ts"
  - "Bidirectional lookup: getStripePriceId (internal->stripe) and getInternalProductId (stripe->internal)"
  - "Webhook product_id: always map through getInternalProductId before storing in DB"

requirements-completed: [PAY-02, PAY-04]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 2 Plan 1: Stripe Price ID Mapping Summary

**Env-var-driven Stripe Price ID mapping layer with checkout migration from inline price_data and webhook product_id resolution for correct tier access**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T09:01:47Z
- **Completed:** 2026-03-23T09:04:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created lib/stripe-prices.ts with bidirectional mapping between Stripe Price IDs and internal product IDs
- Migrated checkout to use stored Stripe Price IDs (with fallback to price_data for unconfigured products)
- Fixed webhook to store internal product_ids that getAccessTier can resolve (not raw Stripe Price IDs)
- Added customer.subscription.created webhook event handler for dashboard-created subscriptions
- Removed duplicate getStripe() function in webhook, using shared lib/stripe import

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Stripe Price ID mapping layer** - `d89557f` (feat)
2. **Task 2: Migrate checkout to Price IDs and fix webhook mapping** - `51d2786` (feat)

## Files Created/Modified
- `lib/stripe-prices.ts` - Stripe Price ID config and bidirectional mapping (STRIPE_PRICES, getInternalProductId, getStripePriceId)
- `app/actions/stripe.ts` - Checkout session creation using Price IDs when available, fallback to price_data
- `app/api/webhooks/stripe/route.ts` - Webhook with price-to-product mapping, customer.subscription.created handler, shared getStripe import

## Decisions Made
- Used graceful empty string fallback (`|| ''`) for env vars instead of non-null assertions (`!`) -- prevents runtime crashes when env vars not yet configured
- Kept fallback to inline price_data when no Stripe Price ID exists -- supports coupon/manual products and allows incremental migration
- Removed duplicate `getStripe()` function in webhook handler in favor of shared `lib/stripe.ts` import -- single source of truth for Stripe client

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate getStripe() in webhook**
- **Found during:** Task 2
- **Issue:** Webhook had its own `getStripe()` creating `new Stripe(process.env.STRIPE_SECRET_KEY!)` with non-null assertion, while `lib/stripe.ts` has a proper singleton with null checks
- **Fix:** Removed duplicate function, imported from `lib/stripe`
- **Files modified:** app/api/webhooks/stripe/route.ts
- **Verification:** npm run build succeeds
- **Committed in:** 51d2786

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** This was already called out in the plan. No scope creep.

## Issues Encountered
None

## User Setup Required

Before the Price ID mapping works in production, the following env vars must be set:

| Env Var | Source |
|---------|--------|
| `STRIPE_PRICE_FORGE_ANNUAL` | Stripe Dashboard > Products > The Forge > Price ID |
| `STRIPE_PRICE_RED_KEEP_ANNUAL` | Stripe Dashboard > Products > The Red Keep > Price ID |
| `STRIPE_PRICE_REPORT_Q1` | Stripe Dashboard > Products > 2026 Q1 Market Report > Price ID |

Without these env vars, checkout falls back to inline price_data (existing behavior).

## Next Phase Readiness
- Price ID mapping layer ready for production Stripe keys
- Customer Portal will work with subscriptions created using stored Price IDs
- Webhook correctly maps product_ids for tier access resolution
- Next: Configure Stripe Products/Prices in live dashboard, set env vars, register production webhook

---
*Phase: 02-production-stripe-integration*
*Completed: 2026-03-23*
