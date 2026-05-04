## Problem

`firecrawl-noa-scraper` is failing with `ActionError: Error in action 2: Element not found`. Root cause: it submits a sequence of click/write/click "Actions" against `https://www.miamidade.gov/building/pc-searchnoa.asp`, which **no longer exists** (the URL 404s now — confirmed by direct fetch). All click selectors (`input[name="fldNOA"]`, `input[name="Applicant"]`, `input[name="AdvancedSearch"]`) target a form that is gone. Miami-Dade moved NOA lookup to a JavaScript-heavy SPA that is unreliable to drive via headless click steps.

`search-manufacturer-noas` returns garbage product names like `[] 22-1221.04` because `parseProductName()` strips the NOA number from the title, but Firecrawl search results for `site:miamidade.gov` return titles that are *just* the NOA number, leaving an empty string — which then falls back to `${manufacturer} Product` only if length<3 *after* trim of brackets. The bracket residue (`[]`) survives and gets emitted.

## Fix

### 1. Rewrite `firecrawl-noa-scraper/index.ts` — drop Actions, use Firecrawl Search

Stop trying to drive the broken Miami-Dade form. Instead, use the same proven pattern as `search-manufacturer-noas`: call Firecrawl's `/v2/search` with a `site:miamidade.gov` query for the manufacturer/NOA, get back result URLs + snippets, then run each through Gemini for structured extraction.

Per-step try/catch + structured logs so failures pinpoint which step broke:
```
[firecrawl-noa-scraper] step=search status=ok results=N
[firecrawl-noa-scraper] step=scrape url=<u> status=failed error=<msg>
[firecrawl-noa-scraper] step=ai_extract status=ok records=N
```

Three-step flow:
1. **Search**: `POST /v2/search` with `query: "site:miamidade.gov NOA <searchValue>"`, `limit: 20`, `scrapeOptions: { formats: ['markdown'] }`. Wrap in try/catch; on failure log `step=search` and return 502 with the Firecrawl error message verbatim.
2. **Aggregate**: collect title + url + markdown snippets from each result.
3. **AI extract**: feed combined snippets to Gemini with the existing tool-calling schema. Wrap in try/catch with `step=ai_extract` logging.

For `searchType=noa_number`, query becomes `"site:miamidade.gov NOA <noa_number>"`. For `searchType=category`, query becomes `"site:miamidade.gov NOA <category> approval"`.

Keep PDF URL construction (`/building/library/noa/<noaForUrl>.pdf`) but mark `source_status='crawl_discovered'` so the existing `noa-bulk-downloader` 3-tier rehosting flow validates and rehosts each one.

### 2. Fix `search-manufacturer-noas/index.ts` `parseProductName`

Current bug: regex removes NOA number from title leaving empty brackets `[]` which still pass the `length < 3` check after `.trim()` because brackets aren't whitespace. Fix:
- After all the `.replace()` strips, also strip leftover punctuation: `.replace(/[\[\](){}<>:|;,.\-_\s]+/g, ' ').trim()`
- Then check `length < 3` and fall back to `${manufacturer} Product`.
- Also: if title is literally just an NOA number (matches `/^\d{2}-\d{4}\.\d{2}$/`), skip directly to content extraction or manufacturer fallback.

### 3. Deploy + test

Deploy both functions. Test `firecrawl-noa-scraper` with `{ "manufacturer": "GAF" }` and verify response contains records with non-empty `product_name` and valid `noa_number`.

## Technical notes

- Firecrawl Actions are kept *removed*, not patched. The Miami-Dade form URL returns 404; no selector update will work. Search-based approach is the same one `search-manufacturer-noas` uses successfully.
- Both functions retain existing `Deno.serve`, CORS headers, body-alias parsing, service-role client, job record creation, and product_approvals upsert logic.
- No DB schema changes.

## Files changed
- `supabase/functions/firecrawl-noa-scraper/index.ts` — replace `buildScrapeActions` + scrape call with search-based flow + per-step try/catch logging
- `supabase/functions/search-manufacturer-noas/index.ts` — fix `parseProductName` to strip residual brackets/punctuation and detect bare-NOA titles
