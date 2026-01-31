
# Fix "Download NOA PDFs" Feature

## Problem Summary
The "Download 100 PDFs" button is not working due to a schema mismatch between what the code expects and what actually exists in the database.

## Root Cause
1. The CSV importer saved external Miami-Dade URLs directly to the `file_url` column (1,800 records)
2. The edge function `download-noa-pdfs` is looking for a non-existent `pdf_url` column
3. The stats query in `NOABulkManager.tsx` is also querying the wrong column
4. Result: The button shows "0 PDFs ready to download" and is disabled

## Database Reality
- **External Miami-Dade URLs**: Stored in `file_url` (1,800 records contain `miamidade.gov` links)
- **`pdf_url` column**: Does not exist in the schema
- **Internal storage URLs**: Also go to `file_url` (Supabase storage URLs)

## Solution Overview

### 1. Update Edge Function (`download-noa-pdfs`)
Change the query logic to find records where `file_url` contains an external Miami-Dade URL (not yet cached to internal storage):

```text
Current (broken):
  - Looks for: pdf_url IS NOT NULL AND file_url IS NULL
  
Fixed:
  - Looks for: file_url LIKE '%miamidade.gov%' (external URL present)
  - Downloads the PDF from the external URL
  - Uploads to Supabase storage
  - Updates file_url with the internal storage URL
```

Add comprehensive logging at each step for debugging.

### 2. Update Stats Query (`NOABulkManager.tsx`)
Fix the "X PDFs ready to download" counter to correctly identify records with external URLs:

```text
Current (broken):
  - Counts: pdf_url IS NOT NULL AND file_url IS NULL
  
Fixed:
  - Counts: file_url LIKE '%miamidade.gov%'
```

### 3. Add User Feedback
- **Loading state**: Already exists (`isDownloadingFromUrls`) but add console logs
- **Toast on start**: Shows "Starting download of X PDFs..."
- **Toast on complete**: Shows "Downloaded X of Y PDFs. Z failed."
- **Console logging**: Add detailed logs for debugging

---

## Technical Details

### Edge Function Changes (`download-noa-pdfs/index.ts`)

**Query Update:**
```typescript
// Find records with external Miami-Dade URLs that need caching
const { data: products } = await supabase
  .from('product_approvals')
  .select('id, noa_number, manufacturer, file_url')
  .ilike('file_url', '%miamidade.gov%')  // External URL
  .limit(limit);
```

**Add Start/End Logging:**
```typescript
console.log(`[download-noa-pdfs] Starting download. Limit: ${limit}`);
console.log(`[download-noa-pdfs] Found ${products.length} external PDFs to cache`);
// ... processing ...
console.log(`[download-noa-pdfs] Complete. Success: ${successCount}, Failed: ${failCount}`);
```

### Frontend Changes (`NOABulkManager.tsx`)

**Fix Stats Query:**
```typescript
// Count external Miami-Dade URLs needing caching
const { count: externalPdfCount } = await supabase
  .from('product_approvals')
  .select('*', { count: 'exact', head: true })
  .ilike('file_url', '%miamidade.gov%');

setStats({
  ...stats,
  withPdfUrl: externalPdfCount || 0,  // Now shows 1800
});
```

**Add Console Logging:**
```typescript
const handleDownloadFromUrls = async (batchSize: number) => {
  console.log(`[NOABulkManager] Starting download of ${batchSize} PDFs`);
  setIsDownloadingFromUrls(true);
  
  toast.info(`Starting download of up to ${batchSize} NOA PDFs...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('download-noa-pdfs', {
      body: { limit: batchSize }
    });
    
    console.log('[NOABulkManager] Response:', data);
    
    if (data.success) {
      toast.success(`Downloaded ${data.downloaded} of ${data.processed} PDFs. ${data.failed} failed.`);
    }
  } catch (error) {
    console.error('[NOABulkManager] Error:', error);
    toast.error(`Download failed: ${error.message}`);
  } finally {
    setIsDownloadingFromUrls(false);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/download-noa-pdfs/index.ts` | Update query to use `file_url ILIKE '%miamidade.gov%'`, enhance logging |
| `src/components/permit-queens/admin/NOABulkManager.tsx` | Fix stats query, add console logging, improve toast messages |

## Expected Outcome
- The stats will show "1,800 PDFs ready to download"
- Clicking "Download 100 PDFs" will trigger the edge function
- Console will show detailed progress logs
- Toast notifications will appear at start and completion
- PDFs will be downloaded from Miami-Dade and stored in Supabase storage
