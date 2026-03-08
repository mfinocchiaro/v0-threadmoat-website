/**
 * Widget registry — defines all available dashboard widgets,
 * their default visibility per scenario, and admin-only gating.
 */

export interface WidgetDef {
  id: string;
  label: string;
  /** Which dashboard scenarios this widget is available on. Empty = all. */
  scenarios: string[];
  /** Admin-only widget — hidden from regular users */
  adminOnly: boolean;
}

// ─── Standard widgets (available to all users) ────────────────────
export const STANDARD_WIDGETS: WidgetDef[] = [
  { id: "network",        label: "Ecosystem Network",        scenarios: [],                                                          adminOnly: false },
  { id: "landscape",      label: "Competitive Landscape",    scenarios: ["startup_founder"],                                         adminOnly: false },
  { id: "periodic-table", label: "Periodic Table",           scenarios: ["startup_founder", "vc_investor", "oem_enterprise", "isv_platform"], adminOnly: false },
  { id: "quadrant",       label: "Competitive Quadrant",     scenarios: ["startup_founder", "vc_investor", "oem_enterprise", "isv_platform"], adminOnly: false },
  { id: "bar",            label: "Top Rankings",             scenarios: ["startup_founder"],                                         adminOnly: false },
  { id: "map",            label: "Global Deal Flow",         scenarios: ["vc_investor"],                                             adminOnly: false },
  { id: "bubble",         label: "Funding Distribution",     scenarios: ["vc_investor"],                                             adminOnly: false },
  { id: "sunburst",       label: "Market Breakdown",         scenarios: ["oem_enterprise", "isv_platform"],                          adminOnly: false },
];

// ─── Advanced analytics (admin-only) ──────────────────────────────
export const ADMIN_WIDGETS: WidgetDef[] = [
  { id: "report-generator",    label: "Report Generator",       scenarios: [], adminOnly: true },
  { id: "financial-heatmap",   label: "Financial Heatmap",      scenarios: [], adminOnly: true },
  { id: "correlation-matrix",  label: "Correlation Matrix",     scenarios: [], adminOnly: true },
  { id: "investor-stats",      label: "Investor Statistics",    scenarios: [], adminOnly: true },
  { id: "investor-views",      label: "Investor Views",         scenarios: [], adminOnly: true },
  { id: "investor-explorer",   label: "Investor Explorer",      scenarios: [], adminOnly: true },
  { id: "parallel-coords",     label: "Parallel Coordinates",   scenarios: [], adminOnly: true },
  { id: "spiral-timeline",     label: "Spiral Timeline",        scenarios: [], adminOnly: true },
  { id: "slope-chart",         label: "Slope Chart",            scenarios: [], adminOnly: true },
  { id: "box-plot",            label: "Box Plot",               scenarios: [], adminOnly: true },
  { id: "distribution",        label: "Distribution Analysis",  scenarios: [], adminOnly: true },
  { id: "heatmap",             label: "Heatmap",                scenarios: [], adminOnly: true },
  { id: "marimekko",           label: "Marimekko Chart",        scenarios: [], adminOnly: true },
  { id: "wordcloud",           label: "Word Cloud",             scenarios: [], adminOnly: true },
  { id: "chord",               label: "Chord Diagram",          scenarios: [], adminOnly: true },
  { id: "splom",               label: "SPLOM",                  scenarios: [], adminOnly: true },
  { id: "treemap",             label: "Treemap",                scenarios: [], adminOnly: true },
];

export const ALL_WIDGETS = [...STANDARD_WIDGETS, ...ADMIN_WIDGETS];

/** Get widgets available for a given scenario + admin status */
export function getAvailableWidgets(scenario: string, isAdmin: boolean): WidgetDef[] {
  return ALL_WIDGETS.filter(w => {
    if (w.adminOnly && !isAdmin) return false;
    if (w.scenarios.length === 0) return true; // available on all
    return w.scenarios.includes(scenario);
  });
}

/** Default enabled widget IDs for each scenario */
export const DEFAULT_LAYOUT: Record<string, string[]> = {
  startup_founder: ["network", "landscape", "periodic-table", "quadrant", "bar"],
  vc_investor:     ["network", "map", "bubble", "quadrant", "periodic-table"],
  oem_enterprise:  ["network", "sunburst", "quadrant", "periodic-table"],
  isv_platform:    ["network", "quadrant", "sunburst", "periodic-table"],
};
