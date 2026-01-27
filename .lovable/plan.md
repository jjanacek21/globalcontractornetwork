

# Permit Packet Generator - Comprehensive Fix Plan

## Root Cause Analysis

Based on my investigation, I've identified **three interconnected problems** causing the permit packet issues:

### Problem 1: Missing Product Approval PDFs (Critical)

**Current State:**
| Status | Count | Percentage |
|--------|-------|------------|
| `pending` | 748 | 93.9% |
| `training_extracted` | 25 | 3.1% |
| `found` | 15 | 1.9% |
| `searching` | 4 | 0.5% |
| `not_found` | 4 | 0.5% |

**Impact**: 93.9% of products have `pending` status and no PDFs, so when a user selects GAF Timberline HDZ or CertainTeed products in the wizard, the packet assembler correctly marks them as "Missing" because there's no `file_url`, `noa_pdf_url`, or `fl_approval_pdf_url` in the database.

### Problem 2: PDF Sourcing Not Running Automatically

The `batch-source-products` edge function exists and **works correctly** (it downloads PDFs and stores them in Supabase Storage), but:
- It requires manual triggering from admin panel
- It depends on Firecrawl API key which may not be configured
- It only processes 50 products per batch (rate limited)

### Problem 3: Data Flow Gap in Product Selection

When products are selected in the wizard:
1. **Selection**: User picks products from `MultiMaterialSelector`
2. **Passing**: Products are passed to `permit-packet-assembler` with `file_url` from the product record
3. **Assembly**: The assembler checks `file_url` → `noa_pdf_url` → `fl_approval_pdf_url`
4. **Result**: All are NULL for 93.9% of products → marked as "Missing"

---

## Solution: Two-Phase Approach

### Phase 1: Immediate Fix - Prioritize Available PDFs (Quick Win)

Modify the `MultiMaterialSelector` and product display to clearly indicate which products have PDFs available, so users can make informed choices.

**Changes:**
1. Add visual indicator (green checkmark vs warning icon) for products with PDFs
2. Filter/sort products with PDFs first
3. Show "PDF Available" badge in product dropdown

**Files to Modify:**
- `src/components/permit-queens/SearchableProductCombobox.tsx` - Add PDF availability indicator
- `src/components/permit-queens/MultiMaterialSelector.tsx` - Sort products with PDFs first

### Phase 2: Background PDF Sourcing - Auto-Source on Selection

Create a system where when a product is selected in the wizard, if it lacks a PDF, the system automatically attempts to source it.

**New Edge Function: `source-product-pdf`**

A lightweight, single-product sourcer that:
1. Accepts a product ID
2. Attempts to find and download the PDF from known sources
3. Updates the `product_approvals` record with the URL
4. Returns success/failure

**Trigger Logic:**
- When user selects a product in `MultiMaterialSelector`
- If product has no PDF URLs
- Call `source-product-pdf` in background
- Update UI when PDF becomes available

**Files to Create:**
- `supabase/functions/source-product-pdf/index.ts`

**Files to Modify:**
- `src/components/permit-queens/MultiMaterialSelector.tsx` - Trigger background sourcing
- `src/hooks/useProductApprovals.ts` - Add sourcing capability

### Phase 3: Packet Assembler Improvements

Fix the packet assembler to better handle missing PDFs and provide clearer feedback.

**Changes to `permit-packet-assembler`:**

1. **Better Fallback**: When PDF is missing, generate a placeholder page with product info
2. **Real-time Sourcing**: Attempt to source PDF inline if not found
3. **Clearer Status**: Return `pdf_unavailable` status vs generic `missing`

**File to Modify:**
- `supabase/functions/permit-packet-assembler/index.ts`

---

## Detailed Implementation

### Step 1: Update SearchableProductCombobox for PDF Visibility

```typescript
// Add PDF status indicator to each product option
const hasPdf = product.file_url || product.noa_pdf_url || product.fl_approval_pdf_url;

<div className="flex items-center gap-2">
  {hasPdf ? (
    <FileCheck className="h-4 w-4 text-green-500" />
  ) : (
    <FileQuestion className="h-4 w-4 text-orange-400" />
  )}
  <span>{product.product_name}</span>
  {hasPdf && <Badge variant="outline" className="text-xs">PDF Ready</Badge>}
</div>
```

### Step 2: Create source-product-pdf Edge Function

This lightweight function attempts to find a PDF for a single product:

