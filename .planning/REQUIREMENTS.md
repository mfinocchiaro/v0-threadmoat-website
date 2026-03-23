# Requirements: ThreadMoat Website

**Defined:** 2026-03-22
**Core Value:** Converting visitors into paying dashboard subscribers

## v1 Requirements

Requirements for production launch. Each maps to roadmap phases.

### i18n Completion

- [x] **I18N-01**: All 4 public pages support en/fr/es/it/de with locale-prefixed URLs
- [x] **I18N-02**: Language switcher globe dropdown in all page headers
- [x] **I18N-03**: NEXT_LOCALE cookie persists language selection across sessions
- [ ] **I18N-04**: Portuguese (pt) language support with translated message files
- [ ] **I18N-05**: Flag emoji displayed next to language names in switcher (🇺🇸🇬🇧 🇫🇷 🇪🇸 🇮🇹 🇩🇪 🇧🇷🇵🇹)

### Payments

- [ ] **PAY-01**: Stripe live mode onboarding complete (production API keys configured)
- [x] **PAY-02**: Checkout flow works end-to-end with production Stripe (subscribe, pay, access granted)
- [ ] **PAY-03**: Subscription lifecycle management (upgrade, downgrade, cancel via billing portal)
- [x] **PAY-04**: Stripe webhook handles subscription events (created, updated, deleted, payment_failed)
- [ ] **PAY-05**: Billing portal accessible from dashboard for self-service management

### Content & SEO

- [x] **SEO-01**: Production-quality page titles and meta descriptions on all public pages
- [ ] **SEO-02**: Open Graph images for social sharing on all public pages
- [x] **SEO-03**: Sitemap.xml with all locale variants
- [ ] **SEO-04**: Marketing copy polished and consistent across all pages

### Email

- [x] **EMAIL-01**: Welcome email sent on successful subscription
- [x] **EMAIL-02**: Payment receipt email on successful charge
- [x] **EMAIL-03**: Email templates professionally styled with ThreadMoat branding

### Onboarding

- [ ] **ONBD-01**: New subscriber sees guided first-visit experience in dashboard
- [ ] **ONBD-02**: Clear value demonstration within first 60 seconds of dashboard access

## v2 Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Analytics

- **ANLYT-01**: Visitor analytics (page views, conversion funnel)
- **ANLYT-02**: Subscriber usage analytics (which charts viewed, session duration)

### Advanced Monetization

- **MONET-01**: Trial period for premium tiers
- **MONET-02**: Annual billing discount option
- **MONET-03**: Coupon/promo code system refinement

### Content Expansion

- **CONT-01**: Blog / thought leadership content section
- **CONT-02**: Case studies page

## Out of Scope

| Feature | Reason |
|---------|--------|
| Japanese/Chinese languages | Different infrastructure, payment rails, regulatory requirements |
| Dashboard content translation | B2B users accept English dashboards; translation effort disproportionate to value |
| Mobile app | Responsive web sufficient for B2B market |
| Report generator | Separate GSD project |
| Agent updater | Separate GSD project |
| Real-time data feeds | CSV pipeline sufficient at current scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | Phase 14 (complete) | Complete |
| I18N-02 | Phase 14 (complete) | Complete |
| I18N-03 | Phase 14 (complete) | Complete |
| I18N-04 | Phase 1 | Pending |
| I18N-05 | Phase 1 | Pending |
| PAY-01 | Phase 2 | Pending |
| PAY-02 | Phase 2 | Complete |
| PAY-03 | Phase 2 | Pending |
| PAY-04 | Phase 2 | Complete |
| PAY-05 | Phase 2 | Pending |
| SEO-01 | Phase 3 | Complete |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 3 | Complete |
| SEO-04 | Phase 3 | Pending |
| EMAIL-01 | Phase 4 | Complete |
| EMAIL-02 | Phase 4 | Complete |
| EMAIL-03 | Phase 4 | Complete |
| ONBD-01 | Phase 5 | Pending |
| ONBD-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-23 after Phase 2 Plan 1 completion (PAY-02, PAY-04 complete)*
