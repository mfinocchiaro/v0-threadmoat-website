- Used dual flag emoji for English (🇺🇸🇬🇧) and Portuguese (🇧🇷🇵🇹) per user specification
- Wrote Portuguese translations manually (Ollama qwen2.5 failed previously)
- Updated all 5 existing common.json files to add Portuguese language entry
- Graceful empty string fallback for env vars instead of non-null assertions
- Fallback to inline price_data when no Stripe Price ID configured (supports coupon/manual products)
- Removed duplicate getStripe() in webhook; uses shared lib/stripe import
- Used shared helper functions in lib/metadata.ts to avoid URL-building duplication across 4 pages
- Deleted static public/robots.txt to let dynamic app/robots.ts serve sitemap reference
- English canonical URLs omit /en/ prefix consistent with localePrefix: as-needed
- Used Node runtime instead of Edge for getTranslations compatibility with next-intl file-based message loading
- System fonts only — no custom font loading to avoid asset complexity
- Text-only OG images (no logo image) for simplicity and fast rendering
- Text-based ThreadMoat logo in violet (#7c3aed) rather than image asset
- Inline styles with 'as const' type assertions for textAlign compatibility
- ReceiptEmail accepts pre-formatted date strings; lib/email.ts handles Date-to-string formatting
- Fire-and-forget pattern (no await) for all email sends to avoid blocking Stripe webhook response
- Welcome email only for subscription mode, not one-time payments
- One-time payment receipts use checkout.session.completed since invoice.payment_succeeded does not fire for payment mode
- Best-effort API call on wizard complete -- don't block user if POST fails
- Admin tier reuses Strategist steps since admins typically skip onboarding
- Local onboardingDismissed state prevents wizard re-render after API call before page reload
- Wizard placed after SidebarShell content so dashboard is visible behind the dialog overlay
- CompanyDataProvider wraps FilterProvider (company data available before filters)
- Provider hierarchy: PlanProvider > ScenarioProvider > CompanyDataProvider > FilterProvider > LayoutInner
- Filter options computed via useCompanyData() in a custom useFilterOptions hook (replicates viz-filter-bar.tsx options logic)
- Active filter chips rendered as Badge components with inline X remove button
- Each filter category is a Popover with pill-toggle buttons (not a dialog or dropdown menu)
- Search input placed inline at end of category buttons row with ml-auto
- Kept viz-filter-bar.tsx as deprecated reference, not deleted
- Removed unused 'companies' from useThesisGatedData destructuring where VizFilterBar was the only consumer
- Simplified Fragment wrappers to direct chart component renders after removing VizFilterBar sibling
- Used hasLocale() API in locale layout instead of manual includes() check
- Namespaced messages in request.ts (Common, Home, Pricing, About, Report) for proper getTranslations namespace resolution
- Used pipe-delimited strings in pricing.json for methodology items to allow split() in components
- Conference banner kept as intentionally English-only across all pages
- HomepageDashboard and report cover section kept as English brand content
- Added meta keys to all message files for generateMetadata
- Reused existing LanguageSwitcher component which uses useLocale() internally instead of accepting currentLocale prop
- Wrote translations manually rather than using Ollama qwen2.5 which returned untranslated content
- Used native Unicode characters for language labels (Francais, Espanol, Italiano, Deutsch)

---

## Decisions Table

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 |  | product | How to handle dashboard UX feedback requesting narrative reports, new heatmaps, and interactive report builder workflow | Capture as product direction for M005+ planning. Do not scope into M004 (which is verification-only). | The feedback describes a significant product evolution (analysis workbench with AI narrative). M004 is scoped for verification/sign-off only. This feedback should inform M005 planning after M004 closes. | Yes | collaborative |
| D002 | M005/S03 | ui-pattern | How to present shortlist panel in dashboard toolbar | Radix Popover anchored to toolbar trigger button with badge count | Consistent with existing filter category dropdowns (all Radix Popover). Lightweight, anchored positioning, no full dialog overlay that blocks chart interaction. | Yes | agent |
| D003 | M005/S03 | design | Visual highlight treatment for shortlisted companies on charts | Amber #f59e0b with 2.5px stroke (SVG) or CSS outline (HTML) across all 4 chart types | Amber is distinct from the existing color scales (blues, greens, categorical), visible on both light and dark backgrounds. CSS outline on periodic table HTML cells avoids layout shift that border would cause. Consistent across chart types. | Yes | agent |
| D004 | M005/S04 | architecture | PDF export strategy for Custom Report Builder | jsPDF + html-to-image client-side generation with offscreen chart capture | Avoids server-side rendering complexity (Puppeteer/headless Chrome). Charts need real DOM dimensions for D3 layout, so visibility:hidden offscreen container preserves rendering while toPng() captures at 2x pixel ratio. jsPDF lightweight markdown renderer handles headings/bold/bullets without pulling in a full HTML-to-PDF library. Entire pipeline runs client-side with no API calls. | Yes | agent |
| D005 | M006/S01 | data-model | Composite momentum score formula for Market Momentum Heatmap | (growthMetrics/5)*0.4 + (customerSignalScore/8)*0.3 + (momentumMultiplier/2.73)*0.3 — all normalized 0–1 | Weights growth metrics highest (40%) as the most direct momentum signal, with customer signal and momentum multiplier equally weighted at 30% each. Each component normalized to 0–1 by dividing by its known max (growthMetrics max 5, customerSignalScore max 8, momentumMultiplier max 2.73). Zero-division guarded with fallback defaults. | Yes — weights and normalization ranges can be tuned based on SME feedback | agent |
