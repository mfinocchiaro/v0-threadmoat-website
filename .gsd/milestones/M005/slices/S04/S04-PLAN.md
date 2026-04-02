# S04: Custom Report Builder

**Goal:** User selects filters, picks companies from shortlist, chooses report sections (profiles, AI analysis, charts), clicks Generate — gets a narrative document with all selections and AI analysis, exportable as PDF or copyable as markdown.
**Demo:** After this: User selects filters, picks companies, chooses charts, clicks Generate — gets a narrative PDF/document with all selections and AI analysis.

## Tasks
- [x] **T01: Created CustomReportTab component with shortlist-preloaded company selection, typeahead search, 7 section toggles with AI rate-limit warning, and generate button wired as 4th tab in ReportGenerator** — ## Description

Create the `CustomReportTab` component in a new file (`components/charts/custom-report-tab.tsx`) and wire it as a fourth tab in the existing `ReportGenerator` Tabs structure. The tab provides: (1) company selection pre-populated from `useShortlist()` with a typeahead search to add more companies from the full dataset, (2) section toggles (checkboxes) for which report sections to include (Company Profile, Score Breakdown, AI Analysis, Charts), (3) a Generate button that transitions to a preview pane. This task proves the UI flow works end-to-end — content composition and export are T02 and T03.

## Steps

1. Create `components/charts/custom-report-tab.tsx`. Import `useShortlist` from `contexts/shortlist-context.tsx`. Accept `data: Company[]` prop (full filtered dataset, same as other tabs receive).
2. Build the company selection section:
   - Default selected companies from `useShortlist().shortlistedCompanies`
   - Typeahead input to search `data` by name, add to selection
   - Selected company chips with X remove button
   - Clear all / Reset to shortlist buttons
3. Build section configuration with checkboxes:
   - Company Profile (on by default)
   - Score Breakdown (on by default)
   - AI Analysis (off by default — warn about rate limit: "Uses 1 AI generation per company (10/hour limit)")
   - Charts: Bubble Chart, Quadrant Chart, Periodic Table, Treemap (all off by default)
4. Build Generate button — disabled when no companies selected. On click, set `mode` state from 'configure' to 'preview'. The preview pane is a placeholder div with "Report preview will appear here" — T02 fills it in.
5. In `components/charts/report-generator.tsx`: import `CustomReportTab`, add `<TabsTrigger value="custom-report">Custom Report</TabsTrigger>` to TabsList, add `<TabsContent value="custom-report"><CustomReportTab data={data} /></TabsContent>`.
6. Verify `npm run build` passes.

## Must-Haves

- [ ] `CustomReportTab` component exists in its own file
- [ ] Wired as 4th tab in ReportGenerator
- [ ] Company selection pre-populated from shortlist
- [ ] Typeahead search for adding companies from full dataset
- [ ] Section toggles with sensible defaults
- [ ] AI Analysis checkbox shows rate limit warning
- [ ] Generate button disabled when no companies selected
- [ ] Build passes with zero type errors

## Verification

- `npm run build` exits 0
- `test -f components/charts/custom-report-tab.tsx`
- `grep -q 'custom-report' components/charts/report-generator.tsx`
- `grep -q 'CustomReportTab' components/charts/report-generator.tsx`
- `grep -q 'useShortlist' components/charts/custom-report-tab.tsx`

## Inputs

- `components/charts/report-generator.tsx` — existing Tabs structure to add new tab
- `contexts/shortlist-context.tsx` — useShortlist() API for pre-populating companies
- `lib/company-data.ts` — Company type

## Expected Output

- `components/charts/custom-report-tab.tsx` — new component file
- `components/charts/report-generator.tsx` — modified to include 4th tab
  - Estimate: 1h
  - Files: components/charts/custom-report-tab.tsx, components/charts/report-generator.tsx
  - Verify: npm run build && test -f components/charts/custom-report-tab.tsx && grep -q 'custom-report' components/charts/report-generator.tsx && grep -q 'useShortlist' components/charts/custom-report-tab.tsx
- [x] **T02: Built report composition engine with sequential AI narrative fetching, streaming preview, per-company status badges, rate-limit circuit breaker, narrative caching, and copy-to-clipboard** — ## Description

Add report content composition to `CustomReportTab`. When the user clicks Generate, the component: (1) composes company profile sections from the Company data (reusing the text generation patterns from `generateReport()` in `report-generator.tsx`), (2) fetches AI narratives per-company sequentially via `/api/ai/narrative` (raw fetch, not useCompletion — need multiple sequential requests), (3) renders everything in a scrollable markdown preview pane, (4) provides copy-to-clipboard for the full composed report. The AI narrative fetch should show per-company progress (loading/complete/error) and cache results in component state so re-generating doesn't re-call the API.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `/api/ai/narrative` | Show error badge per company, continue with remaining companies | 60s timeout per request (matches maxDuration), mark as error | Show raw text or "AI analysis unavailable" fallback |

