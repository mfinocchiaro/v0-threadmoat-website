# Phase 3: Content & SEO Polish - Research

**Researched:** 2026-03-22
**Domain:** Next.js App Router SEO, OG images, sitemap generation, multilingual meta tags
**Confidence:** HIGH

## Summary

Phase 3 addresses four requirements: production-quality meta tags (SEO-01), Open Graph images (SEO-02), sitemap with locale variants (SEO-03), and marketing copy polish (SEO-04). The project runs Next.js 16.1.6 with next-intl 4.8.3, has 6 locales (en, fr, es, it, de, pt) with `localePrefix: 'as-needed'` (English has no prefix, others get `/fr/`, `/es/`, etc.), and 4 public pages: home, pricing, about, report.

The existing codebase already has `generateMetadata` on all 4 page files pulling titles and descriptions from translation files. The root layout has a static fallback `Metadata` export. There is no sitemap, no OG images, no hreflang/alternate link tags, and robots.txt is a static file in `/public/` that lacks a sitemap reference. `next/og` (ImageResponse) is bundled with Next.js 16 -- no additional package needed.

**Primary recommendation:** Use Next.js App Router conventions: `app/sitemap.ts` for programmatic sitemap with all locale URLs, `app/[locale]/opengraph-image.tsx` (or per-page route handlers) for dynamic OG images via `next/og`, and enhance each page's `generateMetadata` to include `openGraph`, `twitter`, and `alternates` fields.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Production-quality page titles and meta descriptions on all public pages | All 4 pages already have `generateMetadata` with i18n titles/descriptions. Enhancement needed: add `openGraph`, `twitter`, and `alternates` fields to each. Review copy quality for each locale. |
| SEO-02 | Open Graph images for social sharing on all public pages | `next/og` (ImageResponse) is bundled in Next.js 16. Create dynamic OG image route using JSX-to-image rendering. No external package needed. |
| SEO-03 | Sitemap.xml with all locale variants | Use `app/sitemap.ts` export. Generate entries for 4 pages x 6 locales = 24 URLs with `alternates.languages` for hreflang. Update robots.txt with sitemap URL. |
| SEO-04 | Marketing copy polished and consistent across all pages | Review all message JSON files across 6 locales for consistency, tone, and accuracy. Ensure brand names (ThreadMoat, Digital Thread, Recon, Forge, Red Keep) are never translated. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Framework with built-in `next/og`, sitemap conventions, metadata API | Already installed, provides all SEO primitives |
| next-intl | 4.8.3 | Locale routing, translations, `getTranslations` in `generateMetadata` | Already installed, handles all i18n |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/og (ImageResponse) | Built into Next 16 | Dynamic OG image generation using JSX | For SEO-02 OG images |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dynamic OG via `next/og` | Static PNG files in `/public/` | Static is simpler but cannot include locale-specific text or page-specific content |
| `app/sitemap.ts` | External sitemap generator package | App Router convention is zero-dependency and auto-served |

**Installation:**
```bash
# No new packages needed -- everything is built into Next.js 16
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  sitemap.ts                          # Programmatic sitemap (SEO-03)
  robots.ts                           # Move from static to dynamic (adds sitemap URL)
  [locale]/
    page.tsx                          # Enhanced generateMetadata with OG + alternates
    opengraph-image.tsx               # Dynamic OG image for home page (SEO-02)
    pricing/
      page.tsx                        # Enhanced generateMetadata
      opengraph-image.tsx             # Dynamic OG image for pricing
    about/
      page.tsx                        # Enhanced generateMetadata
      opengraph-image.tsx             # Dynamic OG image for about
    report/
      page.tsx                        # Enhanced generateMetadata
      opengraph-image.tsx             # Dynamic OG image for report
```

### Pattern 1: Programmatic Sitemap with Locale Variants
**What:** Export a `sitemap()` function from `app/sitemap.ts` that generates entries for all pages across all locales with `alternates.languages` for hreflang.
**When to use:** Always for multilingual Next.js sites.
**Example:**
```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://threadmoat.com'
const PUBLIC_PAGES = ['/', '/pricing', '/about', '/report']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const page of PUBLIC_PAGES) {
    const languages: Record<string, string> = {}
    for (const locale of routing.locales) {
      if (locale === routing.defaultLocale) {
        languages[locale] = `${BASE_URL}${page}`
      } else {
        languages[locale] = `${BASE_URL}/${locale}${page}`
      }
    }
    // x-default points to the default locale (English, no prefix)
    languages['x-default'] = `${BASE_URL}${page}`

    entries.push({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      alternates: { languages },
    })
  }

  return entries
}
```

