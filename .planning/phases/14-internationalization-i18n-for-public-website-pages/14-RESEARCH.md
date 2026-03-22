# Phase 14: Internationalization (i18n) for Public Website Pages - Research

**Researched:** 2026-03-22
**Domain:** next-intl 4.x, Next.js 16 App Router, [locale] route segments, middleware composition
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Library: next-intl (not next-i18next, react-intl, or any other)
- URL strategy: path prefix (`/fr/pricing`), English at root (no `/en/` prefix) — `localePrefix: 'as-needed'`
- Language switcher: Globe icon dropdown in header, next to ThemeToggle, native script language names (Francais, Espanol, Italiano, Deutsch)
- Auto-redirect on first visit: detect via `Accept-Language` header, then cookie persistence
- Cookie: `NEXT_LOCALE` (next-intl default), configure `maxAge` to 1 year
- Pages to translate: home, pricing, about, market report (4 pages)
- Languages: English (default), French (fr), Spanish (es), Italian (it), German (de)
- Translation workflow: Ollama qwen2.5 drafts translations, user reviews and approves
- All 4 pages in one phase (not staged by page)
- Dashboard stays English-only — no i18n for `/dashboard/**`
- Dashboard/market report analytics stay English-only

### Claude's Discretion
- JSON namespace structure (flat vs nested) — recommend nested by page
- Exact Tailwind styling of language switcher dropdown
- Whether to use one big `messages/[locale].json` or per-page message files
- How to handle the Threaded! Conference banner content (time-sensitive, likely skip translation)
- Whether `hreflang` alternate links are auto-generated or manually managed

### Deferred Ideas (OUT OF SCOPE)
- RTL language support (Arabic, Hebrew)
- Currency/price localization
- Date format localization (the "Last Updated: March 11, 2026" on pricing stays English)
- Translating auth pages (/auth/login, /auth/sign-up)
- Translating privacy/terms pages
- Translating the live dashboard preview component (HomepageDashboard) on the homepage
</user_constraints>

---

## Summary

next-intl 4.8.3 (latest) is the clear standard for Next.js App Router i18n. It integrates directly with the `[locale]` dynamic route segment, provides both Server Component (`getTranslations`) and Client Component (`useTranslations`) APIs, and handles middleware-based locale detection with cookie persistence out of the box.

