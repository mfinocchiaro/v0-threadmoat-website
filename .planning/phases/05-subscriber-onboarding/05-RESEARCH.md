# Phase 5: Subscriber Onboarding - Research

**Researched:** 2026-03-24
**Domain:** B2B dashboard onboarding UX, Next.js dialog patterns, Neon Postgres state persistence
**Confidence:** HIGH

## Summary

Phase 5 adds a guided first-visit experience to the ThreadMoat dashboard. The existing codebase already has most infrastructure needed: a `Dialog` component (Radix UI), a `profiles` table with user metadata, an API route pattern for profile updates (`POST /api/profile`), and a ScenarioPicker that already serves as a partial "welcome" screen for users without a `profile_type`. The work is primarily: (1) add an `onboarding_completed` boolean column to the `profiles` table, (2) build a multi-step dialog overlay that highlights 3 key visualizations, (3) wire the completion state into the dashboard layout so it only shows once.

The approach should be a modal dialog wizard (not tooltips or product tours) because the dashboard has 44+ pages across 5 tab groups -- tooltip-based tours would be fragile across route changes and overly complex. A centered dialog with 3-4 steps, each showcasing a key visualization with a screenshot/description and a "Go there" link, fits the B2B professional tone and can be built entirely with existing shadcn/ui components. No external onboarding libraries are needed.

**Primary recommendation:** Use a 3-step Dialog wizard triggered by checking `onboarding_completed === false` in the dashboard layout, persisted to Postgres via a new API endpoint, with localStorage as a fast client-side cache to prevent flicker.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBD-01 | New subscriber sees guided first-visit experience in dashboard | Dialog wizard component triggered when `profiles.onboarding_completed` is false; shown inside `DashboardLayoutClient` after scenario selection |
| ONBD-02 | Clear value demonstration within first 60 seconds of dashboard access | 3-step wizard highlighting Magic Quadrant, Geography Map, and Startup Ecosystem -- each with description + direct navigation link; total read time ~45 seconds |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | 1.1.4 | Modal overlay for onboarding wizard | Already installed, powers existing `components/ui/dialog.tsx` |
| @neondatabase/serverless | (existing) | Database queries for onboarding state | Already used in `lib/db.ts` |
| zod | (existing) | API input validation | Already used in `app/api/profile/route.ts` |
| lucide-react | (existing) | Icons for wizard steps | Already used throughout dashboard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation | (Next.js 15) | `useRouter` for "Go explore" navigation from wizard | When user clicks to navigate to a highlighted chart |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Dialog wizard | react-joyride / Shepherd.js | Product tour libraries add tooltip-based walkthroughs; overkill for 3-step B2B welcome, add bundle size, fragile across route changes |
| Database persistence | localStorage only | Loses state on device/browser change; database is correct for B2B where users may log in from multiple machines |
| Full-page onboarding route | Dialog overlay | Separate route interrupts flow and requires redirect logic; dialog is less disruptive and aligns with existing UX patterns |

## Architecture Patterns

### Recommended Project Structure

```
components/
  dashboard/
    onboarding-wizard.tsx    # Multi-step dialog component
app/
  api/
    profile/
      onboarding/
        route.ts             # POST endpoint to mark onboarding complete
scripts/
  011_add_onboarding_completed.sql  # Migration script
```

### Pattern 1: Database-Backed Onboarding State

**What:** Add `onboarding_completed BOOLEAN DEFAULT false` to the `profiles` table. Query this in `app/dashboard/layout.tsx` (server component) and pass it down as a prop. The client-side `DashboardLayoutClient` renders the wizard when `onboardingCompleted === false`.

**When to use:** Always -- this is the persistence layer.

