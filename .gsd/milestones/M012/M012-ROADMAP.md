# M012: Dashboard Analytics & Usage Tracking

## Vision
Add lightweight, privacy-respecting analytics to understand which dashboard pages and charts users visit most, where they drop off, and which features drive engagement. Use a simple approach — no heavy third-party SDK.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Lightweight page view tracking via API route + DB | low | — | ⬜ | Every dashboard page navigation logs a page view event with route, user tier, and timestamp to the database |
| S02 | Chart interaction event tracking | low | S01 | ⬜ | Filter applied, shortlist toggle, and AI narrative generation events logged with context |
