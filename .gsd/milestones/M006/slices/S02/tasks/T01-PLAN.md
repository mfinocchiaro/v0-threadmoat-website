---
estimated_steps: 26
estimated_files: 1
skills_used: []
---

# T01: Add customerCount value mode to IndustryPenetrationChart

Extend the existing Industry Penetration heatmap chart with a fourth value mode that counts known customers per cell using `parseKnownCustomers()` from `lib/customer-logos.ts`.

## Steps

1. Import `parseKnownCustomers` from `@/lib/customer-logos` at the top of the chart file.
2. Add `"customerCount"` to the `ValueMode` type union: `type ValueMode = "count" | "avgScore" | "avgFunding" | "customerCount"`
3. Add the new entry to the `VALUE_MODES` array: `{ value: "customerCount", label: "Customer Count" }`
4. Extend the `CellData` interface with `customerCount: number`.
5. In the `useMemo` cell-building loop, parse each company's `knownCustomers` string via `parseKnownCustomers(company.knownCustomers)` and accumulate the `.length` into the cell's `customerCount` field. Initialize it to `0` when creating a new cell, and add `parseKnownCustomers(company.knownCustomers).length` for each company added to that cell.
6. Update the `valueAccessor` function to handle the new mode: `if (valueMode === "customerCount") return cell.customerCount`
7. Update the cell text display (the `displayVal` variable in the D3 rendering) to show `String(cell.customerCount)` when `valueMode === "customerCount"`.
8. Update the tooltip HTML to include a "Known Customers" line showing `cell.customerCount` (always, for all modes — it's useful context).
9. Update the legend label logic: when `valueMode === "customerCount"`, use `"Known Customers"` as the label text.
10. Verify the color scale works correctly — `valueAccessor` already feeds into `maxVal` and `colorScale`, so no additional changes needed for color intensity.

## Must-Haves

- [ ] `ValueMode` type includes `"customerCount"`
- [ ] `VALUE_MODES` array includes the Customer Count option
- [ ] `CellData` interface has `customerCount: number`
- [ ] Cell-building `useMemo` accumulates customer count via `parseKnownCustomers`
- [ ] `valueAccessor` returns `cell.customerCount` for the new mode
- [ ] Cell text displays customer count when that mode is selected
- [ ] Tooltip shows customer count
- [ ] Legend label reads "Known Customers" for the new mode
- [ ] `npx next build` passes with zero errors

## Verification

- `npx next build` completes with exit code 0
- `grep -q 'customerCount' components/charts/industry-penetration-chart.tsx` confirms the new mode exists
- `grep -q 'parseKnownCustomers' components/charts/industry-penetration-chart.tsx` confirms the import is wired

## Inputs

- ``components/charts/industry-penetration-chart.tsx` — existing chart component to extend`
- ``lib/customer-logos.ts` — read-only dependency providing `parseKnownCustomers()` function`
- ``lib/company-data.ts` — read-only dependency defining the `Company` interface with `knownCustomers: string` field`

## Expected Output

- ``components/charts/industry-penetration-chart.tsx` — extended with `customerCount` value mode, `parseKnownCustomers` import, updated CellData/valueAccessor/tooltip/legend`

## Verification

npx next build && grep -q 'customerCount' components/charts/industry-penetration-chart.tsx && grep -q 'parseKnownCustomers' components/charts/industry-penetration-chart.tsx