**Example:**
```sql
-- scripts/011_add_onboarding_completed.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

```typescript
// In app/dashboard/layout.tsx, add to the profile query:
const rows = await sql`
  SELECT is_admin, full_name, company, title, profile_type, onboarding_completed
  FROM profiles
  WHERE id = ${userId}
`
```

### Pattern 2: Multi-Step Dialog Wizard

**What:** A React component using the existing `Dialog` from `components/ui/dialog.tsx` with internal step state (0, 1, 2, complete). Each step shows a visualization name, icon, 1-2 sentence description, and a preview. The final step has "Start Exploring" CTA.

**When to use:** On first dashboard visit when `onboarding_completed` is false and user has an active subscription (not explorer trial).

**Example:**
```typescript
// components/dashboard/onboarding-wizard.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    title: "Magic Quadrant",
    description: "Position 500+ startups across Visionaries, Leaders, Niche Players, and Challengers. Identify market positioning gaps at a glance.",
    href: "/dashboard/quadrant",
    icon: GitBranch,
  },
  {
    title: "Geography Map",
    description: "Explore startup hubs worldwide with 2D and 3D views. See where innovation clusters form by category and funding level.",
    href: "/dashboard/map",
    icon: Map,
  },
  {
    title: "Startup Ecosystem",
    description: "Interactive force-directed graph showing relationships between startups, industries, manufacturing types, and countries.",
    href: "/dashboard/network",
    icon: Network,
  },
]

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(true)
  // ... step navigation, completion handler
}
```

### Pattern 3: API Route for Completion

**What:** A dedicated `POST /api/profile/onboarding` endpoint that sets `onboarding_completed = true`. Follows the exact same auth + sql pattern as `POST /api/profile`.

**When to use:** Called when user clicks "Start Exploring" on the final wizard step, or clicks "Skip" at any point.

**Example:**
```typescript
// app/api/profile/onboarding/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await sql`UPDATE profiles SET onboarding_completed = true WHERE id = ${session.user.id}`
  return NextResponse.json({ ok: true })
}
```

### Pattern 4: Tier-Aware Wizard Content

**What:** The wizard steps should adapt based on the user's `accessTier`. Explorer users see the 3 free visualizations (Network, Landscape Intro, Map). Analyst users see Analyst-tier highlights (Quadrant, Map, Treemap). Strategist users see premium features (Compare, Investor Network, Sankey).

**When to use:** Always -- avoids showing users features they cannot access.

### Anti-Patterns to Avoid

- **Tooltip-based product tours across routes:** The dashboard has 44+ separate page routes. Tooltip tours (react-joyride, Shepherd) work for single-page apps but break when navigating between `/dashboard/quadrant` and `/dashboard/map`. A dialog wizard avoids this entirely.
- **Blocking onboarding before scenario selection:** The existing `ScenarioPicker` already handles first-visit users who have no `profile_type`. The onboarding wizard should trigger AFTER scenario selection, not replace it.
- **Showing onboarding to admin users:** Admins already know the product. Skip onboarding for `isAdmin === true`.
- **Showing onboarding to expired trial users:** They need a paywall, not a tour. Only show to users with active subscriptions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialog | Custom portal + overlay | Existing `components/ui/dialog.tsx` (Radix) | Focus trapping, ESC handling, scroll lock, animations already handled |
| Step indicator dots | Custom CSS dots | Simple `div` with conditional `bg-primary` classes | 3 steps is too few to justify a stepper component |
| State persistence | Custom state management | Database column + API route (matches existing profile pattern) | Consistent with how `profile_type`, `dashboard_layout`, `saved_theses` are already stored |

## Common Pitfalls

### Pitfall 1: Onboarding Flicker on Page Load

**What goes wrong:** Server renders dashboard, client hydrates, THEN checks onboarding state -- user sees dashboard content flash before wizard appears.
**Why it happens:** If onboarding state is only checked client-side (e.g., via useEffect fetch), there's a render cycle delay.
**How to avoid:** Pass `onboardingCompleted` from the server component (`layout.tsx`) as a prop. The wizard renders immediately on first client render because the data is already available. Use `defaultOpen={true}` on the Dialog.
**Warning signs:** Users report seeing dashboard briefly before wizard appears.

### Pitfall 2: Wizard Shown After Every Login

**What goes wrong:** Onboarding state is stored in localStorage only, user clears browser data or logs in from a different device, sees wizard again.
**Why it happens:** Client-only persistence.
**How to avoid:** Primary storage in Postgres (`profiles.onboarding_completed`), with localStorage as a fast cache to prevent unnecessary re-renders. On completion, write to both.
**Warning signs:** Support tickets from returning users seeing onboarding again.

### Pitfall 3: Showing Locked Features in Wizard

**What goes wrong:** Explorer user sees "Magic Quadrant" highlighted in onboarding, clicks "Go there," hits a paywall.
**Why it happens:** Wizard content is static and doesn't account for tier-based access.
**How to avoid:** Filter wizard steps using `isPathAllowed(step.href, accessTier)` from `lib/tiers.ts`. Each tier gets its own curated highlight set.
**Warning signs:** User frustration immediately after onboarding ("you just showed me that!").

### Pitfall 4: Onboarding Blocking Scenario Picker

**What goes wrong:** User hasn't selected a profile_type yet but sees the onboarding wizard, which references scenarios.
**Why it happens:** Wizard triggers too early in the flow.
**How to avoid:** Only show onboarding wizard when `profile_type` is already set (scenario selected). The `ScenarioPicker` in `dashboard-client.tsx` already handles the "no profile_type" case. Onboarding comes after.
**Warning signs:** Wizard content doesn't make sense without a scenario context.

## Code Examples

### Existing Pattern: Server-to-Client Data Flow (from layout.tsx)

```typescript
// app/dashboard/layout.tsx already queries profiles and passes props:
const rows = await sql`
  SELECT is_admin, full_name, company, title, profile_type
  FROM profiles WHERE id = ${userId}
`
// Then passes to:
<DashboardLayoutClient user={user} profile={profile} ... />
```

The onboarding flag follows this exact pattern -- add `onboarding_completed` to the query, pass it as a prop.

### Existing Pattern: API Route with Auth (from /api/profile/route.ts)

```typescript
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... validate, update profiles table
}
```

The onboarding completion endpoint follows this exact pattern.

### Key Visualizations to Highlight Per Tier

```typescript
// Explorer (free): show what they CAN access
const EXPLORER_HIGHLIGHTS = [
  { title: "Startup Ecosystem", href: "/dashboard/network", desc: "Force-directed graph of 500+ startups" },
  { title: "Investment Landscape", href: "/dashboard/landscape-intro", desc: "Category overview with funding data" },
  { title: "Geography Map", href: "/dashboard/map", desc: "2D/3D global startup distribution" },
]

