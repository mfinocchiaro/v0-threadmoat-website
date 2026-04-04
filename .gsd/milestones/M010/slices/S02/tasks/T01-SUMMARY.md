---
id: T01
parent: S02
milestone: M010
key_files:
  - app/[locale]/page.tsx
  - components/homepage/homepage-dashboard-section.tsx
key_decisions:
  - Async server component wrapper pattern for Suspense-compatible data loading
  - Skeleton fallback matches dashboard layout dimensions to prevent CLS
duration: 
verification_result: passed
completed_at: 2026-04-04T04:46:30.317Z
blocker_discovered: false
---

# T01: Extracted data loading into async server component with Suspense boundary — hero streams before CSV parse completes

**Extracted data loading into async server component with Suspense boundary — hero streams before CSV parse completes**

## What Happened

Created HomepageDashboardSection as an async server component that calls loadCompaniesFromCSV() internally. In page.tsx, wrapped it in <Suspense> with a skeleton fallback matching the dashboard layout (KPI cards + chart areas). The hero section, thesis, features, and all static content now stream immediately as the first HTML chunk. The dashboard section streams in when the CSV data is ready.\n\nRemoved the direct loadCompaniesFromCSV() call and companies variable from page.tsx — data loading is now fully encapsulated in the async server wrapper.

## Verification

npm run build passed (exit 0, 20.9s, 104 routes). TypeScript clean.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 20900ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `app/[locale]/page.tsx`
- `components/homepage/homepage-dashboard-section.tsx`
