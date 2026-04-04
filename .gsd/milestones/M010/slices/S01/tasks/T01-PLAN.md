---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T01: Create useLazyMount hook and apply to homepage charts

1. Create a reusable useLazyMount hook in hooks/use-lazy-mount.ts that uses IntersectionObserver to detect when a container enters the viewport. Returns { ref, hasBeenVisible } — the component only mounts children when hasBeenVisible is true.

2. In components/homepage/homepage-dashboard.tsx, wrap both chart sections (NetworkGraph and GlobeChart) with the hook. Show skeleton placeholders until the section scrolls into view. Use pre-sized containers (h-[450px] for network, h-[500px] for globe) to prevent CLS.

3. Set rootMargin to '200px' so charts start loading slightly before they're visible (no jarring pop-in).

## Inputs

- `components/homepage/homepage-dashboard.tsx`

## Expected Output

- `hooks/use-lazy-mount.ts`
- `components/homepage/homepage-dashboard.tsx with lazy-mount wrappers`

## Verification

npm run build passes. Browser test: homepage hero renders immediately, charts show skeleton until scrolled near.
