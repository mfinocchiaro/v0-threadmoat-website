---
id: M005
title: "Intelligence Workbench — AI Narratives, Company Shortlist & Custom Report Builder"
status: complete
completed_at: 2026-04-02T06:07:36.170Z
key_decisions:
  - D002: Radix Popover for shortlist panel — consistent with existing filter dropdowns
  - D003: Amber #f59e0b with 2.5px stroke for shortlist highlight across all chart types
  - D004: jsPDF + html-to-image client-side PDF generation with offscreen chart capture — avoids server-side Puppeteer complexity
  - AI SDK v6 API (toTextStreamResponse + streamProtocol:'text', maxOutputTokens, @ai-sdk/react useCompletion)
  - Rate limit: 10 narrative generations per hour per user via Upstash Redis
  - Model: claude-sonnet-4-5 for investment analysis narratives
  - Sequential AI fetch with rate-limit circuit breaker for multi-company report generation
  - Pre-populate company selection from shortlist on first mount only (no re-syncs)
  - SSR-safe localStorage hydration pattern (default hidden → useEffect read → hydrated gate)
key_files:
  - app/api/ai/narrative/route.ts
  - components/charts/custom-report-tab.tsx
  - components/charts/report-generator.tsx
  - contexts/shortlist-context.tsx
  - components/dashboard/shortlist-panel.tsx
  - components/dashboard/filter-onboarding-guide.tsx
  - components/dashboard/filter-toolbar.tsx
  - components/ui/company-hover-card.tsx
  - hooks/use-thesis-gated-data.ts
  - components/charts/bubble-chart.tsx
  - components/charts/quadrant-chart.tsx
  - components/charts/periodic-table.tsx
  - components/charts/treemap-chart.tsx
lessons_learned:
  - Vercel AI SDK v6 has significant API renames vs v4/v5 docs — always check installed types, not online examples (K003)
  - useCompletion returns isLoading:boolean, not status:string — that's useChat only (K002)
  - D3 .style() on HTML selections rejects null — use empty strings or 'none' instead (K004)
  - Offscreen chart capture requires visibility:hidden not display:none — D3 needs real layout dimensions (K006)
  - Optional prop pattern (shortlistedIds?: Set<string>) enables incremental chart feature rollout without breaking existing renders (K005)
  - SSR-safe localStorage: default to hidden state, hydrate in useEffect, gate on hydrated boolean (K001)
  - --legacy-peer-deps needed for AI SDK and jsPDF due to React 19.2.0 vs 19.2.1 peer dep mismatch — monitor for resolution
  - Informal requirement IDs in planning should be registered in REQUIREMENTS.md upfront to maintain traceability
---

# M005: Intelligence Workbench — AI Narratives, Company Shortlist & Custom Report Builder

**Transformed ThreadMoat from a chart dashboard into an intelligence workbench with filter onboarding, streaming AI narrative analysis, cross-chart company shortlisting with amber highlights, and a full custom report builder with PDF export.**

## What Happened

M005 delivered four slices that collectively upgrade the ThreadMoat dashboard from passive visualization into an active intelligence workflow.

**S01 (Filter Workflow Onboarding)** added a dismissable inline callout in the filter toolbar that teaches new users that filters apply to all charts simultaneously. Uses an SSR-safe localStorage hydration pattern (K001) and auto-dismisses when the user applies their first filter. Lightweight, zero dependencies beyond localStorage.

**S02 (AI Narrative Engine)** installed Vercel AI SDK v6 (`ai@6.0.142`, `@ai-sdk/anthropic@3.0.64`) and built a streaming POST endpoint at `/api/ai/narrative`. The route authenticates via NextAuth, rate-limits to 10 requests/hour/user via Upstash Redis, loads company data from CSV, builds a structured investment analyst prompt, and streams four markdown sections (Impressions, Conclusions, Beware, Overlooked Opportunities) from Claude Sonnet 4.5. The UI integration uses `useCompletion` with stop/copy/error controls in the existing IntelligenceReportTab.

