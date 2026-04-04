---
id: S02
parent: M010
milestone: M010
provides:
  - Hero-first rendering — TTFB no longer blocked by CSV parse
requires:
  - slice: S01
    provides: useLazyMount pattern for deferred chart rendering
affects:
  - S03
key_files:
  - app/[locale]/page.tsx
  - components/homepage/homepage-dashboard-section.tsx
key_decisions:
  - Async server component + Suspense for streaming data-heavy sections
patterns_established:
  - Async server component wrapper for Suspense-compatible data loading in Next.js 16
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M010/slices/S02/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T04:46:48.716Z
blocker_discovered: false
---

# S02: Defer CSV data loading — hero-first rendering

**Homepage hero streams immediately via Suspense boundary — CSV data loading deferred to async server component**

## What Happened

Extracted data loading into HomepageDashboardSection (async server component) and wrapped it in <Suspense> in page.tsx. The hero, thesis, features, and all static content stream as the first HTML chunk. The dashboard section with KPI cards and charts streams in when loadCompaniesFromCSV() completes. Skeleton fallback matches the dashboard layout to prevent CLS.

## Verification

Build passes. Data loading removed from page.tsx, encapsulated in async server wrapper.

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

None.

## Follow-ups

None.

## Files Created/Modified

- `app/[locale]/page.tsx` — Removed inline data loading, added Suspense boundary with skeleton fallback
- `components/homepage/homepage-dashboard-section.tsx` — New async server component that loads CSV data and renders HomepageDashboard
