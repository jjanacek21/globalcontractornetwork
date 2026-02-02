

# Fix Product Count Discrepancy in Both Tabs

## Problem Summary

Two components are showing incorrect product counts (capped at 1000 instead of actual 2489):

| Tab | Component | Current Bug |
|-----|-----------|-------------|
| **Extracted Products** | `ExtractedProductsTab.tsx` | No pagination - limited to 1000 rows |
| **NOA Intelligence** | `NOABulkManager.tsx` | Uses `data.length` instead of `count` from response |

---

## Fix 1: ExtractedProductsTab.tsx

**File**: `src/components/admin/ExtractedProductsTab.tsx`

**Problem**: The `fetchProducts` function (lines 93-100) fetches without pagination.

**Solution**: Add pagination loop using `.range()` to fetch all products:

```typescript
const fetchProducts = async () => {
  setLoading(true);
  try {
    // Paginate to fetch ALL products (Supabase default limit is 1000)
    let allProducts: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error: fetchError } = await supabase
        .from("product_approvals")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        allProducts = [...allProducts, ...data];
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    // Continue with training packet enrichment using allProducts...
    const trainingIds = allProducts
      .map(p => (p.metadata as { source_training_id?: string })?.source_training_id)
      .filter(Boolean) as string[];
    // ... rest of logic unchanged
  }
};
```

---

## Fix 2: NOABulkManager.tsx

**File**: `src/components/permit-queens/admin/NOABulkManager.tsx`

**Problem**: The `loadStats` function (lines 53-109) uses `allProducts?.length` which is limited to 1000 rows, even though it requests `{ count: 'exact' }`.

**Current code**:
```typescript
const { data: allProducts, error: allError } = await supabase
  .from('product_approvals')
  .select('id', { count: 'exact' });

// Later...
setStats({
  total: allProducts?.length || 0,  // BUG: This is capped at 1000!
  ...
});
```

**Solution**: Use `head: true` with `count: 'exact'` and read the `count` value:

```typescript
const loadStats = async () => {
  setIsLoadingStats(true);
  try {
    // Use count queries with head: true to get accurate counts
    const { count: totalCount, error: allError } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true });

    const { count: withPdfCount, error: pdfError } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true })
      .not('file_url', 'is', null);

    const { count: pendingCount, error: pendingError } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('source_status', 'pending');

    // ... existing code for externalPdfCount (already correct)

    const { count: aiExtractedCount, error: aiError } = await supabase
      .from('product_approvals')
      .select('*', { count: 'exact', head: true })
      .not('ai_extracted_at', 'is', null);

    // For avg confidence, still need to fetch data (but paginated)
    // ... pagination loop for confidence calculation

    if (!allError && !pdfError && !pendingError && !aiError && !pdfUrlError) {
      setStats({
        total: totalCount || 0,       // Now correctly uses count
        withPdf: withPdfCount || 0,   // Now correctly uses count
        pending: pendingCount || 0,   // Now correctly uses count
        withPdfUrl: externalPdfCount || 0,
        aiExtracted: aiExtractedCount || 0,  // Now correctly uses count
        avgConfidence: avgConfidence,
        knowledgeItems: knowledgeCount || 0
      });
    }
  } catch (e) {
    console.error('Error loading stats:', e);
  } finally {
    setIsLoadingStats(false);
  }
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/ExtractedProductsTab.tsx` | Add pagination loop in `fetchProducts` function |
| `src/components/permit-queens/admin/NOABulkManager.tsx` | Use `count` value instead of `data.length` in `loadStats` |

---

## Expected Outcome

After these fixes:

**Extracted Products Tab**:
- Total Products: **2489** (was 1000)
- Verified, Pending Review, HVHZ Approved: Accurate counts

**NOA Intelligence Tab**:
- Total Products: **2489** (was 1000)
- With PDFs: **1862** (accurate)
- AI Extracted: Accurate count
- All other stats: Accurate

Both tabs will now show consistent, accurate product counts matching the Product Approvals page.

