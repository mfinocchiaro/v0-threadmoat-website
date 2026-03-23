# Roadmap: ThreadMoat Website

## Milestones

- 🚧 **v1.0 Production Launch** — Phases 1-5 (in progress)

## Phases

### 🚧 v1.0 Production Launch (In Progress)

<details>
<summary>✅ Phase 14: Internationalization (Phases pre-v1.0) — COMPLETE 2026-03-22</summary>

- [x] Phase 14: Internationalization i18n for Public Website Pages (3/3 plans) — completed 2026-03-22

</details>

- [ ] Phase 1: Portuguese Language & Flag Emoji — i18n completion
  - **Goal:** Add Portuguese (pt) as 6th language with translated message files, and add flag emoji to all language names in the LanguageSwitcher dropdown
  - **Requirements:** I18N-04, I18N-05
  - **Plans:** 1 plan
    - [ ] 01-01-PLAN.md — Portuguese message files, routing config, LanguageSwitcher flags
  - **Depends on:** Phase 14 (complete)
  - **Success criteria:**
    1. Visiting /pt/pricing renders Portuguese pricing content
    2. LanguageSwitcher shows flag emoji next to each language name
    3. All 6 locale message files have matching key structures
    4. npm run build succeeds with all locale variants

- [ ] Phase 2: Production Stripe Integration — payments go live
  - **Goal:** Switch Stripe from sandbox to live mode, verify end-to-end checkout, implement subscription lifecycle management and billing portal
  - **Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
  - **Plans:** 2 plans
    - [x] 02-01-PLAN.md — Price ID mapping layer, checkout migration to Price IDs, webhook product_id fix
    - [ ] 02-02-PLAN.md — Stripe dashboard setup (live mode), end-to-end payment verification
  - **Depends on:** None (independent)
  - **Success criteria:**
    1. Real credit card charge succeeds in production Stripe
    2. Subscriber gets dashboard access after payment
    3. User can upgrade/downgrade/cancel via billing portal
    4. Webhook correctly handles all subscription state changes
    5. Payment failure triggers appropriate user notification

- [ ] Phase 3: Content & SEO Polish — production-ready public pages
  - **Goal:** Polish all marketing copy, add OG images for social sharing, generate sitemap with locale variants, ensure all meta tags are production-quality
  - **Requirements:** SEO-01, SEO-02, SEO-03, SEO-04
  - **Plans:** 2 plans
    - [x] 03-01-PLAN.md — Metadata helpers, sitemap, robots, enhanced generateMetadata on all pages
    - [ ] 03-02-PLAN.md — Dynamic OG images for all pages, social sharing verification
  - **Depends on:** Phase 1 (Portuguese content must exist for sitemap)
  - **Success criteria:**
    1. Every public page has unique, compelling title and description
    2. Sharing a page URL on LinkedIn/Twitter shows branded preview image
    3. sitemap.xml includes all locale variants of all public pages
    4. Marketing copy is consistent in tone and factually accurate

- [x] Phase 4: Transactional Email Polish — professional email experience
  - **Goal:** Create professionally styled welcome and receipt emails with ThreadMoat branding using Resend
  - **Requirements:** EMAIL-01, EMAIL-02, EMAIL-03
  - **Plans:** 2 plans
    - [x] 04-01-PLAN.md — React Email templates with ThreadMoat branding, refactor lib/email.ts
    - [x] 04-02-PLAN.md — Wire welcome + receipt emails into Stripe webhook handler
  - **Depends on:** Phase 3 (build templates now, test with sandbox Stripe, go live with Phase 2)
  - **Success criteria:**
    1. New subscriber receives branded welcome email within 1 minute
    2. Successful payment triggers receipt email with invoice details
    3. All emails render correctly in Gmail, Outlook, Apple Mail

- [ ] Phase 5: Subscriber Onboarding — first-visit experience
  - **Goal:** Create a guided onboarding flow that demonstrates dashboard value within 60 seconds of first login
  - **Requirements:** ONBD-01, ONBD-02
  - **Depends on:** Phase 2 (needs active subscription for testing)
  - **Success criteria:**
    1. First-time subscriber sees onboarding overlay/wizard
    2. Onboarding highlights 3 key dashboard features
    3. User can skip or complete onboarding
    4. Onboarding state persists (not shown again after completion)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 14. Internationalization | pre-v1.0 | 3/3 | Complete | 2026-03-22 |
| 1. Portuguese & Flags | v1.0 | 0/1 | Planned | - |
| 2. Production Stripe | v1.0 | 1/2 | In Progress | - |
| 3. Content & SEO | v1.0 | 1/2 | In Progress | - |
| 4. Email Polish | v1.0 | 2/2 | Complete | 2026-03-23 |
| 5. Onboarding | v1.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-03-23 after Phase 2 Plan 1 completion*
