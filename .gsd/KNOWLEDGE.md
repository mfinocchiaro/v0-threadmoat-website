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

---

## K002 — @ai-sdk/react useCompletion: isLoading not status

**Context:** M005/S02 AI narrative integration
**Pattern:** The installed `@ai-sdk/react@3.0.x` `useCompletion` hook returns `isLoading: boolean`, not `status: string`. The `status` enum (`submitted | streaming | ready | error`) exists only in `useChat`, not `useCompletion`. Context7 docs may reference a newer version's API — always verify against the installed `node_modules/@ai-sdk/react/dist/index.d.ts` types.

**Also:** When the server uses `toTextStreamResponse()`, the client must set `streamProtocol: 'text'` in the `useCompletion` options. The default `'data'` protocol expects a different stream format and will fail silently.

**Why it matters:** Type errors caught at build time, but the streamProtocol mismatch causes silent runtime failures (empty completion, no error).

---

## K003 — Vercel AI SDK v6 API renames

**Context:** M005/S02 AI narrative endpoint
**Pattern:** `ai@6.x` renamed several `streamText` options vs v4/v5 docs and older examples:
- `maxTokens` → `maxOutputTokens`
- `toDataStreamResponse()` doesn't exist → use `toTextStreamResponse()` for plain text streaming
- Model string for Anthropic via `@ai-sdk/anthropic@3.x`: `anthropic('claude-sonnet-4-5')`

**Why it matters:** Most online examples and even Context7 may reference older API shapes. TypeScript catches these at build time, but knowing the renames upfront saves a debug cycle. Always check the installed `node_modules/ai/dist/index.d.ts` types when in doubt.

---

## K004 — D3 .style() does not accept null on HTML selections

**Context:** M005/S03 periodic table shortlist highlight
**Pattern:** D3's `.style(name, value)` on HTML element selections (e.g., `d3.select<HTMLDivElement, ...>`) does not accept `null` as the value — TypeScript rejects it. Use empty string `''` or `'none'`/`'0'` instead of `null` to clear a style. SVG selections (`d3.select<SVGElement, ...>`) are unaffected since they go through `.attr()`.

**Why it matters:** When conditionally applying styles (e.g., highlight when shortlisted, clear when not), the natural instinct is `.style('outline', shortlisted ? '2px solid #f59e0b' : null)`. This compiles for SVG but fails for HTML. Use `'none'` or `''` as the falsy branch.

---

## K005 — Chart extensibility via optional prop pattern

**Context:** M005/S03 shortlist highlighting across charts
**Pattern:** When adding cross-cutting features to chart components (like shortlist highlighting), use an optional prop (`shortlistedIds?: Set<string>`) rather than requiring it. Inside the chart, guard all highlight logic with `shortlistedIds?.has(id)`. This keeps charts backwards compatible — existing renders without the prop continue working, and new features can be threaded through incrementally.

**Why it matters:** The dashboard has 4+ chart types rendered from 6+ page files. Making the prop required would force simultaneous updates everywhere. Optional props let you thread features through one chart at a time during development.

---

## K006 — Offscreen chart capture for PDF export via html-to-image

**Context:** M005/S04 Custom Report Builder PDF export
**Pattern:** To capture D3/Recharts charts as PNG for PDF embedding, mount them in a hidden container with `position: fixed; left: -9999px; visibility: hidden; width: 800px; height: 500px`. Do NOT use `display: none` — charts need real dimensions for D3 useEffect to compute layouts and render SVG paths. Use `toPng()` from `html-to-image` with `pixelRatio: 2` for crisp output. Add a ~500ms delay between mounting and capture to let D3 effects run.

```tsx
<div ref={chartContainerRef} style={{ position: 'fixed', left: '-9999px', visibility: 'hidden', width: '800px', height: '500px' }}>
  {enabledCharts.map(chart => <ChartComponent key={chart.id} data={selectedCompanies} />)}
</div>
```

**Why it matters:** `display: none` produces zero-dimension containers and D3/Recharts render nothing. `visibility: hidden` preserves layout computation while keeping content off-screen. This pattern applies to any "render-to-image" scenario with layout-dependent chart libraries.

---

## K007 — jsPDF text wrapping and page break management

**Context:** M005/S04 Custom Report Builder PDF export
**Pattern:** Use `doc.splitTextToSize(text, maxWidth)` for line wrapping in jsPDF. Track Y position manually and call `doc.addPage()` when approaching page bottom. A lightweight markdown-to-jsPDF renderer can handle `## ` headings (larger bold font), `**bold**` (toggle font style), `- ` bullets (indented with bullet char), and `---` horizontal rules. Strip other markdown syntax. Always check `if (y > pageHeight - margin) doc.addPage()` before writing each block.

**Why it matters:** jsPDF has no built-in markdown renderer or automatic page breaks. Without explicit Y tracking, content overflows the page silently. This pattern produces readable multi-page PDFs from markdown without pulling in heavy HTML-to-PDF libraries.

---

## K008 — Register requirement IDs in REQUIREMENTS.md before referencing them in planning

**Context:** M005 milestone validation
**Pattern:** When milestone planning references requirement IDs (e.g., UX-10, RPT-01), those IDs must be formally registered in REQUIREMENTS.md before the milestone starts. M005 planning referenced 4 requirement IDs that were never registered, creating a traceability gap during validation — the features were delivered but couldn't be traced back to formal requirements.

**Why it matters:** The validation step checks requirement coverage. Informal requirement IDs that don't exist in REQUIREMENTS.md can't have their status tracked or transitioned. Register requirements upfront, even if briefly described, so the validation loop closes cleanly.
