# M007: 

## Vision
Make every chart in the dashboard legible on both light and dark themes by replacing 160+ hardcoded dark-mode color values with CSS custom properties, and commit the latest Airtable data export so the production site has fresh data.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Theme-aware colors for D3 SVG charts (batch 1: 13 charts) | low | — | ✅ | 13 D3 charts have legible axes and tooltips on both light and dark themes |
| S02 | Theme-aware colors for remaining charts (batch 2: 13 charts incl. 3D) | medium | S01 | ⬜ | All remaining charts including 3D/WebGL have legible text on both themes |
| S03 | Data sync and M006 cleanup | low | — | ⬜ | Production site has fresh Airtable data. M006 annotated as superseded. |