// Analyst ($18,999/yr): show the premium value they're paying for
const ANALYST_HIGHLIGHTS = [
  { title: "Magic Quadrant", href: "/dashboard/quadrant", desc: "Leaders, Challengers, Visionaries, Niche Players" },
  { title: "Geography Map", href: "/dashboard/map", desc: "2D/3D global startup distribution" },
  { title: "Category Treemap", href: "/dashboard/treemap", desc: "Proportional market segment visualization" },
]

// Strategist (custom): show the full-access premium features
const STRATEGIST_HIGHLIGHTS = [
  { title: "Company Compare", href: "/dashboard/compare", desc: "Side-by-side competitive analysis" },
  { title: "Investor Network", href: "/dashboard/investor-network", desc: "Investor relationship mapping" },
  { title: "Sankey Flow", href: "/dashboard/sankey", desc: "Funding flow visualization" },
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cookie-based onboarding flags | Database-backed with server-side check | Standard practice | Reliable across devices, no flicker |
| Full-page onboarding flows | Overlay dialog wizards | ~2023 | Less disruptive, user stays in context |
| Generic product tours | Tier/role-aware guided experiences | ~2024 | Higher relevance, lower bounce from onboarding |

## Open Questions

1. **Screenshots or live previews in wizard steps?**
   - What we know: Static screenshots are simpler and load faster; live chart previews would be more impressive but require loading data
   - What's unclear: Whether the added complexity of rendering mini-charts in the wizard is worth it
   - Recommendation: Start with icon + text description. Add screenshots in a future iteration if metrics show low onboarding completion rates. The 60-second target is achievable with text alone.

2. **Should onboarding re-trigger on tier upgrade?**
   - What we know: A user upgrading from Explorer to Analyst gains access to 13 new charts
   - What's unclear: Whether a second onboarding for the new tier would be valuable
   - Recommendation: Defer to v2. For now, onboarding fires once. A "What's new in your plan" feature could be added later.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBD-01 | Wizard dialog appears for new subscribers | manual-only | Manual: log in as new user, verify dialog appears | N/A |
| ONBD-02 | Value demonstrated within 60 seconds | manual-only | Manual: time from login to wizard completion | N/A |

**Justification for manual-only:** Both requirements involve UI rendering behavior (dialog visibility) and subjective user experience (value demonstration). Without a test framework installed, and given that these are full-page integration behaviors requiring auth state, manual verification is appropriate. The phase is small (2 requirements, ~4 files changed).

### Wave 0 Gaps

No test infrastructure exists in this project. Installing a test framework for 2 manual-verification requirements would be disproportionate. Recommend deferring test framework setup to a future phase with more testable logic.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `app/dashboard/layout.tsx`, `components/dashboard/layout-client.tsx`, `components/dashboard/dashboard-client.tsx` -- verified server-to-client data flow pattern
- Codebase inspection: `scripts/000_initial_schema.sql` -- verified profiles table schema (no `onboarding_completed` column exists yet)
- Codebase inspection: `lib/tiers.ts` -- verified tier system with `isPathAllowed()` function
- Codebase inspection: `components/ui/dialog.tsx` -- verified Radix Dialog component exists with all needed subcomponents
- Codebase inspection: `app/api/profile/route.ts` -- verified API route pattern for profile updates

### Secondary (MEDIUM confidence)
- B2B onboarding patterns: dialog wizards preferred over tooltip tours for multi-page dashboards -- based on standard UX practice for B2B analytics products

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already exist in codebase, no new dependencies needed
- Architecture: HIGH -- follows exact existing patterns (profile query, API route, Dialog component)
- Pitfalls: HIGH -- derived from inspecting actual code flow and identifying concrete failure modes

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- no external dependencies to drift)
