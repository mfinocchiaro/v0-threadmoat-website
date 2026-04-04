# S01: Intersection Observer lazy-mount for homepage charts

**Goal:** Wrap the two homepage chart sections in an IntersectionObserver hook that delays component mounting until the container is visible in the viewport
**Demo:** After this: Homepage charts (NetworkGraph, GlobeChart) only mount when scrolled into the viewport. Skeleton placeholders visible until then.

## Tasks
- [x] **T01: Created useLazyMount hook with IntersectionObserver and applied to both homepage charts — they now mount only when scrolled into viewport** — 1. Create a reusable useLazyMount hook in hooks/use-lazy-mount.ts that uses IntersectionObserver to detect when a container enters the viewport. Returns { ref, hasBeenVisible } — the component only mounts children when hasBeenVisible is true.

2. In components/homepage/homepage-dashboard.tsx, wrap both chart sections (NetworkGraph and GlobeChart) with the hook. Show skeleton placeholders until the section scrolls into view. Use pre-sized containers (h-[450px] for network, h-[500px] for globe) to prevent CLS.

3. Set rootMargin to '200px' so charts start loading slightly before they're visible (no jarring pop-in).
  - Estimate: 15min
  - Files: hooks/use-lazy-mount.ts, components/homepage/homepage-dashboard.tsx
  - Verify: npm run build passes. Browser test: homepage hero renders immediately, charts show skeleton until scrolled near.
