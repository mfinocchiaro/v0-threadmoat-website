---
id: S04
parent: M005
milestone: M005
provides:
  - CustomReportTab component (4th tab in ReportGenerator)
  - Client-side PDF export with chart capture pipeline
  - Report composition engine producing markdown from Company data + AI narratives
requires:
  - slice: S02
    provides: AI narrative endpoint at /api/ai/narrative (POST with companyId, streams text)
  - slice: S03
    provides: useShortlist() hook for pre-populating company selection
affects:
  []
key_files:
  - components/charts/custom-report-tab.tsx
  - components/charts/report-generator.tsx
  - package.json
key_decisions:
  - Pre-populate company selection from shortlist on first mount only (no confusing re-syncs)
  - Sequential AI fetch with rate-limit circuit breaker — 429 halts remaining fetches
  - Cache AI narratives in component state Map keyed by company ID
  - Rate limit confirmation modal when AI generation count > 5
  - jsPDF + html-to-image for client-side PDF generation (no server-side Puppeteer)
  - Hidden chart container uses position:fixed + visibility:hidden to preserve D3 rendering dimensions
  - Lightweight markdown-to-jsPDF renderer for headings, bold, bullets, page breaks
patterns_established:
  - Offscreen chart capture pattern: visibility:hidden container + toPng() for D3/Recharts → PNG conversion
  - Sequential multi-request AI fetch with circuit breaker and per-item status tracking
  - Compose-then-export pattern: build markdown in state, render preview, then convert to PDF on demand
observability_surfaces:
  - Per-company AI fetch status (loading/complete/error/rate-limited) visible in preview UI
  - Console.error for failed narrative fetches with company ID context
  - Console warnings for failed chart captures with chart ID
  - PDF generation timing logged to console
  - Export PDF button error state if generation fails
drill_down_paths:
  - .gsd/milestones/M005/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T06:03:55.782Z
blocker_discovered: false
---

# S04: Custom Report Builder

**Built end-to-end custom report builder: company selection from shortlist, 7 configurable sections, sequential AI narrative fetching with rate-limit circuit breaker, markdown preview with copy-to-clipboard, and PDF export with offscreen chart capture.**

## What Happened

S04 delivers the capstone feature for M005 — a Custom Report Builder that ties together every prior slice (onboarding from S01, AI narratives from S02, shortlist from S03) into a single workflow where users compose, preview, and export intelligence reports.

**T01** created the CustomReportTab component and wired it as the 4th tab in ReportGenerator. The tab provides company selection pre-populated from useShortlist() with typeahead search across the full dataset, 7 section toggles in two groups (content: Company Profile, Score Breakdown, AI Analysis; charts: Bubble, Quadrant, Periodic Table, Treemap), and a Generate button that transitions from configure to preview mode. AI Analysis checkbox includes rate-limit warning text.

**T02** built the report composition engine. Three pure functions (composeCompanyProfile, composeScoreBreakdown, composeReport) construct markdown from Company data. Sequential AI narrative fetching via raw fetch to /api/ai/narrative uses ReadableStream for progressive streaming updates with per-company status badges (loading/complete/error/rate-limited). A rate-limit circuit breaker detects 429 responses and halts remaining fetches. Results are cached in a Map keyed by company ID so re-generation reuses completed narratives. The preview pane renders rich formatted content with company headers, strengths/risks panels, financial metrics, score breakdowns with justifications, and AI analysis sections. Copy-to-clipboard button copies full composed markdown.

**T03** installed jspdf and html-to-image, built an offscreen chart rendering container (position:fixed, visibility:hidden, 800×500px) that mounts the 4 chart components for capture via toPng() at 2x pixel ratio. A lightweight markdown-to-jsPDF renderer handles headings, bold, bullets, horizontal rules, and page breaks. The generated PDF includes a cover page with report metadata, per-company text sections, and chart images. Export PDF button with loading spinner sits alongside the Copy Markdown button.

All three tasks built cleanly with zero type errors. No blockers discovered.

## Verification

All 13 slice-level verification checks pass:
- npm run build exits 0 (zero type errors, full production build)
- custom-report-tab.tsx exists
- report-generator.tsx contains 'custom-report' tab value and CustomReportTab import
- custom-report-tab.tsx uses useShortlist, ai/narrative, clipboard, composeReport
- package.json contains jspdf and html-to-image
- custom-report-tab.tsx contains jsPDF, toPng/html-to-image, addPage/splitTextToSize

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Used --legacy-peer-deps for npm install of jspdf and html-to-image due to pre-existing React 19 peer dependency conflicts. Chart container renders all enabled charts simultaneously rather than one-at-a-time sequential capture.

## Known Limitations

PDF rendering uses a lightweight custom markdown parser — complex markdown (tables, nested lists, code blocks) is not rendered. Chart capture depends on D3 useEffect timing — a 500ms delay is used as a heuristic, not a guaranteed render-complete signal. AI narrative streaming uses raw fetch rather than useCompletion hook because multiple sequential per-company requests are needed.

## Follow-ups

None.

## Files Created/Modified

- `components/charts/custom-report-tab.tsx` — New component: CustomReportTab with company selection, section toggles, report composition engine, AI narrative fetching, markdown preview, copy-to-clipboard, offscreen chart capture, and PDF export
- `components/charts/report-generator.tsx` — Added 4th tab (Custom Report) with TabsTrigger and TabsContent wiring CustomReportTab
- `package.json` — Added jspdf and html-to-image dependencies
- `package-lock.json` — Lock file updated for new dependencies
