/**
 * Simple in-memory rate limiter.
 *
 * On Vercel serverless each cold-start gets a fresh Map, so this catches
 * rapid-fire bot attacks within a single instance lifetime.  For full
 * distributed rate-limiting add Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically evict expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Check whether a request from `key` (typically IP) should be allowed.
 *
 * @param key       Unique identifier (IP address, email, etc.)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 * @returns         `{ allowed: true }` or `{ allowed: false, retryAfterMs }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  return { allowed: true }
}
