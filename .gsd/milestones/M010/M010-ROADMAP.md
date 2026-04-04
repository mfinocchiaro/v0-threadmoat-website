# M010: Homepage Speed Index & Deferred Chart Loading

## Vision
Improve the homepage Speed Index from ~20s to under 5s by deferring below-the-fold chart rendering via Intersection Observer and streaming the hero section before data-heavy charts. Move from 'load everything then render' to 'render hero fast, load charts when scrolled into view'.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Intersection Observer lazy-mount for homepage charts | low | — | ✅ | Homepage charts (NetworkGraph, GlobeChart) only mount when scrolled into the viewport. Skeleton placeholders visible until then. |
| S02 | Defer CSV data loading — hero-first rendering | medium | S01 | ✅ | Homepage hero section renders before loadCompaniesFromCSV completes. Company data streams in for the dashboard section. |
| S03 | Production Lighthouse validation — 3-run median | low | S01, S02 | ✅ | Production Lighthouse Speed Index median documented, before/after comparison |
