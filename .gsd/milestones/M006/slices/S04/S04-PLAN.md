# S04: IP Dependency Analysis

**Goal:** Add IP Dependency Analysis view showing IP ownership, technology dependencies, and third-party platform risk for each startup — with two view modes (Risk Tier Heatmap and Vendor Dependency Matrix), configurable Y-axis, and rich tooltips showing ecosystem compatibility, graphics kernel, and modeling paradigms.
**Demo:** After this: View showing IP ownership, technology dependencies, and third-party risk for each startup.

## Tasks
- [x] **T01: Added ecosystemCompatibility, graphicsKernel, and modelingParadigms fields to Company interface and CSV loader with whitelist-based kernel cleaning** — Add three new fields to the Company interface and load them from the main CSV in loadCompaniesFromCSV(). This unblocks the chart component.

## Steps

1. Open `lib/company-data.ts` and add three fields to the `Company` interface after the existing heatmap enrichment fields (after line ~108):
   - `ecosystemCompatibility: string` — free-text describing platform integrations
   - `graphicsKernel: string` — cleaned kernel identifier or empty string
   - `modelingParadigms: string[]` — parsed list of technology standards

2. Open `lib/load-companies-server.ts` and add the three new column mappings in the `return` block of `loadCompaniesFromCSV()`, in the main CSV section (not the enrichment section):
   - `ecosystemCompatibility: cleanField(row['Ecosystem SW/Platform Compatibility'])` — use existing `cleanField()` to strip N/A values
   - `graphicsKernel`: Load `row['Graphics Kernel']`, then apply a cleaning function. Create a helper `cleanGraphicsKernel(raw: string): string` that:
     a. Returns `''` for empty/N/A values
     b. Returns the cleaned value ONLY if it contains one of: 'Proprietary', 'Parasolid', 'OpenCascade', 'OpenUSD', 'Rhino', 'WebGL', 'ACIS', 'CGAL' (case-insensitive check)
     c. Returns `''` for all other values (these are misplaced construction industry data — ~25 rows have values like 'Residential Construction, Homebuilding')
   - `modelingParadigms: parsePythonList(row['Modeling Paradigms & Protocols'])` — use existing `parsePythonList()` helper

3. Verify the CSV column names match exactly: 'Ecosystem SW/Platform Compatibility' (column 16), 'Graphics Kernel' (column 19), 'Modeling Paradigms & Protocols' (column 160).

## Must-Haves

- [ ] `ecosystemCompatibility` field added to Company interface as `string`
- [ ] `graphicsKernel` field added to Company interface as `string`
- [ ] `modelingParadigms` field added to Company interface as `string[]`
- [ ] CSV loader maps all three columns correctly
- [ ] Graphics Kernel cleaning rejects construction industry values, keeps kernel identifiers
- [ ] `npm run build` passes with zero errors
  - Estimate: 20m
  - Files: lib/company-data.ts, lib/load-companies-server.ts
  - Verify: npm run build
- [x] **T02: Added dual-mode IP Dependency heatmap and dashboard page using thesis-gated data and shortlist-aware tooltips.** — Create the `IPDependencyChart` component following the established M006 heatmap pattern (copy structure from `tech-independence-chart.tsx`). The chart has two view modes controlled by a toggle, configurable Y-axis, and rich tooltips.

## Steps

1. Create `components/charts/ip-dependency-chart.tsx`. Start by copying the structural pattern from `components/charts/tech-independence-chart.tsx` — same imports, same Card wrapper, same SVG + tooltip refs, same Y-axis selector UI.

2. Define the component props:
   ```tsx
   interface IPDependencyChartProps {
     data: Company[]
     className?: string
     shortlistedIds?: Set<string>
   }
   ```

3. Add a `ViewMode` type: `'risk-tier' | 'vendor-matrix'` with state and a toggle button in the toolbar.

4. Define Y-axis options (same pattern as other M006 charts):
   ```tsx
   type YAxisKey = 'deploymentModel' | 'investmentTheses' | 'workflowSegment'
   ```
   With the same `Y_AXES` array and `getYValues()` function from `tech-independence-chart.tsx`.

5. **Risk Tier mode** (primary):
   - X axis: IP Risk Tier — bucket `techIndependenceScore` inversely into risk tiers:
     - 'Very High Risk' (score < 35), 'High Risk' (35–44), 'Medium Risk' (45–54), 'Low Risk' (55–64), 'Very Low Risk' (65+)
   - Cell color intensity: based on average dependency count (ecosystemDependencies.length) in the cell
   - Cell text: startup count
   - Use `d3.interpolateOrRd` (orange-red) color scale for risk theming

