

# Fix Document Loading and Bulk Verify Failures

## Two Issues Identified

### Issue 1: PDF Viewer Fails for Supabase Signed URLs
The screenshot shows "BCD Owner-Builder" displaying blank with a broken document icon. The `<object>` tag silently fails for Supabase storage signed URLs. The current code only uses blob-based fetching for external `.gov` domains (proxy path), but for signed URLs it relies on the `<object>` tag to render directly -- which fails silently in the sandboxed preview iframe.

**Fix**: For Supabase storage signed URLs, fetch the PDF as a blob and use `URL.createObjectURL()` (same approach as the proxy path) to guarantee rendering.

**File**: `src/components/ui/PDFViewerDialog.tsx`
- Add a check: if the URL contains `supabase.co/storage`, fetch it directly as a blob
- Use the existing blob URL rendering path (already works for proxy)
- Remove the 5-second timeout fallback which masks failures

### Issue 2: Bulk Verify Fails - URL Too Long
Console shows `TypeError: Failed to fetch` when clicking "Verify All with PDFs". The PATCH request includes hundreds of UUIDs in the URL query string, exceeding browser/server URL length limits (~8KB).

**Fix**: Batch the update into chunks of 50 IDs at a time.

**File**: `src/components/admin/ExtractedProductsTab.tsx`
- In `handleBulkVerify`, split `unverifiedWithPdfs` into chunks of 50
- Loop through chunks with sequential PATCH requests
- Update local state after all batches complete

## Files to Change

| File | Change |
|------|--------|
| `src/components/ui/PDFViewerDialog.tsx` | Detect Supabase storage URLs and fetch as blob instead of relying on `<object>` tag |
| `src/components/admin/ExtractedProductsTab.tsx` | Batch bulk verify into chunks of 50 IDs |

