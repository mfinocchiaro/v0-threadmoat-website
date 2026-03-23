/**
 * ThreadMoat Access Tier System
 *
 * Tier 1 (Recon):       Free 30-day trial — 3 graphs (network, landscape-intro, map)
 * Tier 2 (Analyst):     $18,999/yr — 13 visual analytics graphs
 * Tier 3 (Strategist):  Custom contract — all graphs except admin (~28 total)
 * Advisory:             Custom pricing, dedicated analyst (contact-driven, no self-service)
 * Admin:                Unrestricted (via ADMIN_EMAILS env var)
 *
 * Product IDs in Neon:
 *   explorer_trial / coupon_trial  → Recon
 *   analyst_annual / friends_access / investor_annual  → Analyst
 *   strategist / strategist_annual  → Strategist
 */

export type AccessTier = 'explorer' | 'analyst' | 'strategist' | 'admin'

/** Utility pages — always accessible to any authenticated user */
export const UTILITY_PATHS = new Set([
  '/dashboard',
  '/dashboard/explore',
  '/dashboard/settings',
])

/** Tier 1: Recon — 3 graphs (free for everyone) */
export const EXPLORER_PATHS = new Set([
  '/dashboard/network',
  '/dashboard/landscape-intro',
  '/dashboard/map',
])

/** Tier 2: Analyst — 13 visual analytics graphs */
export const ANALYST_PATHS = new Set([
  '/dashboard/quadrant',          // Magic Quadrant positioning
  '/dashboard/bubbles',           // Bubble Chart (scatter plot)
  '/dashboard/landscape',         // Full Landscape (grouped tiles)
  '/dashboard/bar-chart',         // Top Rankings bar chart
  '/dashboard/treemap',           // Category Treemap
  '/dashboard/timeline',          // Founding Timeline
  '/dashboard/sunburst',          // Industry Sunburst
  '/dashboard/metros',            // Metro Area Analysis
  '/dashboard/radar',             // Radar Chart comparison
  '/dashboard/periodic-table',    // Periodic Table (company tiles)
])

/** Tier 3: Strategist — full platform access (unlocked on top of Analyst) */
export const STRATEGIST_ONLY_PATHS = new Set([
  '/dashboard/compare',           // Side-by-side company comparison
  '/dashboard/customers',         // Customer Network (2D/3D)
  '/dashboard/investor-network',  // Investor Network (2D/3D)
  '/dashboard/marimekko',         // Market concentration
  '/dashboard/spiral',            // Spiral Timeline
  '/dashboard/patterns',          // Investment × funding stage heatmap
  '/dashboard/sankey',            // Flow Diagram
  '/dashboard/chord',             // Chord Diagram
  '/dashboard/heatmap',           // Pattern Heatmap
  '/dashboard/parallel',          // Parallel Coordinates
  '/dashboard/box-plot',          // Box Plot distributions
  '/dashboard/distribution',      // Funding Distribution
  '/dashboard/wordcloud',         // Word Cloud
  '/dashboard/slope',             // Slope Chart
  '/dashboard/splom',             // Scatter Plot Matrix
])

/** Admin-only analytics — never shown to non-admin users */
export const ADMIN_PATHS = new Set([
  '/dashboard/investor-stats',
  '/dashboard/financial-heatmap',
  '/dashboard/correlation',
  '/dashboard/reports',
  '/dashboard/investor-views',
  '/dashboard/maturity-matrix',
  '/dashboard/swot',
  '/dashboard/candlestick',
])

/** Check whether a path is accessible at the given tier */
export function isPathAllowed(pathname: string, tier: AccessTier): boolean {
  if (UTILITY_PATHS.has(pathname) || EXPLORER_PATHS.has(pathname)) return true

  if (tier === 'admin') return true

  if (tier === 'strategist') {
    return ANALYST_PATHS.has(pathname) || STRATEGIST_ONLY_PATHS.has(pathname)
  }

  if (tier === 'analyst') {
    return ANALYST_PATHS.has(pathname)
  }

  // Recon tier — only utility + explorer paths
  return false
}

/** Map a subscription product_id to an access tier */
export function getAccessTier(productId: string | null | undefined, isAdmin: boolean): AccessTier {
  if (isAdmin) return 'admin'

  switch (productId) {
    case 'strategist':
    case 'strategist_annual':
      return 'strategist'
    case 'analyst_annual':
    case 'investor_annual':
    case 'friends_access':
    case 'coupon_trial':
      return 'analyst'
    default:
      return 'explorer'
  }
}

/** Human-readable tier label for UI */
export function getTierLabel(tier: AccessTier): string {
  switch (tier) {
    case 'admin': return 'Admin'
    case 'strategist': return 'Strategist'
    case 'analyst': return 'Analyst'
    case 'explorer': return 'Recon'
  }
}

/** The minimum tier required to access a path */
export function getRequiredTier(pathname: string): AccessTier | null {
  if (UTILITY_PATHS.has(pathname) || EXPLORER_PATHS.has(pathname)) return 'explorer'
  if (ANALYST_PATHS.has(pathname)) return 'analyst'
  if (STRATEGIST_ONLY_PATHS.has(pathname)) return 'strategist'
  if (ADMIN_PATHS.has(pathname)) return 'admin'
  return null
}
