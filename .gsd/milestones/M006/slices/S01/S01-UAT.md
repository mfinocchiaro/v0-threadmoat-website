# S01: Market Momentum Heatmap — UAT

**Milestone:** M006
**Written:** 2026-04-03T06:28:46.975Z

# S01: Market Momentum Heatmap — UAT

**Milestone:** M006
**Written:** 2026-04-01

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: The heatmap is a visual D3 chart rendered client-side — must verify in-browser that data loads, cells render, interactions work, and navigation is wired.

## Preconditions

- `npm run dev` running (or `npx next build && npx next start`)
- Logged in as admin or strategist tier user (needed for dashboard access)
- CSV data file (`Startups-Grid Full DB View.csv`) contains Momentum Multiplier and Momentum Cap columns

## Smoke Test

Navigate to `/dashboard/market-momentum`. A colored heatmap grid should render with company momentum data — cells colored yellow-to-red by intensity.

## Test Cases

### 1. Page loads and chart renders

1. Navigate to `/dashboard/market-momentum`
2. Wait for data to load (skeleton should appear briefly)
3. **Expected:** Heatmap SVG renders with colored cells. X-axis shows growth momentum tiers (Accelerating, High Growth, Steady, Early/Pre-revenue, Stalled, Unknown). Y-axis shows industry/thesis/segment labels. Title reads "Market Momentum".

### 2. Y-axis grouping selector works

1. On the Market Momentum page, locate the dropdown in the card header
2. Switch from default "Industries Served" to "Investment Theses"
3. Switch to "Workflow Segment"
4. **Expected:** Y-axis labels change with each selection. Cell colors and counts update to reflect the new grouping. Chart re-renders without errors.

### 3. Tooltip displays component breakdown

1. Hover over a colored (non-empty) cell in the heatmap
2. **Expected:** Tooltip appears showing: tier × group name, company count, average composite score, component breakdown (growth metrics avg, customer signal avg, momentum multiplier avg). If any shortlisted companies are in that cell, their names appear.

### 4. Empty cells render distinctly

1. Find a cell with no companies (muted/gray fill)
2. **Expected:** Empty cells have a muted fill with thin border, visually distinct from scored cells. No tooltip data for 0-company cells.

### 5. Shortlist highlighting

1. Add 2-3 companies to the shortlist via the toolbar shortlist feature
2. Navigate to Market Momentum page
3. **Expected:** Cells containing shortlisted companies show an amber (#f59e0b) highlight stroke. Tooltip for those cells lists shortlisted company names.

### 6. Sidebar navigation entry

1. Open the dashboard sidebar
2. **Expected:** "Market Momentum" appears in the sidebar navigation list with TrendingUp icon. Clicking it navigates to `/dashboard/market-momentum`. The entry highlights when active.

### 7. Color scale uses YlOrRd (not YlGn)

1. Compare the Market Momentum heatmap colors with the Growth Momentum chart at `/dashboard/growth-momentum`
2. **Expected:** Market Momentum uses yellow-orange-red palette. Growth Momentum uses yellow-green palette. The two are visually distinct.

## Edge Cases

### No companies match current filters

1. Apply filters that exclude all companies (e.g., a very restrictive thesis filter)
2. Navigate to Market Momentum page
3. **Expected:** Chart renders with all empty cells (muted fills). No errors. Page remains functional.

### Companies with zero or missing momentum multiplier

1. Check that companies with missing Momentum Multiplier data still appear in the heatmap
2. **Expected:** Default fallback of 1.0 is used (not 0), so these companies still contribute to composite scores without zeroing out the calculation.

## Failure Signals

- Page shows perpetual loading skeleton (data fetch failure)
- No colored cells render (D3 layout computation failed, possibly zero-dimension container)
- Tooltip shows NaN or undefined values (composite score formula division error)
- Console errors about null style values (K004 violation — D3 .style() null on HTML)
- Sidebar entry missing or links to wrong URL

## Not Proven By This UAT

- Composite score formula correctness against SME expectations (weights are engineering estimates)
- Performance with 1000+ companies (current dataset is ~500)
- momentumCap field usage (loaded but not visualized yet)
- PDF export of this chart via Custom Report Builder (separate feature)

## Notes for Tester

- The YlOrRd palette makes low-momentum cells appear yellow and high-momentum cells appear deep red. If all cells look the same color, the score normalization may be off.
- Composite score is capped 0–1. If tooltip shows scores > 1.0, the normalization formula has a bug.
- The momentum multiplier range in the CSV is 1.0–2.73. Division by 2.73 normalizes this component. If new data exceeds 2.73, scores could exceed 1.0.
