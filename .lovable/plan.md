# Fix NOA download + scraper input handling

## Problem

**`noa-bulk-downloader`** ignores the `noa_pdf_url` column that already holds working URLs (most pointing to our own `product-approvals` bucket) and instead guesses Miami-Dade URLs like `https://www.miamidade.gov/building/library/noa/<digits>.pdf` — a path pattern that 404s. Result: every row gets marked `needs_manual_upload` even when the PDF is already cached.

**`firecrawl-noa-scraper`** accepts only `searchValue` in the request body. The current admin UI does send `searchValue`, but other callers (and your message) expect `manufacturer` / `noa_number` / `category`. We should accept aliases so both work.

---

## Changes

### 1. Rewrite `supabase/functions/noa-bulk-downloader/index.ts`

Replace the per-row logic with a 3-tier decision tree. For each `product_approvals` row in the batch:

```text
fetch row { id, noa_number, manufacturer, noa_pdf_url, file_url }

if noa_pdf_url is set:
    if it points to THIS project's storage (contains `${SUPABASE_URL}/storage/v1/object/`
       OR contains `/storage/v1/object/public/product-approvals/`):
        → SKIP, count as "already_cached"
        → ensure source_status='verified', is_active=true, file_url mirrors noa_pdf_url
    else (external URL, e.g. miamidade.gov):
        → fetch that URL
        → validate (HTTP 200, content-type pdf/octet-stream, size ≥ 1000 bytes)
        → upload to `product-approvals/noa-pdfs/<sanitized_manufacturer>/<sanitized_noa>.pdf` (upsert)
        → getPublicUrl → update row: noa_pdf_url + file_url = internal URL,
                                     source_status='verified', is_active=true
        → count as "rehosted"
        → on failure: leave row alone, count as "external_fetch_failed", record reason

else (noa_pdf_url is null):
    → run the existing Miami-Dade pattern guesser (HEAD then GET each candidate)
    → on first success: upload + update row (same internal path as above)
    → on total failure: mark source_status='needs_manual_upload',
                        last_source_attempt=now(),
                        source_notes="Auto-sourcing failed after N URL patterns…"
```

Skip-existing query change: instead of filtering by `file_url is null` only, select rows where (`noa_pdf_url is null`) OR (`noa_pdf_url is set AND not pointing to our bucket`) OR (`source_status in (pending, imported, training_extracted, needs_manual_upload)`). When the caller passes `forceRehost: true`, also re-process internal-URL rows (useful if the bucket path was renamed).

Helper to detect "internal" URL:
```ts
const isInternalUrl = (url: string) => {
  if (!url) return false;
  return url.includes(`${SUPABASE_URL}/storage/v1/object/`)
      || url.includes('/storage/v1/object/public/product-approvals/')
      || url.includes('/storage/v1/object/sign/product-approvals/');
};
```

Storage path stays consistent with `download-noa-pdfs`:
```
noa-pdfs/<manufacturer-slug-30char>/<noa-number-with-dots-as-dashes>.pdf
```

Response shape:
```json
{
  "success": true,
  "processed": N,
  "alreadyCached": N,
  "rehosted": N,
  "downloadedFromGuess": N,
  "failed": N,
  "results": [ { productId, noaNumber, action: "skipped|rehosted|guessed|failed", fileUrl?, error? } ]
}
```

Keep 300–500 ms rate-limit between any external fetch (skipped rows incur no delay).

Preserve existing CORS headers, service-role client init, `Deno.serve` style (do NOT switch to `https://deno.land/std/http/server.ts` — the file currently uses it but per project memory native `Deno.serve` is required to avoid bundle timeouts; switch to `Deno.serve(async (req) => { … })`).

### 2. Patch `supabase/functions/firecrawl-noa-scraper/index.ts`

Accept input aliases. After `await req.json()`:

```ts
const body = await req.json();
const params: NoaSearchParams = {
  searchType: body.searchType
    ?? (body.noa_number ? 'noa_number'
      : body.manufacturer ? 'manufacturer'
      : body.category ? 'category'
      : 'manufacturer'),
  searchValue: body.searchValue
    ?? body.manufacturer
    ?? body.noa_number
    ?? body.category
    ?? '',
  category: body.category && body.searchType !== 'category' ? body.category : body.categoryFilter,
  classification: body.classification,
  limit: body.limit,
};
```

No other behavior changes. Keep CORS, AI extraction, and storage logic intact.

---

## Files touched

- `supabase/functions/noa-bulk-downloader/index.ts` — full rewrite of per-row loop + query
- `supabase/functions/firecrawl-noa-scraper/index.ts` — body parsing block only

## Out of scope

- No DB schema changes
- No admin-UI changes (existing `NoaSearchTab` already sends `searchValue` correctly)
- `download-noa-pdfs` stays as-is (it already does the external→internal rehost path correctly for Miami-Dade-only rows)

## Verification after deploy

1. Call `noa-bulk-downloader` with `{ limit: 5 }` and confirm response shows `alreadyCached > 0` for rows whose `noa_pdf_url` already points to `product-approvals/noa-pdfs/...`.
2. Spot-check one row that previously was marked `needs_manual_upload` despite having a populated `noa_pdf_url` — it should now flip to `verified` without any external fetch.
3. Call `firecrawl-noa-scraper` with `{ "manufacturer": "GAF" }` (no `searchValue`) and confirm it runs instead of returning `searchValue is required`.
