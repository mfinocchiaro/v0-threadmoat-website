# ThreadMoat Website

## What This Is

A B2B SaaS website for industrial AI and engineering software market intelligence. Public marketing pages in 6 languages convert visitors into paid dashboard subscribers who access 44+ interactive data visualizations covering 500+ startups across the PLM, CAD, CAE, and industrial AI landscape. Live Stripe payments with Analyst ($4,999 one-time) and Strategist (€18,999/yr) tiers.

## Core Value

Converting visitors into paying dashboard subscribers through compelling market intelligence content and frictionless checkout.

## Requirements

### Validated

- ✓ Public marketing pages (home, pricing, about, report) — v1.0
- ✓ Email/password authentication with verification and password reset — existing
- ✓ 44+ dashboard visualization pages — existing
- ✓ i18n for 6 languages (en/fr/es/it/de/pt) with flag emoji language switcher — v1.0
- ✓ CSV-driven startup and investor data pipeline — existing
- ✓ Role-based access control (explorer/analyst/strategist/advisory/admin) — v1.0
- ✓ Live Stripe checkout (Analyst + Strategist) — v1.0
- ✓ SEO (sitemap, OG images, meta tags, robots.txt) — v1.0
- ✓ React Email templates (welcome, receipt, verification, password-reset) — v1.0
- ✓ AI-powered narrative analysis for company reports (Impressions, Conclusions, Beware, Overlooked Opportunities) — v1.1
- ✓ Subscriber onboarding wizard (tier-aware, 3 steps) — v1.0
- ✓ Company shortlist / workspace (click companies across charts, amber highlight, toolbar panel) — v1.1
- ✓ Custom report builder (company selection + section toggles + AI narrative + chart capture → PDF/markdown) — v1.1
- ✓ Market Momentum Heatmap (composite scoring, YlOrRd palette, Y-axis grouping, tooltips) — v1.2

### Active

- [ ] CSV re-parse caching for /api/ai/narrative at higher load
- [ ] PDF markdown renderer: tables, nested lists, code blocks
- [ ] Human quality review of AI narrative output against SME expectations
- [ ] LLM API cost measurement and budget benchmarking
- [ ] UAT manual execution of test scripts for M005 features

### Out of Scope

- Asian language variants (Japanese, Chinese) — different infrastructure, payment rails, regulatory
- Mobile app — responsive web sufficient for B2B market
- Real-time data feeds — CSV pipeline sufficient at current scale
- Report generator tool — separate GSD project
- Agent updater tool — separate GSD project
- Dashboard content translation — English-only dashboard acceptable for B2B

## Context

- **Tech stack:** Next.js 16, NextAuth, Stripe (live), Resend, React Email, D3, Recharts, Tailwind CSS, shadcn/ui, next-intl, Vercel AI SDK (ai + @ai-sdk/anthropic)
- **Database:** Neon (Postgres)
- **Data:** 500+ startups, investors from CSV files, market reports
- **Scale:** 281 TypeScript files, 38.5K+ lines, 260+ commits
- **Current state:** v1.2 in progress — M006 heatmap analytics expansion (Market Momentum shipped, Industry Penetration/Target Customer Profile/IP Dependency in progress)
- **Hosting:** Vercel
- **Tiers:** Recon (free) → Analyst ($4,999 one-time) → Strategist (€18,999/yr) → Advisory (custom)
- **M005 complete:** Filter onboarding, AI narrative engine (Claude Sonnet 4.5 via Vercel AI SDK), company shortlist with amber highlights, custom report builder with PDF export

## Constraints

- **Translations:** ES/IT/DE reviewed by native speakers; FR/PT pending review
- **Data privacy:** CSV data contains startup financial information — access controlled by tier
- **Brand names:** ThreadMoat, Digital Thread, Analyst, Strategist, Advisory, Recon must not be translated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| next-intl for i18n | App Router native, cookie-based locale detection | ✓ Good |
| localePrefix: as-needed | English at /, no redirect to /en | ✓ Good |
| intlMiddleware outside auth() | Prevents rewrite→redirect on Vercel edge | ✓ Good |
| Forge→Analyst, Red Keep→Strategist | Business partners preferred professional tier names | ✓ Good |
| Analyst as one-time, Strategist as annual | Matches actual product offering — report vs subscription | ✓ Good |
| React Email + Resend | Official companion, JSX templates, Resend already in use | ✓ Good |
| Skip Asian languages | Different infrastructure requirements | — Pending |
| Add Portuguese | Brazil industrial market, 270M speakers | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after M006/S01 slice completion (Market Momentum Heatmap)*
