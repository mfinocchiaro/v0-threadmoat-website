# S03: Production Lighthouse validation — 3-run median

**Goal:** Run Lighthouse 3x against production after S01+S02 deploy, capture median Speed Index, document before/after comparison
**Demo:** After this: Production Lighthouse Speed Index median documented, before/after comparison

## Tasks
- [x] **T01: Production Lighthouse: Performance 71→81 (+10), Speed Index 19.8s→3.0s (-85%), TBT 320→181ms (-43%), CLS 0** — Run npx lighthouse https://threadmoat.com 3 times, extract performance metrics, compute medians, compare against M009 S04 baseline (71 performance, 3.7s LCP, 19.8s SI).
  - Estimate: 10min
  - Verify: Results documented with before/after comparison
