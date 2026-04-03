# S02: Industry Penetration Heatmap — Research

**Date:** 2026-04-01

## Summary

The Industry Penetration chart, dashboard page, sidebar navigation, and advanced tab integration **already exist** from pre-M006 work. The chart (`components/charts/industry-penetration-chart.tsx`) is a fully functional D3 SVG heatmap following the same structural pattern as the S01 Market Momentum chart — theme-aware colors, tooltips, shortlist highlighting (K005), configurable Y-axis grouping (investment thesis / workflow segment / manufacturing type), and three value modes (startup count, avg weighted score, avg funding).

The one gap between what exists and what the roadmap specifies is the **"known customer count per industry"** metric. The roadmap says the heatmap should show industry penetration "measured by known customer count per industry." The current chart counts **startups** per cell, not **individual known customers**. Adding a fourth value mode that sums parsed known customers per cell (using `parseKnownCustomers()` from `lib/customer-logos.ts`) would close this gap — a cell with 2 startups might have 20 known customers, revealing deeper penetration signal.

This is straightforward work: one new value mode in an existing chart component, plus storing the customer count during the `useMemo` cell-building pass.

## Recommendation

Add a `"customerCount"` value mode to the existing `IndustryPenetrationChart`. During the cell-building loop, parse each company's `knownCustomers` string via `parseKnownCustomers()` and accumulate a per-cell customer count. Wire it into the value mode dropdown, color scale, cell text display, and tooltip. No new files, no new pages, no sidebar changes — purely an enhancement to the existing chart component.

## Implementation Landscape

### Key Files

- `components/charts/industry-penetration-chart.tsx` — **Primary change target.** The existing chart with `ValueMode` type and `VALUE_MODES` array. Add `"customerCount"` to both, extend `CellData` with a `customerCount` field, accumulate it in the `useMemo` cell-building pass using `parseKnownCustomers()`, and wire it into `valueAccessor`, cell text display, tooltip, and legend label.
- `lib/customer-logos.ts` — **Read-only dependency.** Exports `parseKnownCustomers(raw: string): string[]` which splits the comma-separated `knownCustomers` string and filters to real company names. Import this in the chart.
- `lib/company-data.ts` — **Read-only dependency.** The `Company` interface has `knownCustomers: string` and `industriesServed: string[]` — both already used by the chart.
- `app/dashboard/industry-penetration/page.tsx` — **No changes needed.** Already wired with `VizPageShell`, `useThesisGatedData`, and `shortlistedIds`.
- `components/dashboard/sidebar.tsx` — **No changes needed.** Already has the Industry Penetration entry in `ADMIN_ITEMS` and `ADMIN_VIZ_HREFS`.
- `app/dashboard/tab/advanced/page.tsx` — **No changes needed.** Already imports and renders `IndustryPenetrationChart`.

### Build Order

1. **Add customer count to chart** — Extend `CellData` interface, `ValueMode` type, `VALUE_MODES` array, cell-building `useMemo`, `valueAccessor`, cell text, tooltip, and legend label. This is a single-file change in `industry-penetration-chart.tsx`.
2. **Verify** — Build passes, page renders, customer count mode shows non-zero values for populated cells.

### Verification Approach

- `npx next build` passes with zero type errors
- Navigate to `/dashboard/industry-penetration`, select "Customer Count" value mode — cells show customer counts, color intensity reflects customer density, tooltip shows customer count per cell
- Spot-check a known company (e.g., nTop with ~17 known customers, aPriori with ~20+) — verify their industry cells show the customer count contribution

## Common Pitfalls

- **`parseKnownCustomers` is a client-side import** — The chart is `"use client"` and `parseKnownCustomers` lives in `lib/customer-logos.ts` which has no server-only dependencies, so this import is safe. No SSR concerns.
- **Performance with 500+ companies** — Parsing `knownCustomers` strings in the `useMemo` loop adds negligible overhead since `parseKnownCustomers` is a simple string split + filter. The loop already iterates all companies × industries × Y-groups.
- **D3 `.style()` null pitfall (K004)** — Not applicable here since the chart uses `.attr()` on SVG elements, not `.style()` on HTML elements.