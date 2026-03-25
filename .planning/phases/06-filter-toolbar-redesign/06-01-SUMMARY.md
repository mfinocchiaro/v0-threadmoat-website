---
phase: 06-filter-toolbar-redesign
plan: 01
subsystem: ui
tags: [react-context, filter-state, provider-hierarchy, next.js-app-router]

requires:
  - phase: none
    provides: existing FilterProvider and filter-context.tsx
provides:
  - CompanyDataProvider context for shared company data loading
  - Layout-level FilterProvider for persistent filter state across navigation
  - activeFilterCount, clearAllFilters, removeFilter helpers on FilterContext
affects: [06-02-filter-toolbar-ui, 06-03-page-cleanup]

tech-stack:
  added: []
  patterns: [layout-level-provider-pattern, shared-company-data-context]

key-files:
  created: [contexts/company-data-context.tsx]
  modified: [contexts/filter-context.tsx, components/dashboard/layout-client.tsx, components/dashboard/viz-page-shell.tsx, components/dashboard/dashboard-client.tsx]

key-decisions:
  - "CompanyDataProvider wraps FilterProvider (company data available before filters)"
  - "Provider hierarchy: PlanProvider > ScenarioProvider > CompanyDataProvider > FilterProvider > LayoutInner"

patterns-established:
  - "Layout-level providers: shared state providers go in DashboardLayoutClient, not per-page shells"
  - "CompanyDataProvider: single load point for company data consumed by all dashboard pages"

requirements-completed: [UX-03]

duration: 2min
completed: 2026-03-25
---

# Phase 06 Plan 01: Lift Filter State to Layout Level Summary

**FilterProvider and CompanyDataProvider lifted to DashboardLayoutClient so filter state persists across dashboard page navigation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T07:01:26Z
- **Completed:** 2026-03-25T07:03:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created CompanyDataProvider that loads company data once and shares via React context
- Enhanced FilterContext with activeFilterCount (computed), clearAllFilters, and removeFilter helpers
- Lifted FilterProvider from per-page (VizPageShell, DashboardClient) to layout level (DashboardLayoutClient)
- Filter state now persists across dashboard chart page navigation (UX-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CompanyDataProvider and enhance FilterContext** - `5b33b13` (feat)
2. **Task 2: Lift FilterProvider to layout level and clean up per-page providers** - `d5252b0` (feat)

## Files Created/Modified
- `contexts/company-data-context.tsx` - New provider that loads companies once, exposes useCompanyData hook
- `contexts/filter-context.tsx` - Added activeFilterCount, clearAllFilters, removeFilter to context
- `components/dashboard/layout-client.tsx` - Added CompanyDataProvider and FilterProvider wrapping LayoutInner
- `components/dashboard/viz-page-shell.tsx` - Removed FilterProvider, now ThesisProvider only
- `components/dashboard/dashboard-client.tsx` - Removed FilterProvider wrapping

## Decisions Made
- CompanyDataProvider placed outside FilterProvider in hierarchy because filter options depend on company data
- Provider order: PlanProvider > ScenarioProvider > CompanyDataProvider > FilterProvider > LayoutInner
- VizPageShell simplified to only wrap ThesisProvider (FilterProvider comes from layout)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Layout-level FilterProvider is ready for Plan 06-02 (filter toolbar UI component)
- CompanyDataProvider available for toolbar to compute filter options without per-page props
- All 38+ chart pages still render VizFilterBar (removal happens in Plan 06-03)
- activeFilterCount, clearAllFilters, removeFilter ready for toolbar consumption

## Self-Check: PASSED

- All 5 files exist
- Both task commits verified (5b33b13, d5252b0)
- FilterProvider removed from viz-page-shell.tsx (0 references)
- FilterProvider removed from dashboard-client.tsx (0 references)
- FilterProvider present in layout-client.tsx (3 references: import + 2 JSX tags)
- npm run build succeeds

---
*Phase: 06-filter-toolbar-redesign*
*Completed: 2026-03-25*
