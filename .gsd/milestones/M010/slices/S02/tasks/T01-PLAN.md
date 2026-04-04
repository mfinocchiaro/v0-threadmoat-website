---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T01: Extract data-dependent dashboard into async server component with Suspense boundary

1. Extract the HomepageDashboard rendering + data loading into a separate async server component (e.g., HomepageDashboardSection) that does the loadCompaniesFromCSV() call internally.

2. In the main page.tsx, wrap HomepageDashboardSection in <Suspense fallback={<DashboardSkeleton />}>. The hero, thesis, features sections render immediately as static HTML. The dashboard section streams in when the data is ready.

3. The DashboardSkeleton should show the KPI cards as pulse skeletons and the chart areas as large skeleton blocks matching the existing layout.

4. HomepageDashboard itself remains a client component — it receives data as props. The new server wrapper handles the async data loading.

## Inputs

- `app/[locale]/page.tsx`
- `components/homepage/homepage-dashboard.tsx`

## Expected Output

- `app/[locale]/page.tsx with Suspense boundary`
- `components/homepage/homepage-dashboard-section.tsx (async server wrapper)`

## Verification

npm run build passes. Homepage hero renders before dashboard data loads.
