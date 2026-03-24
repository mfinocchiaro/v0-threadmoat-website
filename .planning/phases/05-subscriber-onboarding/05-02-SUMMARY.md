---
phase: 05-subscriber-onboarding
plan: 02
subsystem: ui, dashboard
tags: [onboarding, wizard, server-component, conditional-render]

# Dependency graph
requires:
  - phase: 05-subscriber-onboarding plan 01
    provides: OnboardingWizard component, profiles.onboarding_completed column, POST /api/profile/onboarding endpoint
provides:
  - "End-to-end onboarding wizard flow wired into dashboard layout"
  - "Server-side onboarding_completed query in layout.tsx"
  - "Conditional wizard rendering in layout-client.tsx"
affects: [05-subscriber-onboarding plan 03 if any]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-to-client prop pipeline for feature flags, local dismiss state for stale server props]

key-files:
  created: []
  modified:
    - app/dashboard/layout.tsx
    - components/dashboard/layout-client.tsx

key-decisions:
  - "Local onboardingDismissed state prevents wizard re-render after API call before page reload"
  - "Wizard placed after SidebarShell content so dashboard is visible behind the dialog overlay"

patterns-established:
  - "Server-side boolean computation passed as prop to client layout for conditional UI"

requirements-completed: [ONBD-01, ONBD-02]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 5 Plan 02: Wire Onboarding Wizard into Dashboard Summary

**Server-side onboarding_completed query piped through layout props to conditionally render tier-aware OnboardingWizard dialog for first-time subscribers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T09:41:06Z
- **Completed:** 2026-03-24T09:43:30Z
- **Tasks:** 1 of 1 auto tasks (+ 1 checkpoint pending)
- **Files modified:** 2

## Accomplishments
- Added onboarding_completed to ProfileRow type and SQL query in dashboard layout
- Computed showOnboarding server-side (non-admin + has profile_type + not completed)
- Wired showOnboarding prop through DashboardLayoutClient to LayoutInner
- OnboardingWizard renders conditionally with local dismiss state to handle stale server props

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire onboarding state through layout pipeline** - `3b30403` (feat)
2. **Task 2: Human verification checkpoint** - pending

## Files Created/Modified
- `app/dashboard/layout.tsx` - Added onboarding_completed to type, query, and showOnboarding computation
- `components/dashboard/layout-client.tsx` - Added showOnboarding prop, OnboardingWizard import, conditional render with dismiss state

## Decisions Made
- Local `onboardingDismissed` useState prevents wizard from re-showing after the API call completes but before a page reload refreshes the server prop
- Wizard is rendered after the main content (children/FreeUserGuard) inside SidebarShell, so the dashboard remains visible behind the Dialog overlay

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
The migration script `scripts/011_add_onboarding_completed.sql` must be run against the Neon database before testing:
```bash
psql "$DATABASE_URL" -f scripts/011_add_onboarding_completed.sql
```

## Next Phase Readiness
- Full end-to-end onboarding flow is wired and ready for manual verification
- Awaiting human checkpoint to verify wizard behavior across user types

## Self-Check: PASSED

- Both modified files exist on disk
- Task 1 commit 3b30403 verified in git log
- npm run build succeeds

---
*Phase: 05-subscriber-onboarding*
*Completed: 2026-03-24*
