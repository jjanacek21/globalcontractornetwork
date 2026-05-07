## Two issues, one plan

### Issue A — 62 Miami-Dade docs won't preview (Source + Smart Doc both fail)

Map-discovered rows have `storage_path = null`, `is_downloaded = false`, and `file_url = https://miamidade.gov/.../noa/22122104.pdf`. The smart-doc converter then wrote that external URL into `permit_form_templates.file_path`, and `viewSmartDoc()` calls `createSignedUrl(<https-url>)` on storage → fails. `viewSourceDoc()` falls back to `source_url` (an HTML landing page) → `pdf-proxy` returns 422.

### Issue B — Every other building department says "Something went wrong" on Crawl

`firecrawl-permit-docs-crawler` only knows about 10 hardcoded departments in `SOUTH_FL_DEPARTMENTS`. The DB has 17 (and you'll want all of FL). Anything not in that map returns `400 Invalid department` → UI shows the generic error. Crawl also runs synchronously with up to 30×5s polling — it routinely exceeds the edge function CPU/wall budget on big sites like Broward and times out.

Plus the Firecrawl Crawl action burns credits fast and breaks on JS-heavy sites; **Map → bulk-download PDFs** is the reliable path you've already proven works for Miami-Dade.

## Fix

### 1. Make the crawler department-driven (not hardcoded)
- In `firecrawl-permit-docs-crawler/index.ts`, load the department from `permit_building_departments` (by name OR id) and read `website` / `portal_url` / `county`. Fall back to `SOUTH_FL_DEPARTMENTS` only if not found.
- This unlocks all 17 current departments + any future ones added via the admin UI.

### 2. Add a "Map all of Florida" bulk action
- New edge function `firecrawl-bulk-map-departments` that:
  - Loads every row in `permit_building_departments` with a non-null `website`
  - For each, kicks off a Map (limit 200, search="permit OR application OR NOA OR form filetype:pdf")
  - Inserts results into `firecrawl_discovered_documents` with `is_downloaded=false`
  - Runs serially with a 1s gap to respect Firecrawl rate limits
  - Returns a per-department summary
- Frontend: in `BuildingDeptCrawlerTab.tsx`, add a "Map All Florida Departments" button next to the per-department controls.

### 3. Backfill + auto-download missing PDFs (fixes Issue A and prevents recurrence)
- New edge function `firecrawl-download-discovered-pdfs` that:
  - Queries `firecrawl_discovered_documents` where `storage_path IS NULL AND file_url ILIKE '%.pdf'` (filterable by department)
  - Fetches each `file_url` with browser-like headers (User-Agent, Accept)
  - Verifies `%PDF` magic bytes
  - Uploads to `permit-documents` at `firecrawl/{county}/{department}/{filename}`
  - Updates row: `storage_path`, `is_downloaded=true`, `file_size`
  - Processes in batches of 10 with retry/skip on failure
- Run it once for the existing 62 Miami-Dade rows.
- Then re-run `firecrawl-to-smart-docs` for those rows so `permit_form_templates.file_path` becomes the relative storage path.

### 4. Inline self-healing in `firecrawl-to-smart-docs`
Before the existing `copyFileBetweenBuckets` block (~line 211): if `!storage_path && file_url` looks like a PDF, fetch + upload to `permit-documents` first, then proceed normally. Future Map-only flows become self-healing.

### 5. Auto-trigger downloader after Map action
In `firecrawl-permit-docs-crawler` after the Map branch (~line 145), invoke `firecrawl-download-discovered-pdfs` for that crawl_job_id. Same auto-pipeline behavior the Crawl branch already has.

### 6. Frontend safety nets in `DiscoveredDocumentsTab.tsx`
- `viewSmartDoc()`: if `file_path` starts with `http://`/`https://`, route through `pdf-proxy` instead of `createSignedUrl`.
- `viewSourceDoc()`: prefer `doc.file_url` (actual PDF) over `doc.source_url` (landing page).
- Show "Convert (N)" button when `stats.found > stats.converted` (not just `downloaded > converted`) so map-only depts can be processed manually.

### 7. Verify
- Click **Source** on Miami-Dade NOA → renders inline.
- Click **Smart Doc** → renders inline.
- Click **Crawl** on Broward / WPB / any of the other 16 depts → no "Something went wrong"; Map runs, PDFs auto-download, smart docs auto-convert.
- New "Map All Florida Departments" button populates discovered docs across every county in one click.

### Where things store (answer to your question)
- **Discovered Documents tab** → `firecrawl_discovered_documents` (raw URLs/files from crawler)
- **Smart Docs tab** AND **Templates tab** → both read `permit_form_templates`. Smart Docs filters on `source='firecrawl'`; Templates shows everything. After conversion the doc appears in both.
- **PDF bytes** → `permit-documents` storage bucket at `firecrawl/{county}/{department}/...`.

No DB migration needed.
