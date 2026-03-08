/**
 * Distributed rate limiter backed by Upstash Redis.
 *
 * Requires env vars: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * Falls back to an in-memory map when those vars are absent (local dev only).
 *
 * Public API is unchanged: rateLimit(key, limit, windowMs)
 */

// ─── Upstash path ────────────────────────────────────────────────────────────

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Cache Ratelimit instances keyed by "limit:windowMs" so we don't recreate
// them on every call (Redis connections are reused via the SDK's own cache).
const limiterCache = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  if (limiterCache.has(cacheKey)) return limiterCache.get(cacheKey)!

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: 'tm:rl',
  })

  limiterCache.set(cacheKey, limiter)
  return limiter
}

// ─── In-memory fallback (local dev only) ─────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memStore = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function memCleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of memStore) {
    if (now > entry.resetAt) memStore.delete(key)
  }
}

function memRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  memCleanup()
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  return { allowed: true }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether a request from `key` (typically IP or email) should be allowed.
 *
 * @param key       Unique identifier (IP address, email, etc.)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number }> {
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN

  if (!hasUpstash) {
    // Local dev: synchronous in-memory fallback
    return memRateLimit(key, limit, windowMs)
  }

  try {
    const limiter = getUpstashLimiter(limit, windowMs)
    const { success, reset } = await limiter.limit(key)
    if (success) return { allowed: true }
    return { allowed: false, retryAfterMs: reset - Date.now() }
  } catch (err) {
    // If Redis is unreachable, fail open (don't block legitimate users)
    console.error('[rate-limit] Upstash error, failing open:', err)
    return { allowed: true }
  }
}
