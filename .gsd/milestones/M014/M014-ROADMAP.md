# M014: Authenticated Dashboard Lighthouse & Performance Testing

## Vision
Capture Lighthouse performance scores for auth-gated dashboard pages using Playwright-based perf testing with cookie injection. Establish a repeatable performance testing pipeline for the dashboard.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Playwright-based authenticated Lighthouse pipeline | medium | — | ⬜ | Script logs into dashboard, captures Lighthouse scores for a configurable list of pages |
| S02 | Dashboard page performance baseline — 5+ pages | low | S01 | ⬜ | Lighthouse scores documented for 5+ representative dashboard pages with analysis |