## Negative Tests

- **Error paths**: AI endpoint returns 429 (rate limit) — show "Rate limit reached" per-company, skip remaining AI fetches
- **Boundary conditions**: 0 companies selected (Generate disabled from T01), 1 company (no multi-company edge cases), AI Analysis unchecked (skip all narrative fetches entirely)

## Steps

1. In `custom-report-tab.tsx`, add a `composeReport()` function that builds a markdown string from selected companies and enabled sections:
   - For each company, include enabled sections: Company Profile header (name, location, founded, lifecycle phase, funding), Score Breakdown (7 score dimensions with justifications), AI Analysis placeholder
   - Use the same data formatting patterns as `generateReport()` in report-generator.tsx (reference its structure for consistency)
2. Add AI narrative fetching: when AI Analysis is enabled, iterate selected companies sequentially. For each, POST to `/api/ai/narrative` with `{ companyId: company.id }`, collect the streamed text via a ReadableStream reader. Store results in a `Map<string, { status: 'loading' | 'complete' | 'error', text: string }>` state. Cache completed results — if composeReport is called again with the same company, reuse cached narrative.
3. Show rate limit warning before generation starts: "This will use N of your 10 AI generations per hour" (where N = number of companies with AI Analysis enabled). Require confirmation if N > 5.
4. Build the preview pane: scrollable div rendering the composed markdown. Use the existing `AINarrativeSection` component pattern (split on `##` headings) for rendering AI sections. Show per-company status badges (spinner for loading, checkmark for complete, error icon for failed).
5. Add a Copy button that copies the full composed markdown to clipboard via `navigator.clipboard.writeText()`.
6. Verify `npm run build` passes.

## Must-Haves

- [ ] Report composition produces markdown with company profiles and score breakdowns
- [ ] AI narratives fetched sequentially per-company via raw fetch to `/api/ai/narrative`
- [ ] Per-company fetch status visible in UI (loading/complete/error)
- [ ] Rate limit warning shown before generation when AI Analysis enabled
- [ ] Results cached in component state — no re-fetch on re-generate
- [ ] Copy-to-clipboard button for full report markdown
- [ ] Build passes with zero type errors

## Verification

- `npm run build` exits 0
- `grep -q 'ai/narrative' components/charts/custom-report-tab.tsx`
- `grep -q 'clipboard' components/charts/custom-report-tab.tsx`
- `grep -q 'composeReport\|compose' components/charts/custom-report-tab.tsx`

## Observability Impact

- Signals added: Per-company AI fetch status (loading/complete/error) in component state, console.error for failed narrative fetches with company ID context
- Failure state exposed: Error badge per company in preview, rate-limit-exceeded state halts further fetches

## Inputs

- `components/charts/custom-report-tab.tsx` — T01 output, the tab UI to extend with composition logic
- `components/charts/report-generator.tsx` — reference for `generateReport()` text patterns and `AINarrativeSection` rendering
- `app/api/ai/narrative/route.ts` — the endpoint contract (POST with `{ companyId }`, streams text)
- `lib/company-data.ts` — Company type and `formatCurrency()`

## Expected Output

- `components/charts/custom-report-tab.tsx` — extended with report composition engine, AI fetching, markdown preview, and copy button
  - Estimate: 1.5h
  - Files: components/charts/custom-report-tab.tsx
  - Verify: npm run build && grep -q 'ai/narrative' components/charts/custom-report-tab.tsx && grep -q 'clipboard' components/charts/custom-report-tab.tsx
- [ ] **T03: Install PDF dependencies, capture chart snapshots, and assemble PDF export** — ## Description

Install `jspdf` and `html-to-image`, build a hidden offscreen chart rendering container that mounts the 4 chart components at fixed dimensions, capture them as PNG via `toPng()`, and compose the full PDF document with jsPDF. The PDF includes: a cover page with report metadata (title, date, company count), per-company sections with text content (profile, scores, AI narrative), and chart images. Text sections use jsPDF's text API with a lightweight markdown parser for headings/bold/bullets. Chart images are embedded at fixed width.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `html-to-image toPng()` | Log warning, skip chart image, continue with text-only section | 10s timeout per chart capture | Show "Chart capture failed" placeholder in PDF |
| `jsPDF` | Surface error to user ("PDF generation failed"), preserve markdown preview as fallback | N/A (synchronous) | N/A |

## Negative Tests

- **Error paths**: Chart container not rendered (charts disabled) — skip chart capture entirely, produce text-only PDF
- **Boundary conditions**: 0 charts selected (no capture needed), single company (minimal PDF), 10+ companies (multi-page PDF with correct page breaks)

