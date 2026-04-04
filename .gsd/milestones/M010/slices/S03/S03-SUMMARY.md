---
id: S03
parent: M010
milestone: M010
provides:
  - Production performance baseline post-M010
requires:
  - slice: S01
    provides: IntersectionObserver lazy-mount
  - slice: S02
    provides: Suspense streaming for hero-first rendering
affects:
  []
key_files:
  - (none)
key_decisions:
  - 3-run median for production measurement
patterns_established:
  - (none)
observability_surfaces:
  - Updated Lighthouse baseline: perf 81, SI 3.0s
drill_down_paths:
  - .gsd/milestones/M010/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-04T04:51:12.325Z
blocker_discovered: false
---

# S03: Production Lighthouse validation — 3-run median

**Speed Index 19.8s→3.0s (-85%), Performance 71→81 (+10), TBT -43%, CLS 0**

## What Happened

Ran 3 production Lighthouse passes against threadmoat.com. Median Speed Index dropped from 19.8s to 3.0s — an 85% improvement driven by Suspense streaming (hero renders before CSV parse) and IntersectionObserver lazy-mount (charts defer until scrolled). Performance score improved from 71 to 81. TBT dropped 43% (320→181ms). CLS remained 0. LCP stable at 3.6s.

## Verification

3 Lighthouse runs, medians computed, before/after documented.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Serverless cold-start causes run-to-run variance (LCP range: 3.5-21.4s). Median smooths this.

## Follow-ups

None.

## Files Created/Modified

None.
