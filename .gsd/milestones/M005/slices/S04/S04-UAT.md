# S04: Custom Report Builder — UAT

**Milestone:** M005
**Written:** 2026-04-02T06:03:55.782Z

# S04 UAT: Custom Report Builder

## Preconditions
- Application running locally or on Vercel
- User authenticated with Analyst or Strategist tier
- At least 2 companies previously added to shortlist (via S03 shortlist feature)
- Dashboard loaded with company data visible in charts

---

## Test 1: Tab Visibility and Navigation

1. Navigate to the dashboard Report Generator section
2. **Expected:** Four tabs visible: "Overview", "Company Deep Dive", "Comparative Analysis", "Custom Report"
3. Click "Custom Report" tab
4. **Expected:** Custom Report configuration view loads with company selection area, section toggles, and Generate button

## Test 2: Company Selection Pre-population from Shortlist

1. Open the Custom Report tab
2. **Expected:** Companies previously added to shortlist appear as selected chips
3. Click the X on one company chip
4. **Expected:** Company removed from selection
5. Click "Reset to Shortlist" button
6. **Expected:** Selection restored to match current shortlist

## Test 3: Typeahead Company Search

1. In the Custom Report tab, type a partial company name in the search input
2. **Expected:** Dropdown shows matching companies from the full dataset (not just shortlisted)
3. Click a company from the dropdown
4. **Expected:** Company added as a selected chip
5. Type a name that doesn't match any company
6. **Expected:** No results shown, no error

## Test 4: Section Toggle Defaults and AI Warning

1. Open the Custom Report tab fresh
2. **Expected:** Company Profile and Score Breakdown checked by default; AI Analysis unchecked; all chart toggles unchecked
3. Check the AI Analysis checkbox
4. **Expected:** Warning text appears: "Uses 1 AI generation per company (10/hour limit)"
5. Uncheck AI Analysis
6. **Expected:** Warning text disappears

## Test 5: Generate Button State

1. Remove all selected companies (clear all)
2. **Expected:** Generate button is disabled
3. Add at least one company
4. **Expected:** Generate button becomes enabled
5. Click Generate
6. **Expected:** View transitions from configuration to preview mode

## Test 6: Report Preview — Text Sections

1. Select 2 companies, enable Company Profile and Score Breakdown, disable AI Analysis
2. Click Generate
3. **Expected:** Preview pane shows formatted content for both companies: company headers, profile information (location, founded, lifecycle, funding), score breakdown with 7 dimensions and justifications
4. Verify both companies have complete sections
5. **Expected:** No loading spinners (AI not enabled)

## Test 7: AI Narrative Fetching with Status Badges

1. Select 2 companies, enable AI Analysis
2. If prompted about rate limit (because count > 5), confirm
3. Click Generate
4. **Expected:** Per-company status badges show: spinner/loading for the company currently being fetched
5. Wait for first company to complete
6. **Expected:** First company shows checkmark/complete badge, second company starts loading
7. Wait for both to complete
8. **Expected:** AI narrative sections (Impressions, Conclusions, Beware, Overlooked Opportunities) appear under each company

## Test 8: AI Narrative Caching

1. After Test 7 completes, click "Back to Configuration"
2. Click Generate again with the same companies and AI Analysis enabled
3. **Expected:** AI narratives appear immediately (no loading spinners) — cached from previous generation
4. Add a new (third) company and re-generate
5. **Expected:** Previously cached companies load instantly; only the new company shows loading spinner

## Test 9: Rate Limit Confirmation

1. Select 6 or more companies with AI Analysis enabled
2. Click Generate
3. **Expected:** Confirmation modal appears warning about AI generation count ("This will use N of your 10 AI generations per hour")
4. Cancel the confirmation
5. **Expected:** No generation starts, stays in configure mode
6. Confirm
7. **Expected:** Generation proceeds with sequential AI fetching

## Test 10: Copy to Clipboard

1. Generate a report with at least 1 company and Company Profile enabled
2. Click "Copy Markdown" button in the preview pane
3. Paste into a text editor
4. **Expected:** Valid markdown with company headers, profile data, and any enabled sections. Markdown is well-formed with ## headings, bullet lists, and bold text.

## Test 11: PDF Export — Text Only

1. Generate a report with 2 companies, Company Profile and Score Breakdown enabled, no charts, no AI
2. Click "Export PDF" button
3. **Expected:** Loading spinner appears on button during generation
4. **Expected:** PDF file downloads (threadmoat-report.pdf)
5. Open the PDF
6. **Expected:** Cover page with "ThreadMoat Custom Report" title, date, company count. Per-company pages with formatted profile text and score breakdown. Headings rendered in larger bold font, bullet points indented.

## Test 12: PDF Export — With Charts

1. Generate a report with 2 companies, enable Bubble Chart and Quadrant Chart sections
2. Click "Export PDF"
3. **Expected:** Brief delay while charts render offscreen and are captured
4. **Expected:** PDF includes chart images (Bubble Chart and Quadrant Chart) embedded at readable size
5. Charts should show the selected companies' data points

## Test 13: PDF Page Break Handling

1. Select 5+ companies with all text sections enabled
2. Generate and export PDF
3. **Expected:** PDF has multiple pages with proper page breaks — no text overflow or overlapping content between pages

## Edge Cases

### Edge 1: Single Company Report
1. Select exactly 1 company with all sections enabled
2. Generate and export PDF
3. **Expected:** Clean single-company report without multi-company edge case artifacts

### Edge 2: Chart Capture Failure Graceful Degradation
1. If a chart fails to render (e.g., due to data issues), the PDF should still generate
2. **Expected:** Warning in console, chart section skipped, text sections still present

### Edge 3: No Sections Selected
1. Uncheck all section toggles
2. **Expected:** Generate button should still work (report may be minimal), or Generate is disabled if no sections selected
