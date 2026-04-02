# S01: Theme-aware colors for D3 SVG charts (batch 1: 13 charts) — UAT

**Milestone:** M007
**Written:** 2026-04-02T22:41:25.592Z

# S01: Theme-aware colors for D3 SVG charts (batch 1: 13 charts) — UAT

**Milestone:** M007
**Written:** 2026-04-02

## UAT Type

- UAT mode: human-experience
- Why this mode is sufficient: Theme rendering must be visually confirmed in browser — automated tests can verify build passes but not visual legibility

## Preconditions

- Dev server running (`npm run dev`)
- Browser open to dashboard at localhost:3000/dashboard
- Both light and dark theme modes available (theme toggle in settings or system preference)

## Smoke Test

Toggle between light and dark theme. Navigate to any chart page (e.g., /dashboard/box-plot). Axis labels, tick marks, and tooltips should be legible on both themes — no white-on-white or dark-on-dark text.

## Test Cases

### 1. Box Plot chart theme switching

1. Navigate to /dashboard/box-plot
2. Set theme to dark mode
3. Observe axis labels, tick values, and grid lines
4. Hover over a box to trigger tooltip
5. Switch to light mode
6. Repeat observations
7. **Expected:** Axis text readable on both themes. Tooltip has appropriate background/text contrast. No hardcoded white or dark text visible on wrong background.

### 2. Correlation Matrix readability

1. Navigate to /dashboard/correlation
2. In dark mode, check row/column labels along axes
3. Hover over a cell to see tooltip with correlation value
4. Switch to light mode, repeat
5. **Expected:** Matrix labels legible. Tooltip background contrasts with page. Cell colors (data-semantic) remain the same across themes.

### 3. Distribution chart axes

1. Navigate to /dashboard/distribution
2. Check X and Y axis labels and tick marks in both themes
3. **Expected:** All axis text adapts to theme. Histogram bars retain their data colors.

### 4. Financial Heatmap table borders

1. Navigate to /dashboard/financial-heatmap
2. In dark mode, check table borders and "no data" cells
3. Switch to light mode
4. **Expected:** Table borders visible on both themes. "No data" cells use muted background that contrasts appropriately.

### 5. Map chart geography labels

1. Navigate to /dashboard/map
2. In both themes, check country/region labels and tooltip
3. **Expected:** Geographic labels readable. Tooltip has proper contrast. Map features have visible borders.

### 6. Parallel Coordinates axes and lines

1. Navigate to /dashboard/parallel
2. Check axis labels and grid lines in both themes
3. Hover over a line to trigger tooltip
4. **Expected:** All parallel axes and their labels are legible. Lines have visible contrast against background.

### 7. Slope Chart labels

1. Navigate to /dashboard/slope
2. Check company labels on left and right axes in both themes
3. **Expected:** Labels readable on both themes. Connecting lines visible.

### 8. SPLOM histogram fill

1. Navigate to /dashboard/splom
2. Check diagonal histograms in both themes
3. **Expected:** Histogram bars use primary color (adapts to theme), not hardcoded blue.

## Edge Cases

### Rapid theme toggling

1. Navigate to /dashboard/spiral
2. Toggle theme 5 times rapidly
3. **Expected:** Chart re-renders correctly each time without stale colors or visual glitches.

### First load on light theme

1. Clear localStorage / set system to light mode
2. Navigate to /dashboard/sankey
3. **Expected:** Chart renders with light-appropriate colors on first paint — no flash of dark theme colors.

## Failure Signals

- White or very light text on white/light background
- Dark text on dark background
- Tooltip backgrounds that blend into the page
- Axis labels disappearing on theme switch
- Grid lines invisible on one theme
- Data visualization colors (category palettes) changing between themes (they should NOT change)

## Not Proven By This UAT

- Batch 2 charts (S02) — remaining 13 charts not covered here
- Print/PDF rendering of theme-aware charts
- Accessibility contrast ratios meeting WCAG AA standards (visual check only, no computed ratio verification)
- Performance impact of getComputedStyle calls

## Notes for Tester

- CSS var fallback hex values remain in code as safety nets — these are intentional and only activate if CSS custom properties are missing.
- Data-semantic colors (category palettes in landscape, spiral-timeline) should NOT change between themes — they are intentionally preserved.
- The landscape chart was already theme-aware before this slice, so it should look unchanged.
