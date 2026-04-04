# S02: Defer CSV data loading — hero-first rendering

**Goal:** Split the homepage so the hero renders before loadCompaniesFromCSV completes, using React Suspense streaming
**Demo:** After this: Homepage hero section renders before loadCompaniesFromCSV completes. Company data streams in for the dashboard section.

## Tasks
- [x] **T01: Extracted data loading into async server component with Suspense boundary — hero streams before CSV parse completes** — 1. Extract the HomepageDashboard rendering + data loading into a separate async server component (e.g., HomepageDashboardSection) that does the loadCompaniesFromCSV() call internally.

2. In the main page.tsx, wrap HomepageDashboardSection in <Suspense fallback={<DashboardSkeleton />}>. The hero, thesis, features sections render immediately as static HTML. The dashboard section streams in when the data is ready.

3. The DashboardSkeleton should show the KPI cards as pulse skeletons and the chart areas as large skeleton blocks matching the existing layout.

4. HomepageDashboard itself remains a client component — it receives data as props. The new server wrapper handles the async data loading.
  - Estimate: 20min
  - Files: app/[locale]/page.tsx, components/homepage/homepage-dashboard-section.tsx
  - Verify: npm run build passes. Homepage hero renders before dashboard data loads.
