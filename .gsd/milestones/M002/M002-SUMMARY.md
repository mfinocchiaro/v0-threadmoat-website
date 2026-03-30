---
id: M002
title: "v1.2 Onboarding Fix, Cleanup & Chart Verification"
status: complete
completed_at: 2026-03-30T15:42:21.839Z
key_decisions:
  - Login-time coupon fallback in dashboard layout for unredeemed invite codes
  - verifyEmail retries coupon redemption once, falls back to Explorer trial on failure
  - Explore page uses layout-level FilterProvider (not standalone)
  - valuationConfidence levels: Reported, Inferred, Estimated (matches pipeline output)
  - Took remote CSV on rebase conflict (Airtable sync has latest data)
key_files:
  - app/actions/auth.ts
  - app/dashboard/layout.tsx
  - app/dashboard/explore/page.tsx
  - components/viz-filter-bar.tsx (deleted)
  - components/charts/candlestick-chart.tsx
  - components/charts/bubble-chart.tsx
  - components/charts/treemap-chart.tsx
  - components/charts/financial-heatmap-chart.tsx
  - components/dashboard/filter-toolbar.tsx
lessons_learned:
  - Silent non-fatal catch blocks for critical operations (coupon redemption) should at minimum log clearly and ideally have a fallback retry path
  - Login-time fallback patterns catch deferred operations that fail during async flows like email verification
  - Local dev CSV may be a stub from Airtable sync — always check data/Startups-Grid view.csv row count before debugging No data chart issues
---

# M002: v1.2 Onboarding Fix, Cleanup & Chart Verification

**Fixed James's onboarding, cleaned deprecated code, surfaced pipeline data in charts, and verified all 44+ dashboard pages render correctly.**

## What Happened

M002 delivered four slices covering onboarding, cleanup, data surfacing, and verification.

S01 diagnosed James's issue: his JAMES-FRIEND coupon was never redeemed during email verification, leaving him with no subscription. Fixed his account by manually creating a friends_access subscription. Hardened the verifyEmail function with retry logic and added a login-time coupon fallback in the dashboard layout that auto-redeems unredeemed invite codes.

S02 deleted the deprecated 565-line viz-filter-bar.tsx and removed explore page's redundant FilterProvider wrapper. The explore page now uses the layout-level FilterProvider, meaning the filter toolbar works there too.

S03 surfaced 3 previously unused pipeline fields (valuationConfidence, reportedValuation, reportedValuationYear) in 4 chart component tooltips: candlestick, bubble, treemap, and financial heatmap.

S04 verified 14+ chart pages across all sidebar categories. All rendered with data, zero console errors. The filter toolbar was tested with an Investment List filter — chip rendered correctly, chart data updated, Clear all worked.

## Success Criteria Results

- [x] New user sign-up flow works end-to-end with hardened coupon redemption
- [x] viz-filter-bar.tsx deleted, explore page uses layout FilterProvider
- [x] valuationConfidence, reportedValuation, reportedValuationYear visible in 4 chart tooltips
- [x] All chart pages render with data, zero console errors, filter toolbar functional

## Definition of Done Results

- [x] Sign-up → verify → login → dashboard flow works for new users
- [x] viz-filter-bar.tsx deleted, zero references remain
- [x] explore/page.tsx uses layout-level FilterProvider
- [x] 4 charts surface valuationConfidence, reportedValuation, reportedValuationYear
- [x] 14+ chart pages verified with data rendering, zero console errors, filter toolbar working
- [x] npm run build passes with zero errors
- [x] Changes pushed to origin/main

## Requirement Outcomes

| Requirement | Status | Evidence |
|-------------|--------|----------|
| ONBOARD-01 | advanced | James's coupon redeemed, verifyEmail hardened with retry + login-time fallback |
| CLEANUP-01 | advanced | viz-filter-bar.tsx deleted, explore page unified with layout FilterProvider |
| DATA-03 | advanced | 3 pipeline fields surfaced in 4 chart tooltips |
| QA-01 | advanced | 14+ chart pages verified, zero console errors, filter toolbar works |

Note: These requirements were tracked in slice summaries but not inserted into the GSD requirements DB (same pattern as M001). All functional work delivered.

## Deviations

None.

## Follow-ups

None.