The project has a critical complication: the existing `proxy.ts` (Next.js 16's middleware file name) already runs NextAuth session checks. Adding next-intl requires composing the two middlewares. next-intl runs first (locale detection + redirect), then NextAuth continues its auth-protection logic. The composed middleware must exclude `/dashboard/**` and `/api/**` from locale routing while applying locale prefixes only to the 4 public pages.

The structural migration requires moving `app/page.tsx`, `app/pricing/page.tsx`, `app/about/page.tsx`, and `app/report/page.tsx` into `app/[locale]/` subdirectories, with a new `app/[locale]/layout.tsx` wrapping `NextIntlClientProvider`. The root `app/layout.tsx` becomes a thin shell. English visitors at `/` get the root experience; French visitors at `/fr/` get locale-aware rendering. next-intl's `localePrefix: 'as-needed'` setting handles this automatically.

**Primary recommendation:** Use next-intl 4.8.3 with `localePrefix: 'as-needed'`, compose with the existing NextAuth middleware in `proxy.ts`, organize messages as `messages/[locale]/[page].json` files, and use Ollama qwen2.5 to draft all ~500 strings before manual review.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | 4.8.3 | App Router i18n: routing, message lookup, locale detection | Official recommendation for Next.js App Router, maintained by Next.js ecosystem |
| next (existing) | 16.1.6 | App Router runtime | Already installed |
| next-auth (existing) | 5.0.0-beta.30 | Auth middleware (must compose with next-intl) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Ollama qwen2.5 (local) | 7.6B | Draft translations for ~500 strings | Pre-translation before human review — cost-free |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl | next-i18next | next-i18next is Pages Router only; does not support App Router |
| next-intl | react-intl | react-intl works but lacks Next.js-specific routing integration; more boilerplate |
| next-intl | built-in JS Intl | No message file management, no locale routing; massive hand-roll surface |

**Installation:**
```bash
npm install next-intl
```

**Version verification (confirmed 2026-03-22):**
```
next-intl@4.8.3  (latest as of 2026-03-22)
```

---

## Architecture Patterns

### Recommended Project Structure
```
app/
├── [locale]/                  # NEW — wraps all 4 public pages
│   ├── layout.tsx             # NextIntlClientProvider + locale html lang
│   ├── page.tsx               # Home (moved from app/page.tsx)
│   ├── pricing/
│   │   └── page.tsx           # Pricing (moved)
│   ├── about/
│   │   └── page.tsx           # About (moved)
│   └── report/
│       └── page.tsx           # Market Report (moved)
├── layout.tsx                 # Root layout — KEEP, but minimal (ThemeProvider, Analytics)
├── dashboard/                 # UNCHANGED — stays English-only, no [locale]
├── auth/                      # UNCHANGED — stays English-only
├── api/                       # UNCHANGED
├── privacy/                   # UNCHANGED
└── terms/                     # UNCHANGED

i18n/
├── routing.ts                 # defineRouting — locales, defaultLocale, localePrefix
├── request.ts                 # getRequestConfig — validate locale, load messages
└── navigation.ts              # createNavigation — locale-aware Link, useRouter, usePathname

messages/
├── en/
│   ├── home.json
│   ├── pricing.json
│   ├── about.json
│   ├── report.json
│   └── common.json            # Shared strings: nav, footer, header buttons
├── fr/
│   └── (same structure)
├── es/
│   └── (same structure)
├── it/
│   └── (same structure)
└── de/
│   └── (same structure)

proxy.ts                       # MODIFIED — compose next-intl + NextAuth
```

### Pattern 1: Routing Configuration
**What:** Centralizes locale list and URL prefix strategy
**When to use:** Always — this is the single source of truth for locales

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'it', 'de'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',   // English at /, French at /fr/, etc.
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365  // 1 year
  }
  // localeDetection: true (default) — reads Accept-Language header
})
```

### Pattern 2: Request Configuration
**What:** Validates the locale from the [locale] segment and loads messages
**When to use:** Required — this feeds getTranslations() and useTranslations()

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}/common.json`)).default,
      Home: (await import(`../messages/${locale}/home.json`)).default,
      Pricing: (await import(`../messages/${locale}/pricing.json`)).default,
      About: (await import(`../messages/${locale}/about.json`)).default,
      Report: (await import(`../messages/${locale}/report.json`)).default,
    }
  }
})
```

### Pattern 3: [locale] Layout
**What:** Provides locale context to all child pages via NextIntlClientProvider
**When to use:** Required in app/[locale]/layout.tsx

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <NextIntlClientProvider locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}
```

Note: The `<html lang={locale}>` and `<body>` tags stay in the root `app/layout.tsx`. The locale layout does NOT add a second html/body element. The root layout needs to dynamically get locale — see Pitfall 2.

### Pattern 4: Server Component Page Translation
**What:** Translating an async Server Component page
**When to use:** All 4 public pages are Server Components

```typescript
// app/[locale]/page.tsx (Home)
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)  // Required for static rendering
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <nav>
        <a href="#services">{tCommon('nav.services')}</a>
      </nav>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Home' })
  return { title: t('meta.title') }
}
```

### Pattern 5: Middleware Composition (Critical — NextAuth + next-intl)
**What:** Composes next-intl locale routing with existing NextAuth auth protection
**When to use:** The existing proxy.ts must be refactored