```typescript
// Core logic:
1. Lookup product by ID
2. Construct known PDF URL patterns:
   - Miami-Dade: https://www.miamidade.gov/building/library/noa/{noaNumber}.pdf
   - Florida Building: https://www.floridabuilding.org/upload/PR_Instl_Docs/{flNumber}.pdf
3. Verify URL is accessible (HEAD request)
4. If found, download and store in product-approvals bucket
5. Update product_approvals record with file_url
6. Return result
```

### Step 3: Integrate Background Sourcing in MultiMaterialSelector

When a product is selected that lacks a PDF:

```typescript
const handleProductSelect = async (product: ProductApproval) => {
  // Add to selection immediately
  onProductsChange([...selectedProducts, { 
    id: crypto.randomUUID(), 
    product, 
    category 
  }]);
  
  // If no PDF, trigger background sourcing
  if (!product.file_url && !product.noa_pdf_url && !product.fl_approval_pdf_url) {
    try {
      await supabase.functions.invoke('source-product-pdf', {
        body: { productId: product.id }
      });
      // Refetch product to get updated URL
      refetch();
    } catch (e) {
      console.log('Background sourcing failed, will use placeholder');
    }
  }
};
```

### Step 4: Update Packet Assembler for Better Missing Handling

```typescript
// In permit-packet-assembler, when product has no PDF:
if (!fileUrl) {
  // Attempt inline sourcing
  const sourcedUrl = await attemptSourcePdf(sp.id, sp.noa_number);
  
  if (sourcedUrl) {
    fileUrl = sourcedUrl;
  } else {
    // Add as "needs_sourcing" with product info for manual lookup
    documentIndex.push({
      type: 'product_approval',
      name: `${sp.manufacturer} ${sp.product_name} - NOA ${sp.noa_number}`,
      pages: 0,
      status: 'needs_sourcing',
      source: 'auto_source',
      noaNumber: sp.noa_number, // Include for manual lookup
    });
    continue;
  }
}
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/permit-queens/SearchableProductCombobox.tsx` | Modify | Add PDF availability indicators |
| `src/components/permit-queens/MultiMaterialSelector.tsx` | Modify | Sort products with PDFs first, trigger background sourcing |
| `src/hooks/useProductApprovals.ts` | Modify | Add `hasPdf` helper, sort by PDF availability |
| `supabase/functions/source-product-pdf/index.ts` | Create | Single-product PDF sourcer |
| `supabase/functions/permit-packet-assembler/index.ts` | Modify | Better missing handling, inline sourcing attempt |
| `supabase/config.toml` | Modify | Add source-product-pdf function config |

---

## Known PDF Source Patterns

For the `source-product-pdf` function, these are known URL patterns:

**Miami-Dade NOAs:**
```
https://www.miamidade.gov/building/library/noa/{noaNumber_no_dots}.pdf
Example: NOA 21-0312.02 → https://www.miamidade.gov/building/library/noa/21-031202.pdf
```

**Florida Building Code:**
```
https://www.floridabuilding.org/upload/PR_Instl_Docs/{flNumber}.pdf
```

**Manufacturer Direct:**
- GAF: `https://www.gaf.com/en-us/resources/documents`
- CertainTeed: `https://www.certainteed.com/roofing`
- Owens Corning: `https://www.owenscorning.com/roofing`

---

## Testing Plan

After implementation:

1. **Select a product with existing PDF** (e.g., Boral TileSeal)
   - Verify it shows "PDF Ready" badge
   - Verify packet includes it as "auto_sourced"

2. **Select a product without PDF** (e.g., GAF Timberline HDZ)
   - Verify background sourcing triggers
   - Check if PDF URL is populated after sourcing
   - Verify packet status updates accordingly

3. **Generate full packet**
   - Verify cover sheet generates
   - Verify NOC generates
   - Verify sourced products show with PDFs
   - Verify missing products show clear status

---

## Expected Outcomes

| Before | After |
|--------|-------|
| 93.9% products show "Missing" | Products with known NOA patterns auto-source |
| No visual indication of PDF availability | Clear "PDF Ready" badges on products |
| Manual PDF sourcing only | Background sourcing on selection |
| Generic "missing" status | Specific "needs_sourcing" with NOA number for manual lookup |
| 7% packet completion | 40-60%+ for standard roofing permits (with auto-sourcing) |

---

## Implementation Order

1. **Phase 1A**: Update `SearchableProductCombobox` with PDF indicators
2. **Phase 1B**: Update `MultiMaterialSelector` to sort products with PDFs first
3. **Phase 2A**: Create `source-product-pdf` edge function
4. **Phase 2B**: Integrate background sourcing trigger
5. **Phase 3**: Update `permit-packet-assembler` with better missing handling
6. **Testing**: Full end-to-end permit packet generation test

