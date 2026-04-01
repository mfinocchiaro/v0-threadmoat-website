# S02: AI Narrative Engine for Report Generator

**Goal:** Report generator produces AI-generated narrative sections (Impressions, Conclusions, Beware, Overlooked Opportunities) for selected companies using Claude via Vercel AI SDK streaming.
**Demo:** After this: Report generator produces AI-generated sections: Impressions, Conclusions, Beware, Overlooked Opportunities for selected companies.

## Tasks
- [x] **T01: Installed ai@6.0.142 + @ai-sdk/anthropic@3.0.64 and created authenticated, rate-limited streaming narrative endpoint at /api/ai/narrative** — ## Description

Install `ai` and `@ai-sdk/anthropic` packages. Create a new streaming API route at `app/api/ai/narrative/route.ts` that:
1. Authenticates the request via `auth()` from `@/auth`
2. Rate-limits to 10 requests/hour per user via `rateLimit()` from `@/lib/rate-limit`
3. Accepts `{ companyId: string }` in the POST body
4. Loads all companies from CSV, finds the requested company by ID
5. Constructs a domain-expert system prompt and a company-data user prompt with all 7 score dimensions (with justifications), strengths, weaknesses, financials, industry tags, differentiation tags, known customers, and competitive positioning
6. Calls `streamText()` with `anthropic('claude-sonnet-4-5')` (or `claude-3-5-sonnet-20241022` if the latest model string isn't available) and returns `result.toUIMessageStreamResponse()`
7. Sets `export const maxDuration = 60` for Vercel serverless timeout

The prompt must instruct the model to produce four clearly labeled markdown sections: **Impressions**, **Conclusions**, **Beware**, and **Overlooked Opportunities**. The system prompt should establish the persona of a senior investment analyst specializing in industrial technology startups.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Anthropic API | Return 500 with `{ error: 'AI generation failed' }` + console.error with details | maxDuration=60 handles serverless timeout; streamText has no explicit timeout — Anthropic's own timeout applies | streamText handles protocol; if model returns unexpected format, client displays raw text (acceptable) |
| CSV loading | Return 500 with `{ error: 'Failed to load company data' }` | File system read — effectively instant | Return 404 if company ID not found in loaded data |
| Auth (NextAuth) | Return 401 `{ error: 'Unauthorized' }` | Session check is fast — no timeout concern | N/A |
| Rate limiter (Upstash/memory) | Fail open (existing behavior in lib/rate-limit.ts) | Fail open | N/A |

## Load Profile

- **Shared resources**: Upstash Redis for rate limiting (shared across all API routes), Anthropic API (pay-per-token)
- **Per-operation cost**: 1 Redis call (rate limit check) + 1 CSV file read (~3.5MB) + 1 Anthropic API call (~2K input tokens, ~1K output tokens, ~$0.01-0.03)
- **10x breakpoint**: Anthropic API cost — 10 concurrent users generating narratives = ~$0.30/burst. Rate limit of 10/hour/user prevents runaway costs. CSV re-parse per request is acceptable at this scale.

## Negative Tests

- **Malformed inputs**: Missing companyId → 400 error. Non-existent companyId → 404. Empty string companyId → 400.
- **Error paths**: No ANTHROPIC_API_KEY → 500 with clear error message. Rate limit exceeded → 429 with retryAfterMs.
- **Boundary conditions**: Company with minimal data (empty strings for optional fields) → prompt still works with available data.

## Steps

1. Run `npm install ai @ai-sdk/anthropic` to add Vercel AI SDK dependencies
2. Create `app/api/ai/narrative/route.ts` with the POST handler following the established pattern from `app/api/companies/route.ts` (auth → rate limit → business logic → response)
3. Implement company lookup: load CSV via `loadCompaniesFromCSV()`, find by `companyId` matching `company.id`, return 404 if not found
4. Build the system prompt: senior industrial-tech investment analyst persona, instructions to produce four markdown sections (## Impressions, ## Conclusions, ## Beware, ## Overlooked Opportunities)
5. Build the user prompt: structured company data including name, location, founded, headcount, all 7 scores with justifications, strengths, weaknesses, financial data (funding, revenue, valuation), industry tags, differentiation tags, known customers, lifecycle phase, investment list
6. Call `streamText({ model: anthropic('claude-sonnet-4-5'), system, prompt, maxTokens: 2000 })` and return `result.toUIMessageStreamResponse()`
7. Add input validation: check companyId is a non-empty string, return 400 with descriptive error if invalid
8. Verify: `npm run build` passes with no type errors

## Must-Haves

- [ ] `ai` and `@ai-sdk/anthropic` packages installed
- [ ] POST route at `/api/ai/narrative` with auth + rate limiting
- [ ] Company lookup from CSV by ID with 404 handling
- [ ] Domain-expert prompt producing four labeled sections
- [ ] Streaming response via `streamText` + `toUIMessageStreamResponse()`
- [ ] `maxDuration = 60` export for Vercel timeout
- [ ] Input validation returning 400/401/404/429 as appropriate
- [ ] `npm run build` passes

## Verification

- `npm run build` passes with no type errors
- `test -f app/api/ai/narrative/route.ts`
- `grep -q 'streamText' app/api/ai/narrative/route.ts`
- `grep -q 'auth()' app/api/ai/narrative/route.ts`
- `grep -q 'rateLimit' app/api/ai/narrative/route.ts`
- `grep -q 'maxDuration' app/api/ai/narrative/route.ts`

## Observability Impact

- Signals added: `console.error` with structured context on auth rejection, rate limit hit, company-not-found, and LLM generation failure
- How a future agent inspects this: Server logs show `[ai/narrative]` prefixed errors with userId, companyId, and error type
- Failure state exposed: HTTP status codes (400/401/404/429/500) with JSON error bodies describing the specific failure
  - Estimate: 45m
  - Files: package.json, app/api/ai/narrative/route.ts, lib/load-companies-server.ts, lib/rate-limit.ts, auth.ts, lib/company-data.ts
  - Verify: npm run build && test -f app/api/ai/narrative/route.ts && grep -q 'streamText' app/api/ai/narrative/route.ts && grep -q 'auth()' app/api/ai/narrative/route.ts && grep -q 'rateLimit' app/api/ai/narrative/route.ts
- [ ] **T02: Wire streaming AI narrative UI into report generator** — ## Description

Integrate the `/api/ai/narrative` streaming endpoint into the existing `IntelligenceReportTab` component in `components/charts/report-generator.tsx`. Add a new 'AI Analysis' button next to the existing 'Generate Intelligence' button. When clicked with a company selected, it calls the AI endpoint via `useCompletion` from `@ai-sdk/react` and streams the narrative into a new styled section below the existing template report output.

The AI narrative section should:
- Show a loading/streaming indicator while generating
- Render the streamed markdown with proper heading formatting (the four sections: Impressions, Conclusions, Beware, Overlooked Opportunities)
- Include a Stop button to abort generation mid-stream
- Show error messages for rate limiting, auth failures, and generation errors
- Be clearly visually distinct from the template report (different background, "AI Analysis" header with Sparkles icon)
- Include a Copy button for the completed narrative
- Not replace or interfere with the existing template report functionality

Use `useCompletion` from `@ai-sdk/react` with `api: '/api/ai/narrative'` and programmatic `complete()` call (not form-based). The `body` option passes `{ companyId }`. The `completion` string contains the accumulated streamed text. Use `status` to detect streaming state and `stop()` to abort.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| /api/ai/narrative | Display error message from response body. useCompletion's `onError` callback handles this. | Streaming timeout handled by server's maxDuration. Client shows 'Generation timed out' if fetch fails. | Raw text displayed as-is — markdown parsing is best-effort |

## Negative Tests

- **Error paths**: Rate limit 429 → shows 'Rate limit exceeded, try again later' message. Auth failure 401 → shows 'Please sign in'. No company selected → button disabled.
- **Boundary conditions**: Very long narrative → scrollable container. Empty narrative (model returns nothing) → shows 'No analysis generated' message.

## Steps

1. Add `import { useCompletion } from '@ai-sdk/react'` to report-generator.tsx
2. In `IntelligenceReportTab`, add `useCompletion` hook configured with `api: '/api/ai/narrative'` and `onError` handler that parses the error response
3. Add state for `aiError` to display error messages
4. Add an 'AI Analysis' button (with Sparkles icon and distinct styling, e.g. violet/purple gradient) next to the existing 'Generate Intelligence' button. Disabled when no company selected or when streaming.
5. Wire button onClick to call `complete('', { body: { companyId: selectedCompany.id } })` — the prompt content is server-side, so client sends empty prompt with companyId in body
6. Add AI narrative output section below the existing template report output: a styled card with 'AI Analysis' header, the streamed `completion` text rendered with basic markdown formatting (split on `## ` for section headers), a Copy button, and a Stop button visible during streaming
7. Add loading state: while `status === 'submitted' || status === 'streaming'`, show a pulsing indicator and the Stop button
8. Ensure existing 'Generate Intelligence' template report still works unchanged
9. Verify: `npm run build` passes with no type errors

## Must-Haves

- [ ] `useCompletion` hook wired to `/api/ai/narrative`
- [ ] AI Analysis button with distinct styling, disabled when no company selected
- [ ] Streaming narrative display with basic markdown section formatting
- [ ] Stop button during streaming
- [ ] Error display for rate limit, auth, and generation failures
- [ ] Copy button for completed narrative
- [ ] Existing template reports unaffected
- [ ] `npm run build` passes

## Verification

- `npm run build` passes with no type errors
- `grep -q 'useCompletion' components/charts/report-generator.tsx`
- `grep -q 'ai/narrative' components/charts/report-generator.tsx`
- `grep -q 'AI Analysis' components/charts/report-generator.tsx`
- `grep -q 'stop()' components/charts/report-generator.tsx`

## Inputs

- `app/api/ai/narrative/route.ts` — the streaming endpoint created in T01
- `components/charts/report-generator.tsx` — existing report generator component to augment

## Expected Output

- `components/charts/report-generator.tsx` — updated with useCompletion hook, AI Analysis button, streaming display, error handling, and stop functionality
  - Estimate: 45m
  - Files: components/charts/report-generator.tsx
  - Verify: npm run build && grep -q 'useCompletion' components/charts/report-generator.tsx && grep -q 'ai/narrative' components/charts/report-generator.tsx