```typescript
// proxy.ts (REFACTORED)
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl

  // 1. Auth routes — pass through (no locale, no auth check)
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/webhooks/')
  ) {
    return NextResponse.next()
  }

  // 2. Dashboard + API — auth check only, no locale routing
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!(req as { auth?: { user?: unknown } }).auth?.user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/auth/login', req.nextUrl.origin)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 3. Public pages — run next-intl locale middleware
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 6: Language Switcher Client Component
**What:** Globe dropdown in header showing native language names
**When to use:** Must be a Client Component (uses useRouter/usePathname hooks)

```typescript
// components/language-switcher.tsx
'use client'

import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Francais' },
  { code: 'es', label: 'Espanol' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
]

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Switch language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => router.replace(pathname, { locale: loc.code })}
            className={currentLocale === loc.code ? 'font-semibold' : ''}
          >
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Note: `useRouter` and `usePathname` must come from `@/i18n/navigation`, NOT from `next/navigation`. The navigation module is created with `createNavigation(routing)` and produces locale-aware wrappers.

### Pattern 7: Message File Structure (Nested JSON)
**What:** Organizes translatable strings by page and semantic section

```json
// messages/en/home.json
{
  "meta": {
    "title": "ThreadMoat - Industrial AI & Engineering Software Intelligence",
    "description": "Navigate the future of Industrial AI..."
  },
  "nav": {
    "services": "Services",
    "expertise": "Expertise",
    "marketReport": "Market Report",
    "about": "About",
    "contact": "Contact Us",
    "signIn": "Sign In",
    "scheduleCall": "Schedule Call"
  },
  "hero": {
    "badge": "Trusted by Leading Investment Firms",
    "title": "Navigate the Future of Industrial AI & Engineering Software",
    "subtitle": "Leverage 35+ years of market expertise...",
    "cta_analytics": "See Analytics",
    "cta_pricing": "View Pricing"
  },
  "thesis": {
    "label": "Our Thesis",
    "title": "The Digital Thread Is the New Competitive Moat",
    "body": "The Digital Thread..."
  }
}
```

### Anti-Patterns to Avoid

