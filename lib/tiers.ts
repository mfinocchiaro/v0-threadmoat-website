/**
 * ThreadMoat Access Tier System
 *
 * Tier 1 (Explorer):   Free 30-day trial — 3 graphs (network, landscape-intro, map)
 * Tier 2 (Report):     $4,999 one-time — same 3 graphs + purchased report
 * Tier 3 (Investor):   $14,999/yr — 11 graphs + quarterly reports
 * Tier 4 (Red Keep):   Custom contract — all graphs except admin
 * Friends:             Same access as Tier 3, 1-year duration, no payment
 */

export type AccessTier = 'explorer' | 'investor' | 'red_keep' | 'admin'

/** Utility pages — always accessible to any authenticated user */
export const UTILITY_PATHS = new Set([
  '/dashboard',
  '/dashboard/explore',
  '/dashboard/settings',
])

/** Tier 1 + 2: Explorer — 3 graphs (free for everyone) */
export const EXPLORER_PATHS = new Set([
  '/dashboard/network',
  '/dashboard/landscape-intro',
  '/dashboard/map',
])

/** Tier 3: Investor / Friends — 11 graphs */
export const INVESTOR_PATHS = new Set([
  '/dashboard/quadrant',          // Magic Quadrant
  '/dashboard/bubbles',           // Bubble Chart
  '/dashboard/landscape',         // Full Landscape
  '/dashboard/bar-chart',         // Funding Bar Chart
  '/dashboard/treemap',           // Category Treemap
  '/dashboard/timeline',          // Funding Timeline
  '/dashboard/sunburst',          // Industry Sunburst
  '/dashboard/metros',            // Metro Area Analysis
  '/dashboard/customers',         // Customer Network
  '/dashboard/investor-network',  // Investor Network
  '/dashboard/radar',             // Radar Chart
])

/** Tier 4: Red Keep only — remaining graphs (unlocked on top of Investor) */
export const RED_KEEP_ONLY_PATHS = new Set([
  '/dashboard/periodic-table',
  '/dashboard/compare',
  '/dashboard/marimekko',
  '/dashboard/spiral',
  '/dashboard/patterns',
  '/dashboard/sankey',
  '/dashboard/chord',
  '/dashboard/heatmap',
  '/dashboard/parallel',
  '/dashboard/box-plot',
  '/dashboard/distribution',
  '/dashboard/wordcloud',
  '/dashboard/slope',
  '/dashboard/splom',
])

/** Admin-only analytics — never shown to non-admin users */
export const ADMIN_PATHS = new Set([
  '/dashboard/investor-stats',
  '/dashboard/financial-heatmap',
  '/dashboard/correlation',
  '/dashboard/reports',
  '/dashboard/investor-views',
  '/dashboard/maturity-matrix',
])

/** Check whether a path is accessible at the given tier */
export function isPathAllowed(pathname: string, tier: AccessTier): boolean {
  // Utility + Explorer paths open to everyone
  if (UTILITY_PATHS.has(pathname) || EXPLORER_PATHS.has(pathname)) return true

  if (tier === 'admin') return true

  if (tier === 'red_keep') {
    return INVESTOR_PATHS.has(pathname) || RED_KEEP_ONLY_PATHS.has(pathname)
  }

  if (tier === 'investor') {
    return INVESTOR_PATHS.has(pathname)
  }

  // Explorer tier — only utility + explorer paths
  return false
}

/** Map a subscription product_id to an access tier */
export function getAccessTier(productId: string | null | undefined, isAdmin: boolean): AccessTier {
  if (isAdmin) return 'admin'

  switch (productId) {
    case 'red_keep':
    case 'red_keep_annual':
      return 'red_keep'
    case 'investor_annual':
    case 'friends_access':
      return 'investor'
    default:
      return 'explorer'
  }
}

/** Human-readable tier label for UI */
export function getTierLabel(tier: AccessTier): string {
  switch (tier) {
    case 'admin': return 'Admin'
    case 'red_keep': return 'The Red Keep'
    case 'investor': return 'Investor'
    case 'explorer': return 'Explorer'
  }
}

/** The minimum tier required to access a path */
export function getRequiredTier(pathname: string): AccessTier | null {
  if (UTILITY_PATHS.has(pathname) || EXPLORER_PATHS.has(pathname)) return 'explorer'
  if (INVESTOR_PATHS.has(pathname)) return 'investor'
  if (RED_KEEP_ONLY_PATHS.has(pathname)) return 'red_keep'
  if (ADMIN_PATHS.has(pathname)) return 'admin'
  return null
}
