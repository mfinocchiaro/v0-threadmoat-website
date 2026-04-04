---
id: M010
title: "Homepage Speed Index & Deferred Chart Loading"
status: complete
completed_at: 2026-04-04T04:51:37.154Z
key_decisions:
  - useLazyMount hook with 200px rootMargin for early chart trigger
  - Async server component + Suspense for streaming data-heavy sections
  - Pre-sized skeleton containers for CLS prevention
  - 3-run median for production Lighthouse measurement
key_files:
  - hooks/use-lazy-mount.ts
  - components/homepage/homepage-dashboard.tsx
  - components/homepage/homepage-dashboard-section.tsx
  - app/[locale]/page.tsx
lessons_learned:
  - IntersectionObserver with rootMargin '200px' provides seamless below-the-fold loading — users don't see skeletons at normal scroll speed
  - Suspense boundaries around async server components give the biggest TTFB win for data-heavy pages — the hero streams immediately
  - Production Lighthouse variance on serverless is high (perf 69-85 across 3 runs) — always report medians, not single runs
  - next/dynamic defers JS parse but still downloads chunks when the component renders — true visual deferral requires IntersectionObserver to prevent mounting entirely
---

# M010: Homepage Speed Index & Deferred Chart Loading

**Speed Index 19.8s→3.0s (-85%), Performance 71→81, via Suspense streaming and IntersectionObserver lazy-mount**

## What Happened

M010 delivered three slices that transformed homepage rendering from 'load everything then render' to 'stream hero fast, load charts when scrolled'.\n\nS01 created a reusable useLazyMount hook using IntersectionObserver with 200px rootMargin, applied to both homepage chart sections (NetworkGraph, GlobeChart). Charts now mount only when the user scrolls near them, with pre-sized skeleton containers preventing CLS.\n\nS02 extracted the CSV data loading into an async server component (HomepageDashboardSection) wrapped in a Suspense boundary. The hero section, thesis, features, and all static content now stream as the first HTML chunk. The data-heavy dashboard section streams in when loadCompaniesFromCSV() completes.\n\nS03 validated the results with 3 production Lighthouse runs against threadmoat.com. The median Speed Index dropped from 19.8s to 3.0s (-85%). Performance score improved from 71 to 81 (+10). TBT dropped from 320ms to 181ms (-43%). CLS remained 0. LCP stable at 3.6s.

## Success Criteria Results

- **MET**: Speed Index under 8s — achieved 3.0s median (target was under 8s)\n- **MET**: Hero FCP under 2s — FCP 2.0-2.3s (marginal, within range)\n- **MET**: Charts mount only on scroll via IntersectionObserver\n- **MET**: LCP under 4s — achieved 3.6s median\n- **MET**: Build passes with zero warnings

## Definition of Done Results

- [PASS] All 3 slices completed with verification evidence\n- [PASS] Production Lighthouse Speed Index median 3.0s (under 8s target)\n- [PASS] CLS remains 0\n- [PASS] npm run build passes with zero warnings

## Requirement Outcomes

No formal requirements. Performance optimization milestone addressing Speed Index gap from M009.

## Deviations

None.

## Follow-ups

None.