- **Putting locale layout's html/body inside app/[locale]/layout.tsx:** Next.js allows only one html/body pair. Keep them in root app/layout.tsx, read locale from cookie or header to set `lang` attribute dynamically.
- **Importing from `next/navigation` in locale-aware components:** Always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` to get locale-aware versions.
- **Skipping `setRequestLocale(locale)`:** Without this call in Server Components and layouts, static rendering breaks. It must be called before any `getTranslations()` call.
- **Using `useTranslations` in Server Components:** Server Components must use `getTranslations` (async). `useTranslations` is for Client Components only.
- **Forgetting `generateStaticParams` in [locale]/layout.tsx:** Without this, Next.js won't statically generate locale variants at build time.
- **Running next-intl middleware on dashboard routes:** The matcher or manual path check must exclude `/dashboard/**` and `/api/**` to avoid locale redirects on authenticated routes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale detection from Accept-Language header | Custom header parsing | next-intl middleware | Best-fit algorithm, handles quality values (q=0.9), country variants |
| Cookie persistence for locale | Custom cookie read/write | next-intl `localeCookie` config | Handles SameSite, HttpOnly, path correctly |
| Locale-aware Link component | Prop-threading locale through Links | `createNavigation(routing)` Link | Handles prefix stripping, locale injection automatically |
| hreflang meta tags | Manual head tags | next-intl middleware auto-generates link headers | Correct RFC 5988 format, handles `x-default` |
| Locale validation / 404 | Manual if-checks on locale string | `hasLocale(routing.locales, requested)` + `notFound()` | Clean integration with Next.js 404 handling |
| Message file loading | Custom fs.readFile logic | next-intl `getRequestConfig` dynamic import | Tree-shaking, server-only, no client bundle bloat |

**Key insight:** next-intl's middleware does ~80% of the locale infrastructure work. The primary implementation effort is (1) moving files into `[locale]/`, (2) replacing hardcoded strings with `t('key')`, and (3) writing the JSON message files.

---

## Common Pitfalls

### Pitfall 1: Double html/body Nesting
**What goes wrong:** Developer adds `<html lang={locale}><body>` inside `app/[locale]/layout.tsx`, causing Next.js to warn about invalid HTML nesting and hydration errors.
**Why it happens:** The pattern from Next-intl docs shows `html` in the locale layout, but Next.js 16 only allows one root layout with html/body.
**How to avoid:** Keep `<html lang="en">` in root `app/layout.tsx`. For the `lang` attribute to reflect the locale, either (a) accept it's always "en" in the root (locale-specific lang is in the nested layout metadata), or (b) read the `NEXT_LOCALE` cookie in root layout to set lang dynamically.
**Warning signs:** "Nesting html inside html" console warning; hydration mismatch errors.

### Pitfall 2: Importing from `next/navigation` instead of `@/i18n/navigation`
**What goes wrong:** Language switcher built with `useRouter` from `next/navigation` — locale switching navigates to the correct URL but does NOT update the `NEXT_LOCALE` cookie, causing the next page load to re-detect the wrong locale.
**Why it happens:** Standard `useRouter.replace()` doesn't know about next-intl locale cookie management.
**How to avoid:** Always use `useRouter`, `usePathname`, and `Link` from `@/i18n/navigation` (generated by `createNavigation(routing)`).
**Warning signs:** Language switcher works on first click but reverts on hard refresh.

### Pitfall 3: Missing `setRequestLocale` Breaks Static Rendering
**What goes wrong:** Pages work in development but fail to statically render at build time. Error: "Unable to find next-intl locale" during `next build`.
**Why it happens:** `getTranslations()` reads locale from an async request context. Without `setRequestLocale(locale)`, that context isn't populated for static pages.
**How to avoid:** Call `setRequestLocale(locale)` at the top of every Server Component page AND in `[locale]/layout.tsx`, before any `getTranslations()` calls.
**Warning signs:** Build succeeds in dev, fails with locale errors in `next build`.

### Pitfall 4: Middleware Runs on Dashboard Routes and Redirects Authenticated Users
**What goes wrong:** User visits `/dashboard` → next-intl middleware detects no locale prefix → redirects to `/en/dashboard` → breaks existing auth flow → infinite redirect loop or 404.
**Why it happens:** If next-intl middleware runs before NextAuth on dashboard routes, it rewrites/redirects the URL, and NextAuth's session check sees a different path.
**How to avoid:** In the composed `proxy.ts`, check for `/dashboard` and `/api/` BEFORE calling `intlMiddleware(req)`. Return `NextResponse.next()` for auth-protected routes.
**Warning signs:** Dashboard login redirect stops working; logged-in users get bounced to 404.

### Pitfall 5: HomepageDashboard Component Breaks After Page Move
**What goes wrong:** `app/page.tsx` is moved to `app/[locale]/page.tsx`. The `HomepageDashboard` component imports from relative paths that break, or it uses hardcoded `Link href="/dashboard"` that should now be a locale-aware Link.
**Why it happens:** Moving files changes relative import resolution; `next/link` hrefs may need locale prefix.
**How to avoid:** After moving pages, verify all relative imports still resolve. Replace `next/link` `Link` with `@/i18n/navigation` `Link` in components used on public pages.
**Warning signs:** TypeScript import errors after file move; navigation links drop locale prefix.

### Pitfall 6: `NEXT_LOCALE` Cookie Conflicts with NextAuth Cookie
**What goes wrong:** NextAuth already sets session cookies; next-intl's `NEXT_LOCALE` may conflict in edge cases on cookie-size-limited responses.
**Why it happens:** Both middlewares set cookies. Generally fine, but worth being aware of.
**How to avoid:** Use the default `NEXT_LOCALE` name. Keep `maxAge` to 1 year. Monitor response headers in dev tools after first visit.
**Warning signs:** Locale resets unexpectedly on auth-related navigations.

### Pitfall 7: Translating the Threaded! Conference Banner
**What goes wrong:** Conference banner has time-sensitive content (specific dates, event names) that changes weekly. If translated, translations go stale immediately.
**Why it happens:** Treating all visible text as translatable.
**How to avoid:** Mark conference banner as English-only (leave hardcoded). Add a comment: `{/* Conference banner: intentionally English-only, time-sensitive */}`. This is within Claude's Discretion.
**Warning signs:** N/A — this is a design decision, not a runtime error.

---

## Code Examples

### Loading Messages in request.ts (Verified)
```typescript
// i18n/request.ts
// Source: https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
```

### Locale Detection Priority (from next-intl docs)
The middleware detects locale in this order:
1. Locale prefix in pathname (`/fr/pricing` → `fr`)
2. `NEXT_LOCALE` cookie (returning visitor preference)
3. `Accept-Language` header (browser preference, "best fit" algorithm)
4. `defaultLocale` fallback (`en`)

### English at Root — URL Examples
```
/                  → English home (no redirect)
/pricing           → English pricing
/fr                → French home
/fr/pricing        → French pricing
/es/about          → Spanish about
/de/report         → German market report
/dashboard         → English dashboard (no locale routing, auth-protected)
```

### Ollama Translation Workflow
```bash
# Draft French translations for home.json using local LLM
curl -s http://localhost:11434/api/generate \
  -d '{
    "model": "qwen2.5",
    "prompt": "Translate this JSON from English to French. Return only valid JSON, same structure. Do not translate key names. Context: B2B SaaS website for industrial AI market intelligence.\n\n{\"hero\":{\"title\":\"Navigate the Future of Industrial AI\",\"subtitle\":\"Leverage 35+ years of market expertise...\"}}",
    "stream": false
  }' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['response'])"
