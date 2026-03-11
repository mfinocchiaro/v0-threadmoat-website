---
type: project-reference
project: ThreadMoat / Vizera
date: 2026-03-06
status: active
---

# ThreadMoat Website - Project Reference

## Overview

Next.js web application for the **Vizera** startup analytics dashboard — the visual front-end for Michael Finocchiaro's 550+ AI startup database.

## Technology Stack

- **Framework**: Next.js (React)
- **Hosting**: Vercel
- **Auth**: Supabase (sign-up, login)
- **Styling**: Tailwind CSS
- **Charts**: Custom D3-based visualizations

## Dashboard Views

| View | Description |
|------|-------------|
| Bar Chart | Funding by category |
| Box Plot | Distribution analysis |
| Bubble / Network | Startup ecosystem map |
| Correlation | Cross-metric analysis |
| Distribution | Market segment distribution |
| Investor Stats | VC/investor analytics |
| Investor Views | Investor-focused dashboards |
| Map (3D Globe) | Geographic distribution |
| Marimekko | Market share visualization |
| Parallel Coordinates | Multi-dimension comparison |
| Periodic Table | Startup landscape |
| Quadrant | Magic quadrant positioning |
| Sankey | Flow/relationship diagrams |
| Slope Chart | Trend comparison |
| Spiral | Timeline visualization |
| SPLOM | Scatter plot matrix |
| Compare | Side-by-side startup comparison |

## Key Features

- **Thesis context** system for filtered views
- **Filter context** for dynamic chart filtering
- Logo library for 50+ tracked startups (in `vizera-main/charts/logos/`)
- Settings/profile management
- Role-based access (startup coupon codes, paid VC access planned)

## File Structure

```
v0-threadmoat-website-main/
├── app/
│   ├── auth/ (login, sign-up, error pages)
│   └── dashboard/ (all chart views + settings)
├── contexts/ (thesis-context, filter-context)
└── vizera-main/charts/logos/ (company logos)
```

## Related

- Mentioned in meetings with [[Raven - Meeting Notes|Raven]], [[Zoo - Meeting Notes|Zoo]], [[Digital CNC - Meeting Notes|Digital CNC]]
- Database source: Airtable (550+ startups, 45 columns)
