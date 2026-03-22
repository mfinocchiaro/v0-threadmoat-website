---
status: awaiting_human_verify
trigger: "ThreadMoat website redirecting to /en causing 404 on Vercel"
created: 2026-03-22T00:00:00Z
updated: 2026-03-22T00:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two compounding bugs in proxy.ts caused i18n routing failures
test: Verified with 11 curl tests against production build
expecting: All locale routes work correctly
next_action: Awaiting human verification on Vercel deployment

## Symptoms

expected: visiting threadmoat.com serves content at / without redirect
actual: visiting threadmoat.com redirected to /en which caused 404
errors: 404 Not Found on /en
reproduction: deploy to Vercel, visit threadmoat.com
started: after i18n commit 29f88e2

## Eliminated

- hypothesis: proxy.ts file naming issue (not middleware.ts)
  evidence: Next.js 16 renamed middleware.ts to proxy.ts; build output shows "Proxy (Middleware)"
  timestamp: 2026-03-22T00:01:00Z

- hypothesis: next-intl routing config misconfigured
  evidence: localePrefix 'as-needed' and defaultLocale 'en' correctly configured in routing.ts
  timestamp: 2026-03-22T00:02:00Z

- hypothesis: NextAuth new Response() drops rewrite headers
  evidence: Verified x-middleware-rewrite header IS preserved through new Response() constructor
  timestamp: 2026-03-22T00:10:00Z

## Evidence

- timestamp: 2026-03-22T00:01:00Z
  checked: file naming
  found: proxy.ts is correct for Next.js 16 (renamed from middleware.ts)
  implication: file naming is NOT the issue

- timestamp: 2026-03-22T00:02:00Z
  checked: routing.ts config
  found: localePrefix 'as-needed' is correctly configured, defaultLocale is 'en'
  implication: config looks correct

- timestamp: 2026-03-22T00:05:00Z
  checked: proxy.ts regex patterns
  found: isLocalePrefix and isPublicPage only handle fr|es|it|de — missing en AND pt
  implication: /en/* and /pt/* paths bypass intlMiddleware entirely

- timestamp: 2026-03-22T00:08:00Z
  checked: NextAuth auth() wrapper behavior (lib/index.js line 166)
  found: auth() wraps entire proxy, creates new Response() from callback return
  implication: intlMiddleware responses pass through NextAuth's Response wrapper on Vercel

- timestamp: 2026-03-22T00:12:00Z
  checked: next-intl resolveLocale.js locale detection
  found: With localeDetection:true (default), Accept-Language header determines locale for unprefixed paths
  implication: On Vercel, browser Accept-Language could trigger locale redirects

- timestamp: 2026-03-22T00:20:00Z
  checked: Full test suite after fix (11 tests)
  found: All routes work correctly — rewrites stay internal, locale prefix stripping works, auth protection preserved
  implication: Fix is working correctly

## Resolution

root_cause: |
  Two compounding bugs in proxy.ts:

  1. HARDCODED REGEX: isLocalePrefix and isPublicPage only matched fr|es|it|de,
     missing en and pt. This caused /en/* and /pt/* paths to bypass intlMiddleware,
     so next-intl couldn't properly handle locale prefix stripping or cookie setting.

  2. AUTH WRAPPER: The entire proxy was wrapped in auth(), meaning ALL responses
     (including intlMiddleware's NextResponse.rewrite()) passed through NextAuth's
     handleAuth function which creates a plain new Response() from the NextResponse.
     On Vercel's edge runtime, this can interfere with how rewrites are processed,
     potentially converting internal rewrites to visible redirects.

fix: |
  1. Changed regex to use ALL locales from routing config (dynamically built from
     routing.locales) instead of hardcoded subset
  2. Removed auth() wrapper from the entire proxy — intlMiddleware now runs directly
     for public pages without going through NextAuth
  3. Auth protection uses auth() as a function call (get session) only for protected
     routes, not as a middleware wrapper
  4. Exported proxy as a named async function (Next.js 16 convention)

verification: |
  - TypeScript compiles with zero errors
  - npm run build succeeds
  - 11 curl tests pass:
    GET / → 200 with internal rewrite (no visible redirect)
    GET / with Accept-Language:fr → 307 to /fr (correct)
    GET /en → 307 redirect to / (strips default prefix)
    GET /en/about → 307 redirect to /about (strips default prefix)
    GET /fr → 200 with NEXT_LOCALE cookie
    GET /fr/about → 200 with NEXT_LOCALE cookie
    GET /pt → 200 with NEXT_LOCALE cookie (was broken, now fixed)
    GET /pt/pricing → 200 with NEXT_LOCALE cookie (was broken, now fixed)
    GET /dashboard → 307 to /auth/login (auth works)
    GET /about → 200 with internal rewrite
    GET /landscape → 200 (no i18n)

files_changed:
  - proxy.ts