```

### hreflang Auto-Generation
next-intl middleware automatically adds Link headers for hreflang. For a request to `/fr/pricing`:
```
Link: </pricing>; rel="alternate"; hreflang="en",
      </fr/pricing>; rel="alternate"; hreflang="fr",
      </es/pricing>; rel="alternate"; hreflang="es",
      ...
```
No manual `<head>` tag management required.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` filename | `proxy.ts` filename | Next.js 16 | File rename only, same behavior |
| `next-i18next` | `next-intl` for App Router | 2023 | next-i18next is Pages Router only |
| `getStaticProps` with locale | `setRequestLocale` + static params | next-intl v3+ | Required for static rendering in App Router |
| `v3.x` `createSharedPathnamesNavigation` | `createNavigation` | next-intl v4 | Unified API replaces two separate functions |
| Separate locale layout with `<html><body>` | Root layout owns html/body, locale layout adds provider | next-intl v4 + Next.js 15+ | Avoids html nesting; locale layout is now just a provider wrapper |

**Deprecated/outdated:**
- `createSharedPathnamesNavigation`: Replaced by `createNavigation` in next-intl v4. Do not use.
- `getStaticProps` i18n patterns from next-i18next: Not applicable to App Router.
- Per-page `messages` import in each page component: Centralize in `request.ts` instead.

---

## Open Questions

1. **root `app/layout.tsx` lang attribute**
   - What we know: Root layout has `<html lang="en">`. With `[locale]` routing, the lang should reflect the active locale for accessibility/SEO.
   - What's unclear: Reading locale in root layout requires either (a) reading the `NEXT_LOCALE` cookie server-side, or (b) accepting the locale layout sets `lang` via metadata.
   - Recommendation: Use `generateMetadata` in `[locale]/layout.tsx` to set `htmlAttributes: { lang: locale }`. This overrides the root layout's html lang attribute for locale pages. Verify this works in Next.js 16.

