# S03: Target Customer Profile Heatmap

**Goal:** Deliver a Target Customer Profile heatmap that profiles each startup's typical target customer across four selectable dimensions (buyer persona, company size, geography, deployment model) on the X axis, cross-referenced by configurable Y-axis groupings (industry, investment thesis, workflow segment, manufacturing type), with four value modes (count, avg score, avg funding, customer count).
**Demo:** After this: Heatmap profiling the typical target customer for each startup across size, industry, geography, and supply chain role.

## Tasks
- [x] **T01: Built TargetCustomerProfileChart with 4 X-axis customer dimensions, 4 Y-axis groupings, 4 value modes, geo-region collapsing, and shortlist highlighting** — ## Description

Create the main chart component by cloning from `industry-penetration-chart.tsx` and extending it with:

1. An X-axis selector dropdown for customer profile dimensions: Buyer Persona, Company Size, Geography (collapsed to ~8 regions), Deployment Model
2. Keep the existing Y-axis selector (Industry, Investment Thesis, Workflow Segment, Manufacturing Type)
3. Keep the existing value mode selector (count, avg score, avg funding, customer count)
4. Add a `getGeoRegion()` helper to collapse 43 country values into ~8 geographic regions
5. Add `getXValues()` function that extracts values for the selected X-axis dimension from a Company

## Key Constraints from Knowledge Base

- **K004**: D3 `.style()` does not accept `null` on HTML selections — use `''` instead
- **K005**: Use optional `shortlistedIds?: Set<string>` prop pattern for shortlist highlighting
- Country field contains flag emojis (e.g., "United States 🇺🇸") — strip non-word chars before matching. Handle both "USA" and "United States"
- `deploymentModel` is already `string[]` — use directly
- `buyerPersona` is a string — use `[company.buyerPersona || 'Unknown']`
- `startupSizeCategory` is a string — use `[company.startupSizeCategory || 'Unknown']`
- `manufacturingType` is a string needing Python list parsing: `val.replace(/[\[\]']/g, '').split(',').map(s => s.trim())`

## Geographic Region Mapping

```typescript
function getGeoRegion(country: string): string {
  const c = country.replace(/[^\w\s]/g, '').trim().toLowerCase()
  if (c.includes('united states') || c.includes('usa') || c.includes('canada')) return 'North America'
  if (c.includes('germany') || c.includes('austria') || c.includes('switzerland')) return 'DACH'
  if (c.includes('united kingdom') || c.includes('ireland')) return 'UK & Ireland'
  if (c.includes('france') || c.includes('belgium') || c.includes('netherlands') || c.includes('luxembourg')) return 'Western Europe'
  if (c.includes('norway') || c.includes('sweden') || c.includes('finland') || c.includes('denmark') || c.includes('iceland')) return 'Nordics'
  if (c.includes('israel')) return 'Israel'
  if (c.includes('india') || c.includes('china') || c.includes('japan') || c.includes('korea') || c.includes('singapore') || c.includes('australia')) return 'Asia-Pacific'
  return 'Other'
}
```

## Steps

1. Create `components/charts/target-customer-profile-chart.tsx` by cloning `industry-penetration-chart.tsx`
2. Define `XAxisKey` type union: `'buyerPersona' | 'startupSizeCategory' | 'geoRegion' | 'deploymentModel'` with matching `X_AXES` label array
3. Keep existing `YAxisKey` type/options for row grouping (add `industriesServed` as a Y-axis option since the industry-penetration chart had industry as its fixed X axis — here it becomes a Y option)
4. Implement `getGeoRegion()` helper function
5. Implement `getXValues(company, xAxis)` function that returns string[] for the selected X dimension
6. Update `CellData` interface: rename `industry` field to `xGroup` (or keep generic naming)
7. Update the `useMemo` cell-building logic to iterate X values via `getXValues()` instead of hardcoded `industriesServed`
8. Add X-axis `<select>` dropdown in the controls bar alongside existing Y-axis and value mode dropdowns
9. Verify shortlist highlighting uses optional prop pattern (K005) and conditional styles use `''` not `null` (K004)
10. Verify tooltip shows X×Y label, all value stats, shortlisted names, and company list for small cells

## Must-Haves

- X-axis selector with 4 options (Buyer Persona, Company Size, Geography, Deployment Model)
- Y-axis selector with 4 options (Industries Served, Investment Thesis, Workflow Segment, Manufacturing Type)
- Value mode selector with 4 options (count, avg score, avg funding, customer count)
- Geographic region mapping collapsing 43 countries to ~8 regions
- Shortlist highlighting with amber border (K005 optional prop pattern)
- Theme-aware colors via CSS custom properties
- Tooltip with cell breakdown
- Hotspot insight bar
- Color legend
- Cell text suppressed for small cells (w > 20 && h > 16 guard)
  - Estimate: 1h30m
  - Files: components/charts/target-customer-profile-chart.tsx, components/charts/industry-penetration-chart.tsx
  - Verify: test -f components/charts/target-customer-profile-chart.tsx && grep -q 'buyerPersona' components/charts/target-customer-profile-chart.tsx && grep -q 'getGeoRegion' components/charts/target-customer-profile-chart.tsx && grep -q 'shortlistedIds' components/charts/target-customer-profile-chart.tsx
- [x] **T02: Wired customer-profile page route and sidebar navigation, build passes with zero errors** — ## Description

Create the Next.js page route for the customer profile heatmap and wire it into the dashboard sidebar navigation. Then verify the entire build passes.

## Steps

1. Create `app/dashboard/customer-profile/page.tsx` by cloning `app/dashboard/industry-penetration/page.tsx`
2. Update the import to `TargetCustomerProfileChart` from `@/components/charts/target-customer-profile-chart`
3. Update the page title to "Target Customer Profile" and description to explain the multi-dimensional customer profiling purpose
4. Add sidebar entry to `ADMIN_ITEMS` array in `components/dashboard/sidebar.tsx`: `{ href: '/dashboard/customer-profile', icon: UserCircle, label: 'Customer Profile' }` — place it after the existing Market Momentum entry
5. Add `'/dashboard/customer-profile'` to the `ADMIN_VIZ_HREFS` Set
6. Run `npx next build` and verify zero type errors across all pages

## Must-Haves

- Page route at `/dashboard/customer-profile` using VizPageShell + useThesisGatedData
- TargetCustomerProfileChart imported and rendered with filtered data and shortlistedIds
- Sidebar shows 'Customer Profile' in admin items
- ADMIN_VIZ_HREFS includes the new route
- `npx next build` passes with zero type errors
  - Estimate: 30m
  - Files: app/dashboard/customer-profile/page.tsx, components/dashboard/sidebar.tsx
  - Verify: npx next build 2>&1 | tail -5
