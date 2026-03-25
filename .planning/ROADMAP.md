# Roadmap: ThreadMoat Website

## Milestones

- ✅ **v1.0 Production Launch** — Phases 14, 1-5 (shipped 2026-03-24)
- 🚧 **v1.1 UX & Data Polish** — Phases 6-9 (in progress)

<details>
<summary>✅ v1.0 Production Launch (Phases 14, 1-5) — SHIPPED 2026-03-24</summary>

See: `milestones/v1.0-ROADMAP.md` for full details.

</details>

## Phases

### 🚧 v1.1 UX & Data Polish (In Progress)

- [ ] Phase 6: Filter Toolbar Redesign — compact sticky toolbar for dashboard
  - **Goal:** Replace the large filter dialog overlay with a compact sticky toolbar at the top of the dashboard content area that filters all charts simultaneously
  - **Requirements:** UX-01, UX-02, UX-03, UX-04
  - **Depends on:** None
  - **Plans:** 3 plans
    - [x] 06-01-PLAN.md — Lift FilterProvider to layout level, create CompanyDataProvider
    - [ ] 06-02-PLAN.md — Build compact sticky FilterToolbar component and wire into layout
    - [ ] 06-03-PLAN.md — Remove VizFilterBar from all 45 dashboard page files
  - **Success criteria:**
    1. Sticky toolbar visible at top of dashboard, never blocks content
    2. Active filters shown as removable pills/chips
    3. Changing filters updates the current chart immediately
    4. Filter state persists when navigating between charts
    5. Toolbar collapses to minimal height when no filters active

- [ ] Phase 7: Stripe Upgrade Coupon — credit report purchasers on upgrade
  - **Goal:** Create and wire a Stripe coupon that credits $4,999 when an Analyst (report) purchaser upgrades to Strategist subscription
  - **Requirements:** MON-01
  - **Depends on:** None
  - **Plans:** 1 plan
    - [ ] 07-01-PLAN.md — Create coupon, detect Analyst purchase, apply discount in Strategist checkout
  - **Success criteria:**
    1. Coupon exists in Stripe dashboard with $4,999 one-time discount
    2. Upgrade flow detects existing Analyst purchase and applies coupon automatically
    3. Strategist checkout shows discounted price

- [ ] Phase 8: French Translation Review — quality pass
  - **Goal:** Review and correct French translations across all public pages
  - **Requirements:** I18N-06
  - **Depends on:** None
  - **Success criteria:**
    1. All French pages reviewed for natural, professional B2B language
    2. Corrections committed and deployed

- [ ] Phase 9: CSV Data Refresh — swap corrected dataset
  - **Goal:** Replace current CSV data files with fact-checked versions from the separate GSD project
  - **Requirements:** DATA-01
  - **Depends on:** External (other GSD project must complete)
  - **Success criteria:**
    1. New CSV files swapped in
    2. All charts render correctly with updated data
    3. No broken references or missing fields

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 6. Filter Toolbar | v1.1 | 1/3 | In Progress | - |
| 7. Upgrade Coupon | v1.1 | 0/1 | Not started | - |
| 8. French Review | v1.1 | 0/? | Not started | - |
| 9. CSV Refresh | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-03-25 after Phase 7 planning complete*
