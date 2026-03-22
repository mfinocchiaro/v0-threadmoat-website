---
phase: 14-internationalization-i18n-for-public-website-pages
plan: 02
subsystem: i18n
tags: [next-intl, i18n, getTranslations, locale-routing, generateMetadata]

requires:
  - phase: 14-01
    provides: "next-intl infrastructure, routing, middleware, message JSON files"
provides:
  - "4 public pages under app/[locale]/ with full t() translation"
  - "generateMetadata with translated meta for all pages"
  - "Locale-aware Link from i18n/navigation on all pages"
  - "Root layout reads NEXT_LOCALE cookie for dynamic html lang"
  - "Namespaced message loading in i18n/request.ts (Common, Home, Pricing, About, Report)"
affects: [14-03-language-switcher, 14-04-translations]

tech-stack:
  added: []
  patterns: ["getTranslations server component pattern", "setRequestLocale before getTranslations", "namespaced messages in request.ts", "pipe-delimited arrays in JSON for split()"]

key-files:
  created: []
  modified:
    - "app/[locale]/layout.tsx"
    - "app/[locale]/page.tsx"
    - "app/[locale]/pricing/page.tsx"
    - "app/[locale]/about/page.tsx"
    - "app/[locale]/report/page.tsx"
    - "app/layout.tsx"
    - "i18n/request.ts"
    - "messages/en/home.json"
    - "messages/en/pricing.json"
    - "messages/en/about.json"
    - "messages/en/report.json"

key-decisions:
  - "Used hasLocale() API in locale layout instead of manual includes() check"
  - "Namespaced messages in request.ts (Common, Home, Pricing, About, Report) for proper getTranslations namespace resolution"
  - "Used pipe-delimited strings in pricing.json for methodology items to allow split() in components"
  - "Conference banner kept as intentionally English-only across all pages"
  - "HomepageDashboard and report cover section kept as English brand content"
  - "Added meta keys to all message files for generateMetadata"

patterns-established:
  - "Server page pattern: async function with params, setRequestLocale, getTranslations"
  - "generateMetadata pattern: separate getTranslations call with explicit locale namespace"
  - "Footer copyright with year interpolation: tCommon('footer.copyrightFino', { year })"

requirements-completed: []

duration: 10min
completed: 2026-03-22
---

# Phase 14 Plan 02: Page Migration & Translation Summary

**All 4 public pages moved under app/[locale]/ with full t() translation calls, locale-aware Link, generateMetadata, and namespaced message loading**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-22T01:17:48Z
- **Completed:** 2026-03-22T01:27:29Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Moved all 4 public pages (home, pricing, about, report) under app/[locale]/ route segments using git mv
- Replaced every hardcoded English string with t() translation calls across all pages
- Replaced all next/link imports with locale-aware Link from @/i18n/navigation
- Added generateMetadata with translated meta title/description to all 4 pages
- Updated root layout to read NEXT_LOCALE cookie for dynamic html lang attribute
- Fixed i18n/request.ts to namespace messages properly for getTranslations resolution
- Added missing message keys (meta, forge features, red keep features, methodology, outputs, expanded about content)
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create locale layout and restructure routes** - `0a062ae` (feat)
2. **Task 2: Convert all 4 pages to use t() translation calls** - `de46eb1` (feat)

## Files Created/Modified
- `app/[locale]/layout.tsx` - Locale layout with NextIntlClientProvider, hasLocale validation, generateStaticParams
- `app/[locale]/page.tsx` - Home page with getTranslations('Home') and getTranslations('Common')
- `app/[locale]/pricing/page.tsx` - Pricing page with getTranslations('Pricing'), all tier/feature translations
- `app/[locale]/about/page.tsx` - About page with getTranslations('About'), bio/conference/podcast translations
- `app/[locale]/report/page.tsx` - Report page with getTranslations('Report'), TOC/stats/audience translations
- `app/layout.tsx` - Root layout now reads NEXT_LOCALE cookie for html lang attribute
- `i18n/request.ts` - Namespaced message loading (Common, Home, Pricing, About, Report)
- `messages/en/home.json` - Added meta keys
- `messages/en/pricing.json` - Added meta, forge, red keep, methodology, outputs keys
- `messages/en/about.json` - Added meta, expanded about/founder/conference/podcast keys
- `messages/en/report.json` - Added meta keys

## Decisions Made
- Used `hasLocale()` from next-intl instead of manual `includes()` for locale validation (cleaner API)
- Namespaced messages in `i18n/request.ts` as `{ Common: ..., Home: ..., Pricing: ..., About: ..., Report: ... }` so `getTranslations('Home')` resolves correctly
- Used pipe-delimited strings for methodology items in pricing.json (e.g., `"items1|items2|items3"`) with `.split('|')` in component
- Conference banner kept as intentionally English-only on all pages (time-sensitive event content)
- Company logos, external URLs, and brand names kept untranslated (not localizable content)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added meta keys to all message JSON files**
- **Found during:** Task 2
- **Issue:** Plan specified generateMetadata with t('meta.title') but no meta keys existed in any JSON file
- **Fix:** Added meta.title and meta.description keys to home.json, pricing.json, about.json, report.json
- **Files modified:** messages/en/home.json, messages/en/pricing.json, messages/en/about.json, messages/en/report.json
- **Committed in:** de46eb1

**2. [Rule 2 - Missing Critical] Added Forge/Red Keep feature keys and methodology/output keys to pricing.json**
- **Found during:** Task 2
- **Issue:** Pricing page references forgeF1-F13, redKeepF1-F10, methodology, and output sample keys that did not exist
- **Fix:** Added all missing feature keys, methodology field keys, and output sample keys to pricing.json
- **Files modified:** messages/en/pricing.json
- **Committed in:** de46eb1

**3. [Rule 1 - Bug] Fixed i18n/request.ts message namespace structure**
- **Found during:** Task 2
- **Issue:** Messages were spread flat with `...` operator, but getTranslations('Home') expects namespaced object
- **Fix:** Changed to namespaced structure: `{ Common: ..., Home: ..., Pricing: ..., About: ..., Report: ... }`
- **Files modified:** i18n/request.ts
- **Committed in:** de46eb1

**4. [Rule 3 - Blocking] Cleared stale .next/types/validator.ts**
- **Found during:** Task 2 verification
- **Issue:** TypeScript reported errors from stale .next/types referencing old page locations (app/page.tsx etc.)
- **Fix:** Removed .next/types directory (auto-regenerated on next build)
- **Files modified:** .next/types/ (deleted, not committed - generated files)
- **Committed in:** N/A (build artifact)

---

**Total deviations:** 4 auto-fixed (2 missing critical, 1 bug, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. The message namespace fix was essential for getTranslations to work at all. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 public pages are fully i18n-enabled under app/[locale]/
- Message files have complete English keys ready for translation to fr/es/it/de
- Language switcher component (Plan 03) can now be added to any page
- Actual translations (Plan 04) can populate messages/fr/*.json, messages/es/*.json, etc.

## Self-Check: PASSED

All 11 files verified present on disk. Both task commits (0a062ae, de46eb1) verified in git log.

---
*Phase: 14-internationalization-i18n-for-public-website-pages*
*Completed: 2026-03-22*
