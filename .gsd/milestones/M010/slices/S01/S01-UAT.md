# S01: Intersection Observer lazy-mount for homepage charts — UAT

**Milestone:** M010
**Written:** 2026-04-03T23:18:28.271Z

## UAT: Lazy-mount homepage charts\n\n### Test 1: Build passes\n- [ ] `npm run build` exits 0\n\n### Test 2: Hero renders first\n- [ ] Homepage hero section visible immediately on load\n- [ ] Chart area below shows skeleton placeholders\n\n### Test 3: Charts mount on scroll\n- [ ] Scrolling down triggers chart rendering\n- [ ] No visible layout shift (CLS 0)\n- [ ] No jarring skeleton flash (200px early trigger)
