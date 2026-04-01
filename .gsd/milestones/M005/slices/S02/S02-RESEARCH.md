# S02 — AI Narrative Engine for Report Generator — Research

**Date:** 2026-04-01

## Summary

The existing report generator (`components/charts/report-generator.tsx`, ~600 lines) is entirely client-side template string concatenation. Three tabs exist: IC Memos (company cards with score breakdowns), Intelligence Reports (single-company templated text), and Scenario Reports (multi-company comparison tables with hardcoded narrative functions). None involve AI — the "Generate Intelligence" button just runs `generateReport()` which concatenates company fields into a plaintext string.

The slice goal is to add AI-generated narrative sections: **Impressions, Conclusions, Beware, Overlooked Opportunities** for selected companies. The Vercel AI SDK (`ai` + `@ai-sdk/anthropic` or `@ai-sdk/openai`) is the natural choice — it provides `streamText` for server-side streaming, `useCompletion` for client-side consumption, and structured output via `Output.object()` with Zod schemas. Both `ANTHROPIC_API_KEY` and `OPEN_AI_KEY` are already configured in `.env`.

The architecture is: client selects company(ies) → calls a new `/api/ai/narrative` route → server loads the company data from CSV, builds a domain-expert prompt with the company's scores/justifications/strengths/weaknesses/financials, and streams the narrative back. Rate limiting and auth follow established patterns (every existing API route uses `auth()` + `rateLimit()`). The report generator component adds a new "AI Narrative" section below the existing template output, showing streamed markdown as it arrives.

## Recommendation

Use Vercel AI SDK with **streaming** (`streamText` + `useCompletion`) rather than `generateText`. Streaming gives immediate user feedback for what will be a 3-10 second generation. Use the Anthropic provider (`@ai-sdk/anthropic`) as primary since Claude excels at structured analytical writing — OpenAI as fallback is straightforward to swap via the provider-agnostic model string.

Build the API route first (proves the LLM integration works), then wire the client-side streaming UI. The four narrative sections (Impressions, Conclusions, Beware, Overlooked Opportunities) should be generated in a single prompt with clear section headers — not four separate API calls. The prompt should include all relevant company data fields as structured context.

Keep the existing template reports as-is. The AI narrative is an additive enhancement — a new section or tab, not a replacement.

## Implementation Landscape

### Key Files

- `components/charts/report-generator.tsx` — Main report generator component (~600 lines). Three tabs: IC Memos, Intelligence Reports, Scenario Reports. The `IntelligenceReportTab` and `ScenarioReportTab` sub-components are where AI narrative output should appear. Both already have `reportOutput` state and a `<pre>` display area.
- `app/api/companies/route.ts` — Existing pattern for authenticated API routes: `auth()` check → `rateLimit()` → `loadCompaniesFromCSV()` → response. The AI narrative route should follow this exact pattern.
- `lib/load-companies-server.ts` — Server-side CSV→Company parser. The AI route will use this to load a specific company's full data for the prompt.
- `lib/rate-limit.ts` — Upstash Redis rate limiter with in-memory fallback. AI calls should be rate-limited more aggressively (e.g., 10/hour per user vs 30/minute for data).
- `lib/tiers.ts` — Access tier system. Reports page is in `ADMIN_PATHS`. Decide whether AI narratives should stay admin-only or extend to Strategist tier.
- `auth.ts` — NextAuth v5 config. All API routes use `const session = await auth()` for auth.
- `lib/company-data.ts` — `Company` interface (100+ fields including 7 score dimensions with justifications, strengths, weaknesses, financials, tags, industries, investors).
- `package.json` — Currently has no AI dependencies. Needs `ai`, `@ai-sdk/anthropic` (and optionally `@ai-sdk/openai`).

### Build Order

1. **Install dependencies + create API route** (highest risk — proves LLM integration works on this stack). Install `ai` and `@ai-sdk/anthropic`. Create `app/api/ai/narrative/route.ts` with auth, rate limiting, company data lookup, prompt construction, and streaming response. Test with curl.

2. **Wire client-side streaming UI** into `report-generator.tsx`. Add `useCompletion` hook (or direct fetch + ReadableStream) to call the new endpoint. Display streaming narrative in a new section below the existing template report output. This naturally fits inside the existing `IntelligenceReportTab` — after clicking "Generate Intelligence", the AI narrative section streams in below the template report.

