# Phase 1: Portuguese Language & Flag Emoji - Research

**Researched:** 2026-03-22
**Domain:** i18n locale addition (next-intl), UI emoji enhancement
**Confidence:** HIGH

## Summary

Phase 1 extends the existing next-intl i18n infrastructure (completed in Phase 14) with two discrete changes: (1) adding Portuguese (pt) as the 6th supported locale, and (2) prepending flag emoji to all language names in the LanguageSwitcher dropdown.

The existing architecture makes both changes trivial. Adding a locale requires: updating the `locales` array in `i18n/routing.ts`, creating 5 Portuguese message JSON files under `messages/pt/`, updating all 6 `common.json` files to include the `pt` language name entry, and adding `pt` to the `LANGUAGE_NAMES` map in `components/language-switcher.tsx`. Flag emoji are a pure UI change to the same `LANGUAGE_NAMES` constant and all `common.json` language sections.

No new dependencies are needed. next-intl 4.8.3 (already installed, currently latest) handles locale routing, cookie persistence, and message loading automatically when the `locales` array is expanded.

**Primary recommendation:** Treat this as a single small plan with 3-4 tasks -- message file creation, routing config update, and language switcher UI update. The flag emoji and Portuguese additions can be done together since they touch overlapping files.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| I18N-04 | Portuguese (pt) language support with translated message files | Add `pt` to routing.ts locales array, create `messages/pt/` with 5 JSON files (common, home, pricing, about, report) matching existing key structures |
| I18N-05 | Flag emoji displayed next to language names in switcher | Update `LANGUAGE_NAMES` in language-switcher.tsx to prepend emoji, update `language` section in all 6 `common.json` files |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | 4.8.3 | i18n routing, message loading, locale detection | Already installed, App Router native, handles all locale mechanics |

### Supporting
No additional libraries needed. Flag emoji are native Unicode -- no icon library required.

### Alternatives Considered
None. The infrastructure is already built. This phase only adds content and config.

## Architecture Patterns

### Existing Project Structure (relevant files)
```
i18n/
├── routing.ts          # locales array, defaultLocale, cookie config
├── request.ts          # dynamic message imports per locale
└── navigation.ts       # createNavigation wrapper
messages/
├── en/                 # 5 JSON files (common, home, pricing, about, report)
├── fr/                 # same structure
├── es/                 # same structure
├── it/                 # same structure
├── de/                 # same structure
└── pt/                 # TO CREATE: same 5 files
components/
└── language-switcher.tsx  # LANGUAGE_NAMES map, dropdown rendering
```

### Pattern 1: Adding a New Locale
**What:** Extend the locales array and create matching message files.
**When to use:** Every time a new language is added.
**Changes required (4 touchpoints):**

1. `i18n/routing.ts` -- add `'pt'` to locales array
2. `messages/pt/*.json` -- create 5 translated JSON files matching `en/` key structure
3. `messages/*/common.json` -- add `"pt": "Portugues"` to the `language` section in ALL locale common.json files
4. `components/language-switcher.tsx` -- add `pt` entry to `LANGUAGE_NAMES`

**No changes needed in:**
- `i18n/request.ts` -- uses dynamic import from locale variable, auto-resolves `pt`
- `i18n/navigation.ts` -- derives from routing config automatically
- `app/[locale]/` -- Next.js dynamic segment handles any valid locale
- Middleware -- no custom middleware exists; next-intl handles routing internally

### Pattern 2: Flag Emoji in Language Names
**What:** Prepend Unicode flag emoji to language display names.
**Where:** `LANGUAGE_NAMES` constant in `language-switcher.tsx` and `language` section in all `common.json` files.
**Example:**
```typescript
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "🇺🇸🇬🇧 English",
  fr: "🇫🇷 Français",
  es: "🇪🇸 Español",
  it: "🇮🇹 Italiano",
  de: "🇩🇪 Deutsch",
  pt: "🇧🇷🇵🇹 Português",
}
```

**Note on dual flags:** English uses US+UK flags (🇺🇸🇬🇧) and Portuguese uses Brazil+Portugal flags (🇧🇷🇵🇹) per user specification. These are two adjacent flag emoji each, not a single combined glyph.

### Anti-Patterns to Avoid
- **Forgetting common.json updates across all locales:** Each locale's `common.json` has a `language` section listing all language names. ALL 6 files must include the `pt` entry and have emoji-prefixed values if the language switcher reads from messages rather than the hardcoded constant.
- **Inconsistent key structures:** The Portuguese message files must have EXACTLY the same keys as English. Missing keys cause runtime errors or fallback text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Translation | Machine translation pipeline | Claude-generated translations of English source files | Existing pattern from Phase 14; professional review recommended before launch per PROJECT.md constraints |
| Flag rendering | Custom SVG flag components | Native Unicode emoji (🇫🇷) | Universal browser support, zero bundle cost, simpler code |

## Common Pitfalls

