

# Fix NOA/Product Approval Sourcing in Permit Expediting Admin

## Problem

Products imported into the `product_approvals` table (via CSV import or training packet extraction) are not being picked up by the bulk download tools because of status filter mismatches. The bulk downloader only processes products with `source_status = 'pending'` or `file_url IS NULL`, but imported products have `source_status = 'imported'` or `'training_extracted'`.

Additionally, successfully downloaded PDFs are marked as `source_status: 'found'` but the admin UI only shows "Verified" for `source_status = 'verified'` — everything else appears as "Pending", making it unclear which products have PDFs.

## Root Causes

1. **`noa-bulk-downloader` filter mismatch**: Line 77 uses `query.or('file_url.is.null,source_status.eq.pending')` which skips products with `source_status = 'imported'` or `'training_extracted'`
2. **`download-noa-pdfs` only processes Miami-Dade external URLs**: Products without `miamidade.gov` in `file_url` are ignored
3. **No auto-verification**: Successfully downloaded PDFs keep `source_status: 'found'` instead of being auto-verified
4. **Admin UI status display**: Only shows binary "Verified" vs "Pending" — no distinction for "found" or "imported"

## Solution

### 1. Fix `noa-bulk-downloader` filter (edge function)

Update the `skipExisting` filter to include all non-sourced statuses:

```sql
-- Current (misses 'imported', 'training_extracted', 'needs_manual_upload')
file_url.is.null,source_status.eq.pending

-- Fixed (catches all un-sourced products)
file_url.is.null,source_status.in.(pending,imported,training_extracted,needs_manual_upload)
```

### 2. Auto-verify on successful PDF download

In both `noa-bulk-downloader` and `download-noa-pdfs`, when a PDF is successfully downloaded and stored, set `source_status: 'verified'` instead of `'found'`:

```typescript
// Both edge functions: update after successful download
.update({
  file_url: fileUrl,
  noa_pdf_url: fileUrl,
  source_status: 'verified',  // was 'found'
  is_active: true,
  updated_at: new Date().toISOString()
})
```

### 3. Improve admin status display in `ExtractedProductsTab`

Show distinct badges for different statuses instead of binary Verified/Pending:

| Status | Badge |
|--------|-------|
| `verified` | Green "Verified" |
| `found` | Blue "PDF Found" |
| `imported` | Gray "Imported" |
| `training_extracted` | Purple "Extracted" |
| `needs_manual_upload` | Red "Needs Upload" |
| Other/null | Amber "Pending" |

### 4. Add bulk verify action

Add a "Verify All with PDFs" button to the `ExtractedProductsTab` that sets `source_status = 'verified'` for all products that have a `file_url` but aren't yet verified.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/noa-bulk-downloader/index.ts` | Fix `skipExisting` filter to include `imported`, `training_extracted` statuses; set `source_status: 'verified'` on success |
| `supabase/functions/download-noa-pdfs/index.ts` | Set `source_status: 'verified'` on successful download |
| `src/components/admin/ExtractedProductsTab.tsx` | Multi-status badge display; add "Verify All with PDFs" bulk action |

