# Knowledge

Lessons learned, recurring patterns, and rules that future agents should follow.

---

## K001 — SSR-safe localStorage in Next.js client components

**Context:** M005/S01 FilterOnboardingGuide component
**Pattern:** Default state to the "hidden/dismissed" value, then hydrate from localStorage in a `useEffect`. This avoids hydration mismatches since `localStorage` is not available during SSR. Use a separate `hydrated` boolean to gate rendering so the component doesn't flash.

```tsx
const [dismissed, setDismissed] = React.useState(true) // default hidden
const [hydrated, setHydrated] = React.useState(false)
React.useEffect(() => {
  const stored = localStorage.getItem(KEY)
  if (stored !== "true") setDismissed(false)
  setHydrated(true)
}, [])
if (dismissed || !hydrated) return null
```

**Why it matters:** Several dashboard components may need localStorage persistence (preferences, dismissed states, shortlist). This pattern prevents the common "content flash" or React hydration error.