6. **Vendor Dependency Matrix mode**:
   - X axis: Major Ecosystem Vendor — 'Dassault', 'Siemens', 'Autodesk', 'PTC', 'Independent'
   - A company appears in a vendor column if `ecosystemDependencies` includes that vendor. Companies with empty ecosystemDependencies go in 'Independent'.
   - Cell color intensity: startup count
   - Use `d3.interpolateBlues` for vendor mode

7. **Tooltip** (both modes): Fixed-position div, toggled on mouseover. Show:
   - Cell coordinates (tier/vendor × Y group)
   - Startup count
   - Mode-specific metric (avg dependency count for risk tier, or count for vendor)
   - For cells with ≤ 8 companies: list company names with their `ecosystemCompatibility` text (truncated to 80 chars), `graphicsKernel` (if non-empty), and first 3 `modelingParadigms`
   - Shortlisted companies highlighted with ★ amber

8. **Shortlist highlighting**: Amber border (2.5px #f59e0b) on cells containing shortlisted companies. Use `shortlistedIds?.has(id)` guard (K005). Use `''` not `null` for clearing styles (K004).

9. **Layout**: Same margin/cellSize/legend pattern as tech-independence-chart. Legend gradient matches the active color scale. Bottom toolbar shows dimension counts.

## Must-Haves

- [ ] Risk Tier Heatmap mode renders with correct X-axis buckets (inverse of techIndependenceScore)
- [ ] Vendor Dependency Matrix mode renders with correct vendor columns
- [ ] View mode toggle switches between modes
- [ ] Y-axis selector works across all 3 options
- [ ] Tooltip shows ecosystem compatibility, graphics kernel, modeling paradigms
- [ ] Shortlist highlighting with amber border (K005 pattern)
- [ ] D3 .style() uses '' not null on HTML selections (K004)
- [ ] Component exports named `IPDependencyChart`
  - Estimate: 1h
  - Files: components/charts/ip-dependency-chart.tsx, components/charts/tech-independence-chart.tsx
  - Verify: npm run build
- [x] **T03: Exposed the IP Dependency Analysis chart at /dashboard/ip-dependency and wired it into the admin sidebar and widget registry.** — Create the page component and register the new view in the admin navigation. This completes the slice by making the chart accessible.

## Steps

1. Create `app/dashboard/ip-dependency/page.tsx` following the exact pattern of `app/dashboard/market-momentum/page.tsx`:
   - Import `VizPageShell`, `useThesisGatedData`, `IPDependencyChart`, `Skeleton`
   - Inner component uses `useThesisGatedData()` to get `filtered`, `isLoading`, `shortlistedIds`
   - Render heading 'IP Dependency Analysis' with description about IP ownership and technology dependencies
   - Loading state: `<Skeleton className="h-[600px] rounded-xl" />`
   - Data state: `<IPDependencyChart data={filtered} shortlistedIds={shortlistedIds} className="min-h-[500px]" />`
   - Wrap in `VizPageShell`

2. Open `components/dashboard/sidebar.tsx`:
   - Add entry to `ADMIN_ITEMS` array: `{ href: '/dashboard/ip-dependency', icon: Shield, label: 'IP Dependency' }` — Shield icon is already imported (used by tech-independence). If not, import it from lucide-react.
   - Add `'/dashboard/ip-dependency'` to the `ADMIN_VIZ_HREFS` Set

3. Open `lib/widget-registry.ts`:
   - Add to `ADMIN_WIDGETS` array: `{ id: 'ip-dependency', label: 'IP Dependency Analysis', scenarios: [], adminOnly: true }`

4. Verify with `npm run build` that the page compiles and all imports resolve.

## Must-Haves

- [ ] Page component at `app/dashboard/ip-dependency/page.tsx` renders IPDependencyChart
- [ ] Sidebar entry visible in admin items
- [ ] `ADMIN_VIZ_HREFS` includes the new route
- [ ] Widget registry includes ip-dependency
- [ ] `npm run build` passes
  - Estimate: 15m
  - Files: app/dashboard/ip-dependency/page.tsx, components/dashboard/sidebar.tsx, lib/widget-registry.ts
  - Verify: npm run build && grep -q 'ip-dependency' components/dashboard/sidebar.tsx && grep -q 'ip-dependency' lib/widget-registry.ts