### Pattern 2: Dynamic OG Image with next/og
**What:** Use `ImageResponse` from `next/og` in a route segment file to generate branded OG images with locale-specific text.
**When to use:** For each public page that needs social sharing preview.
**Example:**
```typescript
// app/[locale]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'

export const runtime = 'edge'
export const alt = 'ThreadMoat - Industrial AI & Engineering Software Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Home' })

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        padding: '60px',
      }}>
        <div style={{ fontSize: 32, color: '#a78bfa', marginBottom: 16 }}>ThreadMoat</div>
        <div style={{ fontSize: 48, color: '#ffffff', fontWeight: 700, maxWidth: 900 }}>
          {t('meta.title')}
        </div>
        <div style={{ fontSize: 24, color: '#a1a1aa', marginTop: 16, maxWidth: 800 }}>
          {t('meta.description')}
        </div>
      </div>
    ),
    { ...size }
  )
}
```

### Pattern 3: Enhanced generateMetadata with alternates
**What:** Add `openGraph`, `twitter`, and `alternates` fields to each page's existing `generateMetadata`.
**When to use:** Every public page.
**Example:**
```typescript
// In any page's generateMetadata
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://threadmoat.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Home' })
  const pagePath = '/' // or '/pricing', '/about', '/report'

  // Build alternates for hreflang
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    const prefix = loc === routing.defaultLocale ? '' : `/${loc}`
    languages[loc] = `${BASE_URL}${prefix}${pagePath === '/' ? '' : pagePath}`
  }
  languages['x-default'] = `${BASE_URL}${pagePath === '/' ? '' : pagePath}`

  const canonicalUrl = locale === routing.defaultLocale
    ? `${BASE_URL}${pagePath === '/' ? '' : pagePath}`
    : `${BASE_URL}/${locale}${pagePath === '/' ? '' : pagePath}`

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: canonicalUrl || '/',
      languages,
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      url: canonicalUrl || '/',
      siteName: 'ThreadMoat',
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
  }
}
```

### Pattern 4: Dynamic robots.ts
**What:** Replace static `public/robots.txt` with `app/robots.ts` to programmatically include the sitemap URL.
**Example:**
```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/dashboard/'],
    },
    sitemap: 'https://threadmoat.com/sitemap.xml',
  }
}
```

### Anti-Patterns to Avoid
- **Hardcoding locale URLs:** Always derive from `routing.locales` and `routing.defaultLocale` to stay in sync with i18n config.
- **Using static OG images for all locales:** LinkedIn/Twitter previews should show locale-appropriate text for better engagement.
- **Forgetting `x-default` hreflang:** Search engines need this to know the default language variant.
- **Putting sitemap in `/public/`:** Static sitemaps cannot include dynamic locale alternates; use `app/sitemap.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML generation | Custom XML string builder | `app/sitemap.ts` returning `MetadataRoute.Sitemap` | Next.js handles XML serialization, content-type headers, caching |
| OG image generation | Canvas/sharp pipeline | `next/og` ImageResponse | Built into Next.js, uses Satori for JSX-to-SVG-to-PNG, works on Edge Runtime |
| Hreflang link tags | Manual `<link>` tags in `<head>` | `alternates.languages` in `generateMetadata` | Next.js renders these automatically from metadata API |
| robots.txt with sitemap | Static file management | `app/robots.ts` export | Programmatic, stays in sync with domain config |

**Key insight:** Next.js 16 Metadata API handles all SEO concerns declaratively. Every meta tag, OG property, hreflang link, sitemap entry, and robots directive has a first-class API. Using these conventions means zero HTML string manipulation.

## Common Pitfalls

### Pitfall 1: OG Image File Naming Convention
**What goes wrong:** OG images don't get picked up automatically.
**Why it happens:** The file must be named exactly `opengraph-image.tsx` (not `og-image.tsx` or `og.tsx`). Next.js uses file-based conventions.
**How to avoid:** Use exact names: `opengraph-image.tsx` for OG and `twitter-image.tsx` for Twitter (or let OG serve both).
**Warning signs:** Social preview tools show no image when sharing URL.

### Pitfall 2: `localePrefix: 'as-needed'` and Canonical URLs
**What goes wrong:** English pages get canonical URLs with `/en/` prefix, causing duplicate content signals.
**Why it happens:** When building alternates, treating all locales the same way.
**How to avoid:** Always check `locale === routing.defaultLocale` and omit the prefix for English. The canonical for English home should be `https://threadmoat.com/` not `https://threadmoat.com/en/`.
**Warning signs:** Google Search Console shows duplicate content warnings for English pages.