### Pitfall 1: Missing or Mismatched JSON Keys
**What goes wrong:** Portuguese JSON files have different keys than English, causing `next-intl` to throw "missing message" errors at runtime.
**Why it happens:** Manual translation introduces typos in key names or accidentally omits nested keys.
**How to avoid:** Use the English files as templates. Copy structure, translate only values. Verify key parity programmatically or by visual diff.
**Warning signs:** Build warnings about missing translations, untranslated text appearing on Portuguese pages.

### Pitfall 2: Forgetting to Update the Locale Type
**What goes wrong:** TypeScript `Locale` type (derived from `routing.locales`) doesn't include `pt`, causing type errors in components that reference it.
**Why it happens:** The type is auto-derived: `type Locale = (typeof routing.locales)[number]`. Adding `pt` to the array automatically fixes this -- but only if `routing.ts` is updated first.
**How to avoid:** Update `routing.ts` BEFORE updating `language-switcher.tsx`.
**Warning signs:** TypeScript errors on `pt` string literal.

### Pitfall 3: Emoji Rendering Width in Dropdown
**What goes wrong:** Dual-flag entries (🇺🇸🇬🇧, 🇧🇷🇵🇹) take more horizontal space than single-flag entries, causing layout inconsistency.
**Why it happens:** Each flag emoji is its own glyph; two flags are twice the width of one.
**How to avoid:** The dropdown width is currently `w-36` (9rem). May need to increase to `w-44` or `w-48` to accommodate dual flags comfortably. Test visually.
**Warning signs:** Text truncation or overflow in the dropdown menu.

### Pitfall 4: common.json Language Section Inconsistency
**What goes wrong:** The `language` section in `common.json` lists language names for potential use in translated contexts. If not updated across all locales, the Portuguese option may not appear correctly when the app reads language names from messages instead of the hardcoded constant.
**Why it happens:** The `LANGUAGE_NAMES` constant in `language-switcher.tsx` is the primary source, but `common.json` also has a `language` section that should stay in sync.
**How to avoid:** Update BOTH the component constant AND all 6 `common.json` language sections.

## Code Examples

### Routing Config Update
```typescript
// i18n/routing.ts
export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'it', 'de', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
})
```

### Language Switcher with Flags
```typescript
// components/language-switcher.tsx
const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "🇺🇸🇬🇧 English",
  fr: "🇫🇷 Français",
  es: "🇪🇸 Español",
  it: "🇮🇹 Italiano",
  de: "🇩🇪 Deutsch",
  pt: "🇧🇷🇵🇹 Português",
}
```

### Portuguese common.json Structure
```json
{
  "nav": {
    "services": "Serviços",
    "expertise": "Expertise",
    "marketReport": "Relatório de Mercado",
    "about": "Sobre",
    "contactUs": "Contacte-nos",
    "signIn": "Entrar",
    "scheduleCall": "Agendar Chamada",
    "getStarted": "Começar",
    "viewPricing": "Ver Preços",
    "registerNow": "Registre-se Agora!"
  },
  "footer": { "..." },
  "language": {
    "en": "English",
    "fr": "Français",
    "es": "Español",
    "it": "Italiano",
    "de": "Deutsch",
    "pt": "Português",
    "switchLanguage": "Mudar idioma"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-intl v3 page-based config | next-intl v4 App Router native | 2024 | v4 is already in use; no migration needed |

No deprecated patterns in play. The project uses current best practices.

## Open Questions

1. **Dropdown width with dual flags**
   - What we know: Current dropdown is `w-36`. Dual flags add ~1em of width.
   - What's unclear: Whether `w-36` is sufficient or needs widening.
   - Recommendation: Test visually during implementation; increase to `w-44` if needed.

2. **Brand name handling in Portuguese**
   - What we know: PROJECT.md states "ThreadMoat, Digital Thread, Recon, Forge, Red Keep must never be translated."
   - What's unclear: Whether any of these appear in message file values that might get accidentally translated.
   - Recommendation: Grep English files for brand names before translating; preserve them verbatim in Portuguese.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework detected in package.json |
| Config file | None |
| Quick run command | `npm run build` (type-check + build validates all locales) |
| Full suite command | `npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| I18N-04 | Portuguese pages render with translated content | smoke | `npm run build` (validates all locale message imports resolve) | N/A -- build-time |
| I18N-05 | Flag emoji visible in language switcher | manual-only | Visual inspection in browser | N/A -- UI visual |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` succeeds + visual verification of `/pt/pricing` and language switcher

### Wave 0 Gaps
None -- no test framework exists in this project. Build validation is sufficient for this phase's scope (config changes + static JSON files). No test infrastructure needs to be created.

## Sources

### Primary (HIGH confidence)
- Project source code: `i18n/routing.ts`, `i18n/request.ts`, `components/language-switcher.tsx`, `messages/en/common.json` -- direct inspection of current implementation
- `npm view next-intl version` -- confirmed 4.8.3 is latest and matches installed version

### Secondary (MEDIUM confidence)
- next-intl documentation patterns from Phase 14 implementation (already proven in this codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, existing next-intl 4.8.3 is current
- Architecture: HIGH - pattern established in Phase 14 with 5 working locales, adding 6th is mechanical
- Pitfalls: HIGH - identified from direct code inspection of touchpoints

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no moving parts, purely additive content)
