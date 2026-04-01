---
estimated_steps: 48
estimated_files: 1
skills_used: []
---

# T02: Wire streaming AI narrative UI into report generator

## Description

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

## Inputs

- ``app/api/ai/narrative/route.ts` — streaming endpoint created in T01`
- ``components/charts/report-generator.tsx` — existing report generator component (~978 lines) with IntelligenceReportTab sub-component`

## Expected Output

- ``components/charts/report-generator.tsx` — updated with useCompletion hook, AI Analysis button, streaming narrative display, error handling, stop functionality`

## Verification

npm run build && grep -q 'useCompletion' components/charts/report-generator.tsx && grep -q 'ai/narrative' components/charts/report-generator.tsx
