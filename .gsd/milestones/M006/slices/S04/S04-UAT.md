# S04: IP Dependency Analysis — UAT

**Milestone:** M006
**Written:** 2026-04-03T08:46:25.534Z

# S04 UAT — IP Dependency Analysis

## Preconditions

- Application is built and running in a production-like environment.
- Database and CSV data are loaded as in production; company records include the
  Ecosystem SW/Platform Compatibility, Graphics Kernel, and Modeling Paradigms & Protocols
  columns.
- Test user account exists with admin privileges (so the admin sidebar and admin-only
  widgets are visible).
- Browser with JavaScript enabled; viewport width >= 1280px recommended for chart layout.

## Test Case 1 — Company data model fields are present and populated

1. Log in as an admin user.
2. Open the browser developer console and run a fetch against `/api/companies`.
3. Inspect a handful of company objects in the JSON response.

Expected:
- Each company object includes:
  - `ecosystemCompatibility` as a string field.
  - `graphicsKernel` as a string field (may be empty string when no valid kernel exists).
  - `modelingParadigms` as an array of strings.
- For rows with known kernel data in the CSV, `graphicsKernel` contains one of the
  whitelisted values (Proprietary, Parasolid, OpenCascade, OpenUSD, Rhino, WebGL, ACIS,
  CGAL), case-normalized.
- For rows where the CSV column contains construction-industry phrases (e.g., "Residential
  Construction, Homebuilding"), `graphicsKernel` is an empty string.

Edge Cases:
- Companies with missing or N/A values in Ecosystem SW/Platform Compatibility should have
  `ecosystemCompatibility === ''` rather than a literal "N/A" or null.
- Companies with empty Modeling Paradigms & Protocols should have an empty
  `modelingParadigms` array.

## Test Case 2 — Route and page shell render

1. While logged in as an admin, navigate to `/dashboard/ip-dependency`.

Expected:
- Page renders without client or server errors.
- The dashboard frame (sidebar, header) appears as on other admin analytics pages.
- Main content shows an `IP Dependency Analysis` heading and a paragraph describing IP
  ownership and technology dependencies.
- While data is loading, a tall Skeleton placeholder (approx 600px height) is visible.
- After data loads, the Skeleton disappears and the IPDependencyChart is visible.

Edge Cases:
- If data fails to load, the page should not hard-crash; a generic error or empty state is
  acceptable.

## Test Case 3 — Risk Tier mode rendering and bucketing

1. On `/dashboard/ip-dependency`, ensure the view mode toggle is set to the default
   (Risk Tier) mode.
2. Confirm that the X-axis labels correspond to IP risk tiers:
   - Very High Risk
   - High Risk
   - Medium Risk
   - Low Risk
   - Very Low Risk
3. Confirm that the Y-axis selector is visible with options for deployment model,
   investment theses, and workflow segment.
4. Hover over several non-empty cells.

Expected:
- Cells are positioned in a regular grid; each cell shows an integer startup count.
- The color scale runs from lighter to darker orange-red (OrRd) corresponding to average
  dependency count (ecosystemDependencies.length) within each cell.
- Tooltips on hover display:
  - The active risk tier (X-axis) and Y-axis group label.
  - Startup count in the cell.
  - A numeric metric for average dependency count.
- For cells with eight or fewer companies, the tooltip lists company names with:
  - Truncated ecosystemCompatibility text (no more than ~80 characters per company).
  - graphicsKernel when non-empty.
  - Up to three modelingParadigms entries per company.

Edge Cases:
- Empty cells should show no tooltip or a tooltip indicating zero companies.
- Changing the Y-axis selector should recompute groupings without errors and update labels
  and cell positions accordingly.

## Test Case 4 — Vendor Dependency Matrix mode

1. On `/dashboard/ip-dependency`, toggle the view mode to Vendor Matrix.
2. Inspect the X-axis labels.

Expected:
- X-axis shows vendor columns: Dassault, Siemens, Autodesk, PTC, Independent.
- The color scale changes to a Blues palette.
- Each cell displays startup counts; darker cells correspond to more companies in that
  vendor/Y-axis group.
- Companies with no ecosystemDependencies appear only in the Independent column; there is
  no bleed into named vendor columns.

Edge Cases:
- Spot-check known companies whose ecosystemDependencies mention specific vendors
  (e.g., Dassault or Autodesk) and confirm they appear in the corresponding columns.
- Cells with a large number of companies still render readable counts and maintain
  layout (no overlap or truncation of axes).

## Test Case 5 — Shortlist-aware highlighting

1. On any dashboard page that allows shortlisting (e.g., Market Momentum or Customer
   Profile), shortlist 3–5 companies.
2. Navigate (or return) to `/dashboard/ip-dependency`.
3. Ensure that the thesis and filters used in useThesisGatedData make those companies
   visible in the current view.

Expected:
- One or more heatmap cells in the IPDependencyChart show an amber (#f59e0b) border or
  stroke, indicating they contain at least one shortlisted company.
- Hovering a highlighted cell opens a tooltip where shortlisted companies are marked with a
  gold star (★) prefix.
- Removing a company from the shortlist and revisiting the page (or triggering a refresh)
  removes the highlight and star for that company.

Edge Cases:
- No shortlisted companies should result in no amber borders and no star markers.
- Shortlist highlighting should not cause layout shifts or type errors (e.g., D3 style
  clearing must use '' rather than null on HTML elements).

## Test Case 6 — Admin sidebar & widget registry wiring

1. While logged in as an admin, inspect the left sidebar.
2. Locate the Admin analytics section.

Expected:
- An entry labeled "IP Dependency" appears with the Shield icon.
- Clicking the IP Dependency entry navigates to `/dashboard/ip-dependency`.

3. (Optional) Open the admin widget configuration UI if present.

Expected:
- An "IP Dependency Analysis" widget is available in the admin widget selector, matching
  the `ip-dependency` id in the registry.

Edge Cases:
- Non-admin users should not see the IP Dependency entry in the sidebar and should not be
  able to access `/dashboard/ip-dependency` if route protections are enforced elsewhere.

## Test Case 7 — Build and type safety regression check

1. From the project root, run:

   ```bash
   npm run build
   ```

Expected:
- Build completes successfully with no TypeScript errors related to:
  - Company interface fields (`ecosystemCompatibility`, `graphicsKernel`, `modelingParadigms`).
  - IPDependencyChart props and usage in `/dashboard/ip-dependency/page.tsx`.
  - Sidebar or widget registry references to `ip-dependency`.

Edge Cases:
- If additional data or visualization changes are made later, rerunning this test case
  should still succeed without introducing new type errors.