**S03 (Company Shortlist / Workspace)** created a full shortlist system: `ShortlistContext` with localStorage persistence, star toggle on `CompanyHoverCard`, amber (#f59e0b) highlights across all 4 chart types (bubble, quadrant, periodic table, treemap), and a `ShortlistPanel` Radix Popover in the filter toolbar with badge count. The `useThesisGatedData` hook was extended to return `shortlistedIds` so chart pages don't import the context directly. All chart props are optional for backwards compatibility (K005).

**S04 (Custom Report Builder)** tied everything together as the 4th tab in ReportGenerator. Company selection pre-populates from the shortlist with typeahead search. Seven configurable sections span content (Company Profile, Score Breakdown, AI Analysis) and charts (Bubble, Quadrant, Periodic Table, Treemap). Sequential AI narrative fetching with a rate-limit circuit breaker streams per-company analysis. The preview pane renders rich formatted markdown with copy-to-clipboard. PDF export uses jsPDF + html-to-image with an offscreen chart capture container (visibility:hidden preserving D3 layout dimensions).

All 4 slices built cleanly with `npm run build` passing at every step. Cross-slice integration verified: S04 consumes S02's AI endpoint and S03's shortlist, S01 and S03 coexist in the filter toolbar. 22 production files changed with 2,621 lines added.

## Success Criteria Results

- ✅ **Filter workflow has onboarding for new users** — S01 delivered `FilterOnboardingGuide`: dismissable inline callout in FilterToolbar with localStorage persistence and auto-dismiss on first filter use. Verified by `npm run build` + structural grep.
- ✅ **Report generator produces AI narrative with Impressions, Conclusions, Beware, Overlooked Opportunities** — S02 delivered streaming `/api/ai/narrative` endpoint with auth, rate-limiting (10/hr/user), Claude Sonnet 4.5, and 4-section markdown output. UI integration via `useCompletion` with stop/copy/error controls. Verified by build + 10 structural checks.
- ✅ **Users can shortlist companies across charts with visual highlight** — S03 delivered ShortlistContext with full API, star toggle on hover cards, amber highlights on 4 chart types, ShortlistPanel popover with badge in filter toolbar, shortlistedIds threaded through 6 page files. Verified by build + 9 grep checks.
- ✅ **Report builder combines selections into exportable narrative document** — S04 delivered CustomReportTab: shortlist pre-population, typeahead search, 7 section toggles, sequential AI fetch with circuit breaker, markdown preview + copy, PDF export with offscreen chart capture. Verified by build + 13 structural checks.

## Definition of Done Results

- ✅ **All slices complete** — S01, S02, S03, S04 all marked `[x]` in M005-ROADMAP.md
- ✅ **All slice summaries exist** — S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md, S04-SUMMARY.md all present
- ✅ **All task summaries exist** — 9 task summaries (S01/T01, S02/T01-T02, S03/T01-T03, S04/T01-T03) all present
- ✅ **All UAT files exist** — S01-UAT.md through S04-UAT.md all present
- ✅ **Cross-slice integration verified** — S02→S04 (AI endpoint), S03→S04 (shortlist), S01+S03 (toolbar coexistence) all confirmed in VALIDATION.md
- ✅ **Build passes** — `npm run build` exits 0 with zero type errors
- ✅ **Code changes are real** — 22 non-.gsd files, 2,621 insertions, 62 deletions across components, hooks, contexts, API routes, and pages

## Requirement Outcomes

No requirement status transitions during M005. All 9 requirements in REQUIREMENTS.md (DATA-01, DATA-02, I18N-06, MON-01, UX-01 through UX-05) were already in `validated` status from prior milestones.

M005 planning referenced 4 requirement IDs (UX-10, RPT-01, UX-11, RPT-02) that were never registered in REQUIREMENTS.md. The features these would have tracked were delivered as specified by the success criteria and slice definitions — the gap is process-level (unregistered requirements), not functional.

## Deviations

SDK v6 API differs from plan assumptions (maxOutputTokens vs maxTokens, toTextStreamResponse vs toUIMessageStreamResponse, isLoading vs status). Installed @ai-sdk/react with --legacy-peer-deps due to React 19 peer dep mismatch. Chart container renders all enabled charts simultaneously rather than sequential capture. D3 .style() null handling on HTML selections required workaround. None of these affected the delivered functionality.

## Follow-ups

CSV is re-parsed on every narrative request (~3.5MB) — consider caching at higher load. PDF markdown renderer is lightweight (headings, bold, bullets only) — tables, nested lists, code blocks not rendered. Chart capture uses a 500ms heuristic delay — not a guaranteed render-complete signal. No end-to-end test with real Anthropic API call — structural verification only. UAT scripts written but not confirmed as human-executed. Operational metrics (LLM cost, generation latency) not formally benchmarked.
