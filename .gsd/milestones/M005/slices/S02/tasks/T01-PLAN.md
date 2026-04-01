---
estimated_steps: 54
estimated_files: 6
skills_used: []
---

# T01: Install Vercel AI SDK and create streaming narrative API route

## Description

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

## Inputs

- ``lib/load-companies-server.ts` — CSV company loader to find company by ID`
- ``lib/rate-limit.ts` — rate limiter for aggressive AI call limits`
- ``auth.ts` — NextAuth session auth for API route protection`
- ``lib/company-data.ts` — Company interface with all score/financial/tag fields`
- ``app/api/companies/route.ts` — reference pattern for authenticated API routes`

## Expected Output

- ``package.json` — updated with ai and @ai-sdk/anthropic dependencies`
- ``app/api/ai/narrative/route.ts` — streaming AI narrative endpoint with auth, rate limiting, prompt construction`

## Verification

npm run build && test -f app/api/ai/narrative/route.ts && grep -q 'streamText' app/api/ai/narrative/route.ts && grep -q 'auth()' app/api/ai/narrative/route.ts && grep -q 'rateLimit' app/api/ai/narrative/route.ts
