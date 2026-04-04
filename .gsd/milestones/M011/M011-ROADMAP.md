# M011: Mobile Responsive Dashboard

## Vision
Make the dashboard usable on tablet and mobile by adding a collapsible sidebar with hamburger menu, ensuring chart containers resize correctly, and fixing any layout overflow issues across the 52 dashboard pages.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Responsive sidebar — Sheet on mobile with hamburger toggle | medium | — | ⬜ | Dashboard sidebar collapses to a Sheet/Drawer on mobile with a hamburger button in the top bar |
| S02 | Chart container overflow fixes for mobile | low | S01 | ⬜ | Chart pages render without horizontal scroll at 375px viewport |
| S03 | Mobile visual verification across page types | low | S01, S02 | ⬜ | Visual spot-check at 375px for representative pages documented |