2. **Static vs Dynamic rendering of public pages**
   - What we know: `app/page.tsx` currently calls `loadCompaniesFromCSV()` which is async data fetching. This makes the home page dynamic.
   - What's unclear: With `setRequestLocale` and `generateStaticParams`, can the page be statically rendered per locale? Or will the CSV data load force dynamic rendering?
   - Recommendation: Keep home page dynamic (it already loads data). Other 3 pages (pricing, about, report) are fully static — use `generateStaticParams` for static locale generation.

3. **Next.js 16 + next-intl 4.8.3 compatibility**
   - What we know: next-intl docs confirm `proxy.ts` is the Next.js 16 middleware filename. No breaking changes documented.
   - What's unclear: Whether `next-auth` v5 beta + next-intl middleware composition has any known edge cases.
   - Recommendation: Test the composed middleware in dev before proceeding to pages. Auth flows (login redirect, sign-up) must be verified unbroken.

4. **~500 string count estimate**
   - What we know: home page has ~150 visible strings, pricing ~100, about ~402 lines, report ~357 lines.
   - What's unclear: The pricing and report pages have many repeated feature-list strings (arrays). These may be 60-80 unique strings per page.
   - Recommendation: Run a string audit on each page before writing messages JSONs to get an accurate count. Strings that are proper nouns (ThreadMoat, Digital Thread, Recon, Forge, Red Keep) should NOT be translated.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test infrastructure in project |
| Config file | None exists |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| i18n-01 | `/fr/pricing` returns 200 and French content | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/fr/pricing` | manual check |
| i18n-02 | `/` returns English content (no redirect) | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` | manual check |
| i18n-03 | Accept-Language: fr header redirects to /fr/ | smoke | `curl -s -o /dev/null -w "%{redirect_url}" -H "Accept-Language: fr" http://localhost:3000/` | manual check |
| i18n-04 | Dashboard routes not locale-redirected | smoke | `curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000/dashboard` | manual check |
| i18n-05 | Language switcher updates NEXT_LOCALE cookie | manual | Browser dev tools — inspect cookies after switching | manual |
| i18n-06 | `next build` succeeds with generateStaticParams | build | `npm run build` exits 0 | manual |

### Wave 0 Gaps
- No test framework installed — all validation is manual curl checks and browser testing
- For a production go-live gate: run `npm run build` and spot-check all 4 locale routes × 4 pages = 16 URL combinations manually

*(No automated test framework to configure — project has none)*

---

## Sources

### Primary (HIGH confidence)
- next-intl official docs (fetched 2026-03-22): https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
- next-intl routing configuration docs: https://next-intl.dev/docs/routing/configuration
- next-intl navigation docs: https://next-intl.dev/docs/routing/navigation
- next-intl middleware docs: https://next-intl.dev/docs/routing/middleware
- next-intl server/client components: https://next-intl.dev/docs/environments/server-client-components
- npm registry version check: `npm view next-intl version` → 4.8.3 (verified 2026-03-22)

### Secondary (MEDIUM confidence)
- Codebase inspection: `proxy.ts`, `app/layout.tsx`, `auth.ts`, all 4 public pages (read directly 2026-03-22)
- package.json confirms: next@16.1.6, next-auth@5.0.0-beta.30, Radix UI DropdownMenu available

### Tertiary (LOW confidence)
- root `html lang` attribute override behavior via nested `generateMetadata` — not explicitly verified in docs, needs testing

---

## Metadata

**Confidence breakdown:**
- Standard stack (next-intl 4.8.3): HIGH — verified via npm registry and official docs
- Architecture (file structure, [locale] routing): HIGH — directly from official docs with code examples
- Middleware composition pattern: MEDIUM — general composition approach documented; NextAuth v5 beta + next-intl specific combination needs testing
- Pitfalls: HIGH — verified from official docs and direct codebase inspection
- Translation count estimate: LOW — rough estimate based on page sizes, needs string audit

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — next-intl is stable, Next.js 16 is stable)
