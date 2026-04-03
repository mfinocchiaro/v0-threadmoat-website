---
id: S04
parent: M006
milestone: M006
provides:
  - Admin-only IP Dependency Analysis view at /dashboard/ip-dependency.
  - Dual-mode IPDependencyChart component consumable from other dashboard contexts if needed.
  - Extended Company data model with IP-related fields used by this and future IP-centric analytics.
requires:
  - slice: S01
    provides: Momentum and independence analytics patterns used as a reference for the IP view's bucketing and theming.
  - slice: S03
    provides: Shortlist-aware chart patterns (amber highlighting, star markers) reused in tooltips and cell styling.
affects:
  - M006 analytics completeness (all four planned views now implemented).
key_files:
  - lib/company-data.ts
  - lib/load-companies-server.ts
  - components/charts/ip-dependency-chart.tsx
  - app/dashboard/ip-dependency/page.tsx
  - components/dashboard/sidebar.tsx
  - lib/widget-registry.ts
key_decisions:
  - Whitelist-based graphics kernel cleaning — only values containing known kernel names pass through.
  - Reused the tech independence heatmap shell (layout, gating, and legend pattern) for the IP dependency view to keep dashboard visualizations consistent.
  - Chose string-based vendor detection from ecosystemDependencies entries with an Independent bucket instead of introducing a normalized vendor field.
  - Registered IP Dependency as an admin-only widget and sidebar item to align with other advanced analytics views and keep the visualization scoped to admin users.
patterns_established:
  - Reusing a shared D3 heatmap shell for new analytics views (layout, legend, Y-axis selector, dual-mode toggle) to keep UX consistent and implementation incremental.
  - Extending the Company interface and CSV loader with new domain-specific fields while keeping a single primary Company type consumed by all charts.
  - Shortlist-aware chart behavior using an optional shortlistedIds prop and K004-compliant D3 style handling on HTML elements.
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M006/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M006/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-03T08:46:25.534Z
blocker_discovered: false
---

# S04: IP Dependency Analysis

**Delivered an admin-only IP Dependency Analysis view with dual-mode heatmap and enriched IP-related company fields wired into the existing dashboard shell.**

## What Happened

Slice S04 completed the IP Dependency Analytics pillar of M006 by extending the core company data model with IP-centric attributes and surfacing that data through a dual-mode heatmap exposed at /dashboard/ip-dependency.

On the data side, the slice updated the Company interface and CSV loader to add three new fields: ecosystemCompatibility (free-text integration notes), graphicsKernel (normalized kernel identifier), and modelingParadigms (list of modeling standards/protocols). A dedicated cleanGraphicsKernel helper applies a whitelist of known kernels (Proprietary, Parasolid, OpenCascade, OpenUSD, Rhino, WebGL, ACIS, CGAL) and drops misclassified construction-industry strings. These changes are fully type-checked and validated by manual spot checks against the CSV.

On the visualization side, S04 implemented IPDependencyChart by reusing the existing tech-independence D3 heatmap shell. The chart offers two view modes: a Risk Tier heatmap that buckets companies into inverse IP risk tiers using techIndependenceScore and colors cells by average dependency count, and a Vendor Dependency Matrix that maps companies into Dassault/Siemens/Autodesk/PTC/Independent columns using ecosystemDependencies. Both modes share a configurable Y-axis (deployment model, investment thesis, workflow segment), a legend tied to the active color scale, and rich tooltips that surface ecosystemCompatibility, graphicsKernel, and modelingParadigms for small cells.

Finally, the slice wired the visualization into the admin dashboard experience: a new /dashboard/ip-dependency route built on VizPageShell and useThesisGatedData, an admin sidebar entry using the Shield icon, and an ip-dependency entry in ADMIN_WIDGETS so the view is available as an admin-only widget. Verification consists of npm run build plus manual navigation, mode switching, tooltip inspection, and shortlist highlighting checks on the live page.


## Verification

- npm run build
- Manual navigation to /dashboard/ip-dependency as an admin user
- Manual switch between Risk Tier and Vendor Matrix modes, verifying axes, legends, and tooltips
- Manual shortlist highlighting check (amber borders and star markers in tooltips)
- Confirmed admin sidebar entry and widget registry wiring for ip-dependency

## Requirements Advanced

- DATA-01 — Uses the corrected CSV pipeline to surface additional IP-related columns through the dashboard, demonstrating that the refreshed dataset continues to support new analytics views without schema changes.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T02 attempted to run npm test even though the project has no test script defined; verification settled on npm run build plus manual UAT as planned. No other deviations from the slice plan.

## Known Limitations

- No automated test coverage for IPDependencyChart aggregation logic or admin wiring; regressions will be caught by build and manual UAT only.
- Vendor detection is string-based on ecosystemDependencies and may need refinement if naming patterns or data model change.
- The view assumes techIndependenceScore is present and reasonably distributed; extreme changes to that metric may require retuning the risk tier thresholds.

## Follow-ups

- Add Jest/Vitest tests for IPDependencyChart bucketing and vendor mapping logic.
- Add tests around ADMIN_WIDGETS and ADMIN_ITEMS to catch wiring regressions when adding new admin views.
- Revisit vendor detection if the data model introduces a normalized vendor field or if CSV naming conventions shift.
- Consider adding light monitoring or smoke tests for key analytics views, including /dashboard/ip-dependency.

## Files Created/Modified

- `lib/company-data.ts` — Extended Company interface with ecosystemCompatibility, graphicsKernel, and modelingParadigms fields for IP analytics.
- `lib/load-companies-server.ts` — Mapped new CSV columns into the Company shape and introduced whitelist-based cleanGraphicsKernel helper.
- `components/charts/ip-dependency-chart.tsx` — Implemented dual-mode IPDependencyChart with risk tier and vendor matrix modes, tooltips, and shortlist highlighting.
- `app/dashboard/ip-dependency/page.tsx` — Created IP Dependency Analysis dashboard page wired to thesis-gated data and IPDependencyChart.
- `components/dashboard/sidebar.tsx` — Added IP Dependency admin sidebar entry and included route in ADMIN_VIZ_HREFS.
- `lib/widget-registry.ts` — Registered ip-dependency widget in ADMIN_WIDGETS for admin use.
