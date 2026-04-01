# S01: Filter Workflow Onboarding — UAT

**Milestone:** M005
**Written:** 2026-04-01T21:47:31.223Z

# S01: Filter Workflow Onboarding — UAT

**Milestone:** M005
**Written:** 2026-04-01

## UAT Type

- UAT mode: human-experience
- Why this mode is sufficient: This is a UI onboarding feature. The key behaviors (visibility, dismissal, persistence) require visual confirmation in a browser session with localStorage access.

## Preconditions

- Dev server running (`npm run dev`)
- Browser localStorage cleared for the site (or `filter-onboarding-dismissed` key removed)
- User logged in with dashboard access

## Smoke Test

Navigate to `/dashboard`. A blue info-icon callout should appear at the top of the filter toolbar saying filters apply to all charts. If it doesn't appear, check that `filter-onboarding-dismissed` is not already set in localStorage.

## Test Cases

### 1. Callout appears for new users

1. Clear localStorage (DevTools → Application → Local Storage → clear all for this origin)
2. Navigate to `/dashboard`
3. **Expected:** A compact info bar appears at the top of the filter toolbar with a blue info icon, text about filters applying to all charts, and an X dismiss button.

### 2. Dismiss via X button persists

1. With the callout visible, click the X button
2. **Expected:** Callout disappears immediately
3. Refresh the page
4. **Expected:** Callout does not reappear
5. Check localStorage: `filter-onboarding-dismissed` should equal `"true"`

### 3. Auto-dismiss on first filter application

1. Clear localStorage and refresh to show the callout
2. Apply any filter (e.g., select an Investment List from the filter dropdowns)
3. **Expected:** Callout disappears automatically when the first filter is applied
4. Refresh the page
5. **Expected:** Callout does not reappear (localStorage key is set)

### 4. Callout does not appear for returning users

1. With `filter-onboarding-dismissed` = `"true"` in localStorage, navigate to `/dashboard`
2. **Expected:** No callout visible. Filter toolbar shows chips or "No filters active" as normal.

## Edge Cases

### localStorage unavailable (private/incognito)

1. Open the dashboard in a private/incognito window where localStorage may throw
2. **Expected:** Callout stays hidden (fails safe to dismissed). No console errors.

### Rapid filter toggle

1. Clear localStorage, refresh to show callout
2. Rapidly click a filter on and off
3. **Expected:** Callout auto-dismisses on the first filter application and does not reappear even after removing the filter.

## Failure Signals

- Callout appears on every page load despite having been dismissed (localStorage not being read)
- React hydration mismatch error in console (SSR rendering differs from client)
- Callout flashes briefly then disappears on page load (hydration timing issue)
- Console errors related to localStorage access

## Not Proven By This UAT

- That the callout message text is optimal for user comprehension (copy testing)
- Behavior on non-dashboard pages (component only renders inside FilterToolbar)
- Accessibility screen reader experience (component has role="status" and aria-label on dismiss)

## Notes for Tester

- The callout is intentionally subtle — a thin bar, not a modal or dialog. It should feel like a gentle hint, not an interruption.
- The auto-dismiss on first filter is the primary expected path — most users will interact with filters quickly.
