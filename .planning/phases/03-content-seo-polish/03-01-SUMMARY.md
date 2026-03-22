---
phase: 03-content-seo-polish
plan: 01
subsystem: seo
tags: [metadata, sitemap, robots, opengraph, twitter, hreflang, next-intl, seo]

# Dependency graph
requires:
  - phase: 14-i18n
    provides: "next-intl routing config with 6 locales and localePrefix: as-needed"
provides:
  - "lib/metadata.ts with buildAlternates and buildOpenGraph helper functions"
  - "app/sitemap.ts generating 4 pages x 6 locales + x-default hreflang entries"
  - "app/robots.ts with sitemap reference and crawler rules"
  - "metadataBase in root layout for absolute URL resolution"
  - "openGraph, twitter, and alternates metadata on all 4 public pages"
affects: [03-content-seo-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [programmatic-sitemap, metadata-helpers, dynamic-robots]

key-files:
  created:
    - lib/metadata.ts
    - app/sitemap.ts
    - app/robots.ts
  modified:
    - app/layout.tsx
    - app/[locale]/page.tsx
    - app/[locale]/pricing/page.tsx
    - app/[locale]/about/page.tsx
    - app/[locale]/report/page.tsx

key-decisions:
  - "Used shared helper functions in lib/metadata.ts to avoid URL-building duplication across 4 pages"
  - "Deleted static public/robots.txt to let dynamic app/robots.ts serve sitemap reference"
  - "English canonical URLs omit /en/ prefix consistent with localePrefix: as-needed"

patterns-established:
  - "Metadata helpers: import buildAlternates/buildOpenGraph from @/lib/metadata for any new page"
  - "Sitemap convention: app/sitemap.ts loops PUBLIC_PAGES array -- add new public pages there"

requirements-completed: [SEO-01, SEO-03]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 3 Plan 1: SEO Metadata & Sitemap Summary

**Programmatic sitemap with 24 locale-variant URLs, openGraph/twitter/hreflang metadata on all 4 public pages, and dynamic robots.txt with sitemap reference**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T20:38:06Z
- **Completed:** 2026-03-22T20:40:07Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created shared metadata helpers (buildAlternates, buildOpenGraph) in lib/metadata.ts deriving URLs from i18n routing config
- Created programmatic sitemap.ts generating 4 page entries with alternates.languages for all 6 locales + x-default
- Created dynamic robots.ts replacing static robots.txt, adding sitemap URL and disallow rules for /api/, /auth/, /dashboard/
- Added metadataBase to root layout for absolute URL resolution on social platforms
- Enhanced all 4 public pages (home, pricing, about, report) with openGraph, twitter, and alternates metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: Create metadata helper, sitemap, robots, and add metadataBase** - `133fb86` (feat)
2. **Task 2: Enhance generateMetadata on all 4 public pages** - `2af1a76` (feat)

## Files Created/Modified
- `lib/metadata.ts` - Shared buildAlternates and buildOpenGraph helper functions
- `app/sitemap.ts` - Programmatic sitemap with 4 pages x 6 locales + x-default
- `app/robots.ts` - Dynamic robots.txt with sitemap reference and crawler rules
- `app/layout.tsx` - Added metadataBase: new URL('https://threadmoat.com')
- `app/[locale]/page.tsx` - Added openGraph, twitter, alternates to home page metadata
- `app/[locale]/pricing/page.tsx` - Added openGraph, twitter, alternates to pricing page metadata
- `app/[locale]/about/page.tsx` - Added openGraph, twitter, alternates to about page metadata
- `app/[locale]/report/page.tsx` - Added openGraph, twitter, alternates to report page metadata
- `public/robots.txt` - Deleted (replaced by dynamic app/robots.ts)

## Decisions Made
- Used shared helper functions in lib/metadata.ts to avoid URL-building duplication across 4 pages
- Deleted static public/robots.txt so dynamic app/robots.ts takes precedence (Next.js serves static files first)
- English canonical URLs omit /en/ prefix, consistent with localePrefix: as-needed routing config

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All public pages have production-quality SEO metadata
- Sitemap and robots are ready for search engine submission
- OG images (SEO-02) and copy polish (SEO-04) can proceed in plan 02

---
*Phase: 03-content-seo-polish*
*Completed: 2026-03-22*
