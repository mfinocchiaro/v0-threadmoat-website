---
id: T02
parent: S04
milestone: M006
provides: []
requires: []
affects: []
key_files: ["components/charts/ip-dependency-chart.tsx", "app/dashboard/ip-dependency/page.tsx", ".gsd/milestones/M006/slices/S04/tasks/T02-SUMMARY.md"]
key_decisions: ["Reused the tech independence heatmap shell (layout, gating, and legend pattern) for the IP dependency view to keep dashboard visualizations consistent.", "Chose string-based vendor detection from `ecosystemDependencies` entries (case-insensitive contains checks for Dassault, Siemens, Autodesk, PTC) with a fallback `Independent` bucket instead of introducing a new normalized vendor field."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "- `npm test -- --watch=false` — failed because the project has no `test` script defined.
- `npm run build` — succeeded, verifying TypeScript types and Next.js build across all routes, including the new `/dashboard/ip-dependency` page."
completed_at: 2026-04-03T08:39:14.295Z
blocker_discovered: false
---

# T02: Added dual-mode IP Dependency heatmap and dashboard page using thesis-gated data and shortlist-aware tooltips.

> Added dual-mode IP Dependency heatmap and dashboard page using thesis-gated data and shortlist-aware tooltips.

## What Happened
---
id: T02
parent: S04
milestone: M006
key_files:
  - components/charts/ip-dependency-chart.tsx
  - app/dashboard/ip-dependency/page.tsx
  - .gsd/milestones/M006/slices/S04/tasks/T02-SUMMARY.md
key_decisions:
  - Reused the tech independence heatmap shell (layout, gating, and legend pattern) for the IP dependency view to keep dashboard visualizations consistent.
  - Chose string-based vendor detection from `ecosystemDependencies` entries (case-insensitive contains checks for Dassault, Siemens, Autodesk, PTC) with a fallback `Independent` bucket instead of introducing a new normalized vendor field.
duration: ""
verification_result: mixed
completed_at: 2026-04-03T08:39:14.296Z
blocker_discovered: false
---

# T02: Added dual-mode IP Dependency heatmap and dashboard page using thesis-gated data and shortlist-aware tooltips.

**Added dual-mode IP Dependency heatmap and dashboard page using thesis-gated data and shortlist-aware tooltips.**

## What Happened

Implemented the `IPDependencyChart` as a D3-based heatmap with two modes (risk tier and vendor matrix) and wired it into a new `/dashboard/ip-dependency` page.

On the data side, the chart aggregates companies per cell based on either inverse risk tiers (derived from `techIndependenceScore`) or ecosystem vendors (parsed from `ecosystemDependencies`), combined with Y-axis groupings for deployment model, investment thesis, or workflow segment. For risk tier mode, each cell's metric is the average dependency count; for vendor matrix, the metric is the startup count. These metrics drive sequential color scales (`interpolateOrRd` for risk, `interpolateBlues` for vendor), while the cell text shows the count.

The D3 rendering follows the existing tech independence heatmap pattern: band scales on both axes, a grid of rects with optional cell labels, and a legend gradient whose labels reflect the active mode. Cells containing shortlisted companies get an amber stroke to visually call out interest points.

Tooltips are implemented as a fixed-position HTML div, populated on hover with the cell coordinates, startup count, and the relevant metric. For small cells (≤ 8 companies), the tooltip also lists company names with truncated ecosystem compatibility text, graphics kernel, and up to three modeling paradigms; shortlisted companies are prefixed with a gold star for quick scanning.

Finally, I added `app/dashboard/ip-dependency/page.tsx` that uses `VizPageShell` and `useThesisGatedData` to render the chart alongside a text header and loading skeleton. This brings the new visualization into the dashboard routing alongside the other M006 views.

## Verification

- `npm test -- --watch=false` — failed because the project has no `test` script defined.
- `npm run build` — succeeded, verifying TypeScript types and Next.js build across all routes, including the new `/dashboard/ip-dependency` page.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --watch=false` | 1 | ❌ fail (no test script defined) | 2000ms |
| 2 | `npm run build` | 0 | ✅ pass | 22000ms |


## Deviations

Attempted to run `npm test` even though the plan only required `npm run build`; there is no test script defined, so no unit tests were added or executed for this component.

## Known Issues

No automated tests exist for `IPDependencyChart` or the `/dashboard/ip-dependency` page; verification today is via build and manual inspection. Vendor mapping is string-matched and may require adjustment if ecosystem naming conventions change.

## Files Created/Modified

- `components/charts/ip-dependency-chart.tsx`
- `app/dashboard/ip-dependency/page.tsx`
- `.gsd/milestones/M006/slices/S04/tasks/T02-SUMMARY.md`


## Deviations
Attempted to run `npm test` even though the plan only required `npm run build`; there is no test script defined, so no unit tests were added or executed for this component.

## Known Issues
No automated tests exist for `IPDependencyChart` or the `/dashboard/ip-dependency` page; verification today is via build and manual inspection. Vendor mapping is string-matched and may require adjustment if ecosystem naming conventions change.