## Steps

1. Install dependencies: `npm install jspdf html-to-image` (no `--legacy-peer-deps` needed — neither has React peer deps). Verify both appear in `package.json`.
2. In `custom-report-tab.tsx`, build a hidden chart render container. Use a div with `position: fixed; left: -9999px; visibility: hidden; width: 800px; height: 500px`. Conditionally mount the selected chart components (`BubbleChart`, `QuadrantChart`, `PeriodicTable`, `TreemapChart`) into this container, passing the report's selected companies as `data` and shortlisted IDs. Important: do NOT use `display: none` — charts need real dimensions to render. Use refs to access each chart's container div.
3. Build `captureCharts()` async function: for each enabled chart, call `toPng(chartContainerRef.current, { pixelRatio: 2 })` from `html-to-image`. Store results as `Map<string, string>` (chart ID → data URL). Handle capture errors per-chart (log warning, continue). Add a brief `await new Promise(r => setTimeout(r, 500))` delay between chart mounts to ensure D3 useEffect has run.
4. Build `generatePDF()` function using jsPDF:
   - Create `new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })`
   - Cover page: title ("ThreadMoat Custom Report"), date, company count, section summary
   - Per-company pages: company name header, profile text, score breakdown, AI narrative text (if included). Use `doc.splitTextToSize(text, pageWidth - margins)` for line wrapping. Track Y position and call `doc.addPage()` when approaching page bottom.
   - Chart pages: for each captured chart, `doc.addImage(dataUrl, 'PNG', x, y, width, height)`. One chart per half-page or one per page depending on content.
   - Build a lightweight markdown-to-jsPDF renderer that handles: `## ` headings (larger bold font), `**bold**` (bold font), `- ` bullet items (indented with bullet char), and plain paragraphs. Strip other markdown.
   - Call `doc.save('threadmoat-report.pdf')` to trigger download.
5. Add an "Export PDF" button next to the existing Copy button in the preview pane. Show a loading spinner during chart capture + PDF generation. Disable button during generation.
6. Verify `npm run build` passes and dependencies are in package.json.

## Must-Haves

- [ ] `jspdf` and `html-to-image` installed in package.json
- [ ] Hidden offscreen container renders charts at fixed 800×500 dimensions
- [ ] Chart snapshots captured via `toPng()` with `pixelRatio: 2`
- [ ] PDF generated with cover page, per-company text sections, chart images
- [ ] Basic markdown rendering in PDF (headings, bold, bullets)
- [ ] Page overflow handled with `splitTextToSize` and `addPage()`
- [ ] Export PDF button in preview pane with loading state
- [ ] Chart capture errors handled gracefully (text-only fallback)
- [ ] Build passes with zero type errors

## Verification

- `npm run build` exits 0
- `grep -q 'jspdf' package.json`
- `grep -q 'html-to-image' package.json`
- `grep -q 'jsPDF\|jspdf' components/charts/custom-report-tab.tsx`
- `grep -q 'toPng\|html-to-image' components/charts/custom-report-tab.tsx`
- `grep -q 'addPage\|splitTextToSize' components/charts/custom-report-tab.tsx`

## Observability Impact

- Signals added: Console warnings for failed chart captures with chart ID; PDF generation timing logged to console
- Failure state exposed: Per-chart capture status in component state; "Export PDF" button error state if generation fails

## Inputs

- `components/charts/custom-report-tab.tsx` — T02 output with report composition and markdown preview
- `components/charts/bubble-chart.tsx` — BubbleChart component (props: `data: Company[], shortlistedIds?: Set<string>`)
- `components/charts/quadrant-chart.tsx` — QuadrantChart component (props: `data: Company[], shortlistedIds?: Set<string>`)
- `components/charts/periodic-table.tsx` — PeriodicTable component (props: `data: Company[], shortlistedIds?: Set<string>`)
- `components/charts/treemap-chart.tsx` — TreemapChart component (props: `data: Company[], shortlistedIds?: Set<string>`)
- `package.json` — to add jspdf and html-to-image dependencies

## Expected Output

- `components/charts/custom-report-tab.tsx` — extended with chart capture container, PDF generation, and export button
- `package.json` — updated with jspdf and html-to-image dependencies
- `package-lock.json` — updated lock file
  - Estimate: 2h
  - Files: components/charts/custom-report-tab.tsx, package.json, package-lock.json
  - Verify: npm run build && grep -q 'jspdf' package.json && grep -q 'html-to-image' package.json && grep -q 'jsPDF\|jspdf' components/charts/custom-report-tab.tsx && grep -q 'toPng\|html-to-image' components/charts/custom-report-tab.tsx
