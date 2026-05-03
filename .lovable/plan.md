## Goal

Make NOA fetching resilient with a NOA-number lookup fallback, and give the permit rep a live checklist UI showing per-document fetch/merge status with the ability to retry merges for items that didn't make it into the final packet.

## Part 1 — NOA Fallback in `permit-packet-assembler/index.ts`

Today: `mergePdfDocuments` fetches each URL once. If the URL 404s, returns HTML (e.g. NOA portal landing page), or fails the `%PDF` magic-byte check, the document is silently dropped and only listed in console logs. The `auto_source` block already knows the `noa_number`, but that context is lost by merge time.

Changes:

1. **Pass document context into the merger.** Replace `pdfUrls: string[]` with `pdfDocs: Array<{ url, noaNumber?, manufacturer?, productName?, indexRef }>` where `indexRef` points back to the matching `documentIndex` entry. Build this list everywhere we currently `pdfUrls.push(fileUrl)`.

2. **Add `resolveNoaPdfByNumber(noaNumber)` helper** that, given a NOA number:
   - Queries `product_approvals` for any rows with that `noa_number` and an `is_active`/most-recent `file_url` (handles the case where `selectedProducts` carries a stale URL but the DB has a fresher one).
   - If still not found or still fails, calls the existing `search-and-store` / `product-document-search` edge function (already invoked elsewhere in the codebase) to discover a fresh PDF URL, with NOA number as the query.
   - Returns `{ url, source: 'db' | 'search' } | null`.

3. **Fallback flow inside `mergePdfDocuments`** (per document):
   - Attempt primary fetch + magic-byte validation as today.
   - On any failure (`!response.ok`, non-PDF content-type without gov override, magic-byte mismatch, zero pages, fetch throw): if `doc.noaNumber` exists, call `resolveNoaPdfByNumber` and retry the fetch+validate against the new URL.
   - On success via fallback, mutate `doc.indexRef.url`, set `doc.indexRef.status = 'auto_sourced'`, and add a note `doc.indexRef.fetchSource = 'fallback'`.
   - On final failure, set `doc.indexRef.status = 'failed_fetch'` and `doc.indexRef.fetchError = '<short reason>'`.

4. **Add new statuses** to the `DocumentInfo` union: `'failed_fetch'` and keep `'needs_sourcing'`. Cover sheet rendering already branches on status; extend the checkmark/color logic to render failed_fetch in red with `[!]`.

5. **Return per-document merge results** from `mergePdfDocuments` (`{ mergedBytes, results: Array<{ indexRef, merged: boolean, error?: string, fallbackUsed?: boolean }> }`) and persist them onto `documentIndex` before saving the project record so the UI can render them.

6. **New `mode: 'retry_documents'` entry path.** When invoked with `{ permitRequestId, retryDocuments: [{ type, noaNumber }] }`, the function loads the existing packet's stored `documents_included`, re-runs the fetch+fallback logic for just those entries, merges them onto the prior cover sheet + previously-merged pages by re-assembling from scratch (simpler and deterministic), and re-uploads the packet.

## Part 2 — Frontend Checklist UI

New component `src/components/permit-queens/PacketMergeChecklist.tsx`. Mounted inside `PermitPacketAssembly.tsx` (and reused inside `PacketAssemblyChecklist.tsx` after assembly completes).

Source of truth: the assembler response (`data.documentIndex`) plus the persisted `permit_requests.documents_included` JSON. The checklist reads:

- `name`, `type`, `status`, `noaNumber`, `manufacturer`, `fetchError`, `fetchSource`.

Per-row presentation:

```
[icon] Document name                    [status badge]   [retry button]
       NOA FL12345.6 • Manufacturer
       Failed: server returned HTML (used fallback search)
```

Status badges:
- **Queued** — gray, `status === 'needs_sourcing'`
- **Merged** — green, `status === 'included' | 'auto_sourced' | 'generated'`
- **Failed fetch** — red, `status === 'failed_fetch'`
- **Needs sourcing** — amber, no URL resolved
- **Fallback used** — small info chip when `fetchSource === 'fallback'`

Header summary: `X of Y merged · Z failed · W need sourcing` plus a single "Retry failed" button that batches all failed/needs_sourcing rows.

Actions:
- **Retry one** → invoke `permit-packet-assembler` with `mode: 'retry_documents'` and the single `{ type, noaNumber }`. Show inline spinner; on success replace the row from the response.
- **Retry all failed** → same call with the full failed list.
- **Search manually** → opens existing `AutoSourceModal` for that doc type (already wired in `PacketAssemblyChecklist`).
- **Re-run merge** → calls the assembler with the current `selectedProducts` and refreshes packet URL.

Wire-in points:
- `PermitPacketAssembly.tsx` — render `<PacketMergeChecklist permitRequestId={...} documentIndex={...} onUpdate={refetchPacket} />` under the existing assembly section.
- `PacketAssemblyChecklist.tsx` — after successful `handleAssemble`, store `data.data.documentIndex` in state and pass it to the new component instead of just showing a Download button.

## Part 3 — Persistence & Types

- Extend the `PacketDocument` type in `PacketDocumentRow.tsx` with `fetchError?: string` and `fetchSource?: 'primary' | 'fallback'`, plus the new `'failed_fetch'` status.
- The assembler already writes to `permit_requests.documents_included` (line ~1424). Include the new fields there so reloads after a refresh keep the checklist accurate without another assembler invocation.

## Out of scope

- No new database tables — everything reuses `permit_requests.documents_included` and `product_approvals`.
- No changes to cover sheet layout beyond the new status entry.
- No change to the `pdf-proxy` edge function.

## Files touched

- `supabase/functions/permit-packet-assembler/index.ts` — fallback logic, retry mode, result reporting.
- `src/components/permit-queens/PacketMergeChecklist.tsx` — new.
- `src/components/permit-queens/PacketDocumentRow.tsx` — type + status updates.
- `src/components/permit-queens/PacketAssemblyChecklist.tsx` — render checklist after assembly.
- `src/pages/PermitPacketAssembly.tsx` — mount checklist on the packet detail view.
