---
id: S01
parent: M005
milestone: M005
provides:
  - FilterOnboardingGuide component pattern for inline dismissable callouts in the dashboard
requires:
  []
affects:
  []
key_files:
  - components/dashboard/filter-onboarding-guide.tsx
  - components/dashboard/filter-toolbar.tsx
key_decisions:
  - SSR-safe localStorage: default to hidden, hydrate in useEffect to avoid hydration mismatch
  - useRef to track previous activeFilterCount for 0→>0 auto-dismiss transition
patterns_established:
  - SSR-safe localStorage hydration pattern (default hidden → useEffect read → hydrated gate) for client-only persistence in Next.js dashboard components
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M005/slices/S01/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T21:47:31.223Z
blocker_discovered: false
---

# S01: Filter Workflow Onboarding

**Dismissable inline onboarding callout teaches new dashboard visitors that filters apply to all charts, with localStorage persistence and auto-dismiss on first filter use.**

## What Happened

Built a single FilterOnboardingGuide component that renders a compact info bar inside FilterToolbar's sticky container, above the filter chips row. The callout explains that filters apply to all charts simultaneously. It dismisses permanently via an X button or auto-dismisses when the user applies their first filter (activeFilterCount transitions from 0 to >0, tracked via useRef). Dismissal persists in localStorage under the key `filter-onboarding-dismissed`.

The component uses an SSR-safe hydration pattern: state defaults to hidden (dismissed=true), then reads localStorage in a useEffect after mount. A separate `hydrated` flag gates rendering to prevent flash. This avoids React hydration mismatches since localStorage is unavailable during server-side rendering.

The component was mounted in FilterToolbar between the sticky container top and the chips/no-filters row, so it appears inline with the toolbar and scrolls naturally with it.

## Verification

npm run build passes cleanly (exit 0). grep confirms `filter-onboarding-dismissed` localStorage key present in filter-onboarding-guide.tsx. grep confirms `FilterOnboardingGuide` imported and rendered in filter-toolbar.tsx.

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

None. The callout is a simple one-shot component with no runtime dependencies beyond localStorage.

## Follow-ups

None.

## Files Created/Modified

- `components/dashboard/filter-onboarding-guide.tsx` — New component: dismissable inline onboarding callout with localStorage persistence and auto-dismiss on first filter use
- `components/dashboard/filter-toolbar.tsx` — Added FilterOnboardingGuide import and render inside sticky toolbar container above chips row