3. **Prompt engineering and narrative quality**. Refine the system prompt to produce investment-analyst-grade Impressions, Conclusions, Beware, and Overlooked Opportunities sections. The prompt has rich context: 7 scored dimensions with justifications, strengths/weaknesses text, financial data, industry tags, differentiation tags, known customers, and competitive positioning.

### Verification Approach

- **API route**: `curl -X POST http://localhost:3000/api/ai/narrative -H "Content-Type: application/json" -d '{"companyId":"..."}' --cookie "..."` — should stream text back. Verify auth rejection without session, rate limit rejection on rapid calls.
- **UI integration**: Open dashboard → Reports → Intelligence Reports → select company → Generate → AI narrative streams below the template report.
- **Error handling**: Verify graceful degradation when API key is missing, when rate limit is hit, when company not found.
- **Build**: `npm run build` passes with no type errors.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| LLM streaming + client hooks | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | Handles SSE streaming, backpressure, abort signals, React hooks — battle-tested on Next.js |
| Rate limiting | Existing `lib/rate-limit.ts` (Upstash Redis) | Already configured and used by every API route |
| Auth verification | Existing `auth()` from `auth.ts` | NextAuth v5 JWT session — consistent with all other routes |
| Structured output validation | Zod (already in dependencies) | AI SDK's `Output.object()` uses Zod schemas for typed generation |

## Constraints

- **Reports page is admin-only** (`ADMIN_PATHS` in `lib/tiers.ts`). AI narratives inherit this gating — no additional tier check needed in the API route beyond auth, unless the decision is made to open reports to Strategist tier.
- **API keys in `.env` only** — `ANTHROPIC_API_KEY` and `OPEN_AI_KEY` exist but are NOT in `.env.local`. The API route should read from `process.env.ANTHROPIC_API_KEY` (or `OPEN_AI_KEY`). Vercel deployment needs these set in project env vars.
- **Vercel serverless timeout** — free tier is 10s, Pro is 60s. AI generation can take 5-15s. Need `export const maxDuration = 60` on the route. Streaming helps — first tokens arrive in ~1s even if full generation takes 10s.
- **Company data is loaded from CSV on each request** via `loadCompaniesFromCSV()`. For the AI route, we need to find a specific company by ID. The existing function loads all companies, so we filter in-memory. This is acceptable — the CSV is ~3.5MB and parsing is fast.
- **No database persistence of AI outputs** — generated narratives are ephemeral (stream to client, not stored). This keeps the slice simple; persistence is a future concern for S04 (Custom Report Builder).

## Common Pitfalls

- **Streaming + Edge Runtime** — The AI SDK supports Edge but `auth()` (NextAuth v5 with Neon DB queries) requires Node runtime. Decision D-already-made: "Used Node runtime instead of Edge for getTranslations compatibility." The AI route must also use Node runtime. Add `export const runtime = 'nodejs'` if needed.
- **Prompt too large** — Sending ALL 600 companies' data would blow the context window. The route should accept a single `companyId` (or array of IDs for scenario mode) and only include selected companies' data in the prompt. For scenario mode with 2-5 companies, total prompt stays well under 8K tokens.
- **useCompletion vs direct fetch** — `useCompletion` expects the AI SDK's streaming protocol. If using `streamText(...).toTextStreamResponse()`, the client should use `useCompletion`. If using `toUIMessageStreamResponse()`, use `useChat`. For a one-shot narrative (not conversational), `useCompletion` + `toTextStreamResponse()` is the right pairing.

## Open Risks

- **API cost visibility** — Each narrative generation costs ~$0.01-0.05 depending on model and tokens. No usage tracking exists. For admin-only access this is fine; if opened to paying subscribers, usage tracking should be added.
- **Prompt quality** — The narrative quality depends heavily on prompt engineering. The rich company data (scores, justifications, financials) provides excellent context, but the prompt needs iteration. First version may need refinement based on output quality.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Vercel AI SDK | `vercel/ai@ai-sdk` (14.7K installs) | available — not installed |
| Anthropic Claude | (covered by AI SDK skill above) | — |

## Sources

- Vercel AI SDK docs: `streamText`, `generateText`, `useCompletion`, `Output.object()` patterns (via Context7 `/vercel/ai`)
- Existing codebase patterns: auth, rate limiting, CSV loading, tier system
