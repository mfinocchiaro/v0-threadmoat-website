---
status: active
last_activity: 2026-03-25
current_phase: 06-filter-toolbar-redesign
current_plan: 02
milestone: v1.1
---

# ThreadMoat Website — Project State

## Status

Active — Executing phase 06 (filter toolbar redesign)

## Current Position

Phase: 06-filter-toolbar-redesign
Plan: 02 (next)
Status: Plan 01 complete — FilterProvider lifted to layout level
Last activity: 2026-03-25 — Completed 06-01-PLAN.md

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Converting visitors into paying dashboard subscribers
**Current focus:** v1.1 UX & Data Polish — filter toolbar, coupon, French review, CSV refresh

## Accumulated Context

### Decisions

- Tiers: Recon (free) → Analyst ($4,999) → Strategist (€18,999/yr) → Advisory (custom)
- intlMiddleware runs outside auth() wrapper
- React Email + Resend for all transactional emails
- Staging branch available for pre-production testing
- CompanyDataProvider wraps FilterProvider (company data loads before filters need it)
- Provider hierarchy: PlanProvider > ScenarioProvider > CompanyDataProvider > FilterProvider > LayoutInner

### Blockers

None.

### Notes

- CSV data refresh depends on separate GSD project completing fact-checking
- French translation review to be done by Michael personally
- Portuguese translation still pending native speaker review
