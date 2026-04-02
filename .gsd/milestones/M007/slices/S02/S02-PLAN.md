# S02: Theme-aware colors for remaining charts (batch 2: 13 charts incl. 3D)

**Goal:** Apply theme-aware colors to remaining 13 charts including 4 three.js/WebGL and miscellaneous D3 charts
**Demo:** After this: All remaining charts including 3D/WebGL have legible text on both themes

## Tasks
- [x] **T01: Converted structural UI colors in 9 D3/SVG chart files from hardcoded hex to CSS custom properties for theme-aware rendering** — Fix 9 remaining D3/SVG charts that don't need special 3D handling.

Files: chord-chart.tsx (2), customer-network.tsx (5), investor-network.tsx (6), investor-stats-chart.tsx (9), network-graph.tsx (7), periodic-table.tsx (1), timeline-chart.tsx (2), treemap-chart.tsx (4), wordcloud-chart.tsx (3)

Same getPropertyValue pattern. For files with only 1-2 hardcoded colors, the fix is minimal.
  - Estimate: 25min
  - Files: components/charts/chord-chart.tsx, components/charts/customer-network.tsx, components/charts/investor-network.tsx, components/charts/investor-stats-chart.tsx, components/charts/network-graph.tsx, components/charts/periodic-table.tsx, components/charts/timeline-chart.tsx, components/charts/treemap-chart.tsx, components/charts/wordcloud-chart.tsx
  - Verify: npm run build passes. grep audit clean for all 9 files.
- [ ] **T02: Fix theme colors in 4 three.js/WebGL charts** — Fix 4 three.js/WebGL chart components. These use react-three-fiber or raw three.js where CSS vars aren't directly accessible from the WebGL context.

Approach: Read CSS vars via getComputedStyle on a DOM ref, then pass the resolved color strings to three.js materials/lights.

Files: customer-network-3d.tsx (2), globe-chart.tsx (2), investor-network-3d.tsx (3), network-graph-3d.tsx (6)

If the hardcoded colors are used in three.js Color() constructors, resolve the CSS var first via JS and pass the hex result.
  - Estimate: 20min
  - Files: components/charts/customer-network-3d.tsx, components/charts/globe-chart.tsx, components/charts/investor-network-3d.tsx, components/charts/network-graph-3d.tsx
  - Verify: npm run build passes. grep audit shows reduced hardcoded dark-theme colors in 3D files.