### Pitfall 3: Sitemap Matcher vs Middleware Matcher Conflict
**What goes wrong:** Sitemap returns 404 or gets intercepted by middleware.
**Why it happens:** The middleware matcher in `proxy.ts` catches all non-static routes. `sitemap.xml` could be caught.
**How to avoid:** `app/sitemap.ts` generates `/sitemap.xml` which is handled by Next.js before middleware. Verify after implementation that `curl https://threadmoat.com/sitemap.xml` returns XML.
**Warning signs:** Sitemap URL returns HTML or redirect instead of XML.

### Pitfall 4: OG Images with `getTranslations` on Edge Runtime
**What goes wrong:** `getTranslations` may not work on Edge Runtime depending on next-intl configuration.
**Why it happens:** next-intl server functions may require Node.js runtime for file-based message loading.
**How to avoid:** Test OG image route with `runtime = 'edge'` first. If it fails, switch to `runtime = 'nodejs'` or pass locale text as params instead of using `getTranslations`.
**Warning signs:** OG image route returns 500 error.

### Pitfall 5: Missing `metadataBase` in Root Layout
**What goes wrong:** OG image URLs are relative instead of absolute, causing social platforms to reject them.
**Why it happens:** Next.js needs `metadataBase` to resolve relative URLs in metadata to absolute URLs.
**How to avoid:** Add `metadataBase: new URL('https://threadmoat.com')` to the root layout's metadata export.
**Warning signs:** Social sharing debuggers show broken image URLs like `localhost:3000/...`.

### Pitfall 6: Static robots.txt Conflicts with Dynamic robots.ts
**What goes wrong:** The static `public/robots.txt` takes precedence over `app/robots.ts`.
**Why it happens:** Next.js serves static files from `/public/` before checking route handlers.
**How to avoid:** Delete `public/robots.txt` before creating `app/robots.ts`.
**Warning signs:** Sitemap URL not appearing in robots.txt after adding `app/robots.ts`.

## Code Examples

### Complete sitemap.ts for ThreadMoat
```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://threadmoat.com'

// Only public marketing pages (no auth, dashboard, API routes)
const PUBLIC_PAGES = ['/', '/pricing', '/about', '/report']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const page of PUBLIC_PAGES) {
    const languages: Record<string, string> = {}

    for (const locale of routing.locales) {
      const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
      const path = page === '/' ? '' : page
      languages[locale] = `${BASE_URL}${prefix}${path}`
    }
    languages['x-default'] = `${BASE_URL}${page === '/' ? '' : page}`

    entries.push({
      url: `${BASE_URL}${page === '/' ? '' : page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: page === '/' ? 1.0 : 0.8,
      alternates: { languages },
    })
  }

  return entries
}
```

### metadataBase in Root Layout
```typescript
// Add to app/layout.tsx metadata export
export const metadata: Metadata = {
  metadataBase: new URL('https://threadmoat.com'),
  title: 'ThreadMoat - Industrial AI & Engineering Software Intelligence',
  description: '...',
  // ... existing icons config
}
```

### Helper Function for Shared Metadata Logic
```typescript
// lib/metadata.ts
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://threadmoat.com'

export function buildAlternates(locale: string, pagePath: string) {
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    const prefix = loc === routing.defaultLocale ? '' : `/${loc}`
    const path = pagePath === '/' ? '' : pagePath
    languages[loc] = `${BASE_URL}${prefix}${path}`
  }
  languages['x-default'] = `${BASE_URL}${pagePath === '/' ? '' : pagePath}`

  const canonical = locale === routing.defaultLocale
    ? `${BASE_URL}${pagePath === '/' ? '' : pagePath}`
    : `${BASE_URL}/${locale}${pagePath === '/' ? '' : pagePath}`

  return {
    canonical: canonical || '/',
    languages,
  }
}

