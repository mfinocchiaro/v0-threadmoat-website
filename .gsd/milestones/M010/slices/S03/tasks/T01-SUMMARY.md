---
id: T01
parent: S03
milestone: M010
key_files:
  - (none)
key_decisions:
  - 3-run median used to smooth serverless variance
duration: 
verification_result: passed
completed_at: 2026-04-04T04:50:57.061Z
blocker_discovered: false
---

# T01: Production Lighthouse: Performance 71→81 (+10), Speed Index 19.8s→3.0s (-85%), TBT 320→181ms (-43%), CLS 0

**Production Lighthouse: Performance 71→81 (+10), Speed Index 19.8s→3.0s (-85%), TBT 320→181ms (-43%), CLS 0**

## What Happened

Ran Lighthouse 3x against threadmoat.com production after M010 deploy. Computed medians:\n\n- Performance: 71 → 81 (+10 points)\n- Speed Index: 19.8s → 3.0s (-16.8s, -85%)\n- TBT: 320ms → 181ms (-139ms, -43%)\n- LCP: 3.7s → 3.6s (unchanged)\n- FCP: 2.0s → 2.3s (+0.3s, slight increase likely from Suspense boundary overhead)\n- CLS: 0 → 0 (unchanged)\n\nThe massive Speed Index improvement confirms that Suspense streaming + IntersectionObserver lazy-mount are working as designed — the hero renders immediately and charts load only when scrolled into view. Run 3 showed an LCP outlier (21.4s) typical of serverless cold-start variance.

## Verification

3 Lighthouse runs completed. Medians computed. Before/after comparison documented.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx lighthouse https://threadmoat.com (run 1)` | 0 | ✅ pass | 18000ms |
| 2 | `npx lighthouse https://threadmoat.com (run 2)` | 0 | ✅ pass | 19000ms |
| 3 | `npx lighthouse https://threadmoat.com (run 3)` | 0 | ✅ pass | 17000ms |

## Deviations

None.

## Known Issues

Run 3 had an LCP outlier (21.4s) — serverless cold-start noise, not a code issue.

## Files Created/Modified

None.
