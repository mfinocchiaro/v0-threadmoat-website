---
id: S01
parent: M006
milestone: M006
provides:
  - MarketMomentumHeatmap component pattern for downstream heatmap slices
  - momentumMultiplier and momentumCap fields on Company interface
requires:
  []
affects:
  - S02
  - S03
key_files:
  - lib/company-data.ts
  - lib/load-companies-server.ts
  - components/charts/market-momentum-heatmap.tsx
  - app/dashboard/market-momentum/page.tsx
  - components/dashboard/sidebar.tsx
key_decisions:
  - D005: Composite momentum score formula — (growthMetrics/5)*0.4 + (customerSignalScore/8)*0.3 + (momentumMultiplier/2.73)*0.3
  - YlOrRd color scale for visual distinction from existing YlGn growth momentum chart
  - Placed Market Momentum last in ADMIN_ITEMS after Valuation Candlestick
patterns_established:
  - Heatmap chart pattern with composite scoring, configurable Y-axis grouping, and YlOrRd palette — reusable for Industry Penetration and Target Customer Profile heatmaps in S02/S03
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M006/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S01/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T06:28:46.975Z
blocker_discovered: false
---

# S01: Market Momentum Heatmap

**Shipped Market Momentum Heatmap with composite scoring (growth metrics 40%, customer signal 30%, momentum multiplier 30%), YlOrRd palette, Y-axis grouping selector, tooltips with component breakdown, shortlist highlighting, and sidebar navigation — accessible at /dashboard/market-momentum.**

## What Happened

Extended the Company data model with `momentumMultiplier` and `momentumCap` fields, wired CSV loading for both columns in `load-companies-server.ts`. Built a complete D3 SVG heatmap chart component (`MarketMomentumHeatmap`) that computes composite momentum scores normalized 0–1, rendered with the YlOrRd color palette to visually distinguish from the existing YlGn growth chart. The chart supports three Y-axis grouping options (industries served, investment theses, workflow segment) via a dropdown selector, rich tooltips showing component score breakdowns, shortlist highlighting per K005, empty cell rendering with muted fills, and theme-aware colors via CSS custom properties.

Created the dashboard page at `/dashboard/market-momentum` using the established VizPageShell + useThesisGatedData pattern, wired the sidebar navigation entry with TrendingUp icon in both ADMIN_ITEMS and ADMIN_VIZ_HREFS. Build passes clean with zero type errors across both tasks.

## Verification

All 9 slice-level checks pass: momentumMultiplier and momentumCap in Company interface, Momentum Multiplier CSV loading wired, chart file exists with shortlistedIds prop, page file exists, sidebar wired, chart imported in page, thesis-gated hook used. Next.js build succeeds with zero type errors (verified in both T01 and T02).

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Composite score weights (40/30/30) are hardcoded — no UI to adjust weighting. MomentumCap field is loaded but not yet used in any visualization logic (available for future use).

## Follow-ups

None.

## Files Created/Modified

- `lib/company-data.ts` — Added momentumMultiplier and momentumCap fields to Company interface
- `lib/load-companies-server.ts` — Wired CSV loading for Momentum Multiplier and Momentum Cap columns
- `components/charts/market-momentum-heatmap.tsx` — New D3 SVG heatmap chart with composite scoring, YlOrRd palette, grouping selector, tooltips, shortlist highlighting
- `app/dashboard/market-momentum/page.tsx` — New dashboard page with VizPageShell wrapper and useThesisGatedData
- `components/dashboard/sidebar.tsx` — Added Market Momentum entry to ADMIN_ITEMS and ADMIN_VIZ_HREFS