export function buildOpenGraph(
  title: string,
  description: string,
  locale: string,
  pagePath: string
): Metadata['openGraph'] {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const path = pagePath === '/' ? '' : pagePath
  return {
    title,
    description,
    url: `${BASE_URL}${prefix}${path}`,
    siteName: 'ThreadMoat',
    locale,
    type: 'website',
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vercel/og` package | `next/og` (built into Next.js 14+) | Next.js 14 | No separate install needed |
| `next-seo` package | Next.js Metadata API | Next.js 13.2+ (App Router) | Zero-dependency SEO via `generateMetadata` |
| Static sitemap.xml in /public | `app/sitemap.ts` convention | Next.js 13+ | Programmatic, type-safe sitemaps |
| Manual `<link rel="alternate">` tags | `alternates.languages` in Metadata | Next.js 13+ | Declarative hreflang |

**Deprecated/outdated:**
- `next-seo`: Not needed with App Router Metadata API. The project correctly uses `generateMetadata` already.
- `@vercel/og`: Superseded by `next/og` which ships with Next.js. Do not install separately.

## Open Questions

1. **OG Image Edge Runtime Compatibility with next-intl**
   - What we know: `next/og` ImageResponse works best on Edge Runtime. next-intl's `getTranslations` works on server.
   - What's unclear: Whether `getTranslations` works on Edge Runtime with next-intl 4.8.3's file-based message loading.
   - Recommendation: Try Edge first; fall back to Node runtime or hardcode brand text (ThreadMoat never translates) if Edge fails.

2. **Custom Fonts in OG Images**
   - What we know: `ImageResponse` supports custom fonts via `fetch` of `.ttf`/`.woff` files.
   - What's unclear: Whether the Geist font files are accessible for embedding in OG images.
   - Recommendation: Start with system fonts (Inter or sans-serif). Add custom Geist font only if branding requires it. Keep OG images simple.

3. **Marketing Copy Review Quality**
   - What we know: Translations were generated by Claude, not professionally reviewed.
   - What's unclear: Quality of non-English meta descriptions for SEO.
   - Recommendation: Focus SEO-04 on English copy polish. Flag non-English copy as draft quality in a comment, defer professional review.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | None |
| Quick run command | `npx next build` (validates all pages compile) |
| Full suite command | `npx next build && curl -s localhost:3000/sitemap.xml` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Every public page has title + description in metadata | smoke | `npx next build` (build fails if generateMetadata broken) | N/A |
| SEO-02 | OG images render for each page/locale | manual | Visit `/opengraph-image` route in browser, test with social debugger | N/A |
| SEO-03 | sitemap.xml contains 24 URLs with hreflang alternates | smoke | `curl http://localhost:3000/sitemap.xml` after build | N/A |
| SEO-04 | Copy consistency | manual-only | Human review of all page content | N/A |

### Sampling Rate
- **Per task commit:** `npx next build` (ensures no TypeScript errors, all metadata resolves)
- **Per wave merge:** Build + manual check of sitemap.xml and OG image routes
- **Phase gate:** Build succeeds, sitemap.xml validates, OG images render in LinkedIn Post Inspector

### Wave 0 Gaps
None -- no test framework needed for this phase. Validation is via build success and manual social sharing tool checks (LinkedIn Post Inspector, Twitter Card Validator). These are inherently manual verification tools.

## Sources

### Primary (HIGH confidence)
- Project source code: `app/[locale]/*.tsx`, `app/layout.tsx`, `i18n/routing.ts`, `proxy.ts`, `next.config.mjs` -- direct inspection of current state
- Next.js 16 installed node_modules: verified `next/og` exports exist, `MetadataRoute.Sitemap` types available
- next-intl 4.8.3 installed: verified routing config, `getTranslations` usage patterns

### Secondary (MEDIUM confidence)
- Next.js Metadata API conventions (sitemap.ts, robots.ts, opengraph-image.tsx) -- based on Next.js 13-15 documentation which carries forward to 16
- `alternates.languages` for hreflang in metadata -- documented Next.js pattern

### Tertiary (LOW confidence)
- Edge Runtime compatibility of `getTranslations` with next-intl 4.8.3 -- needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified in node_modules
- Architecture: HIGH - using documented Next.js App Router conventions, patterns verified against installed types
- Pitfalls: HIGH - derived from direct code inspection (localePrefix config, middleware matcher, static robots.txt)
- OG image Edge Runtime: LOW - needs runtime testing

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- Next.js metadata API is mature)
