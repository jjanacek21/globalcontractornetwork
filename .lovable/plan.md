
# Fix Permit Packet Not Including NOAs

## Problem Summary

The permit packet download only includes the cover sheet and uploaded documents, but NOT the selected NOA/product approval documents. This is because:

1. **Selected products are never saved to the database** when the permit is submitted
2. **The detail page doesn't fetch or pass products** when regenerating the packet
3. **The edge function needs products to be passed** in the `selectedProducts` array to include their NOA PDFs

## Root Cause

### Issue 1: Products Not Saved on Submit

In `PermitQueensNewRequest.tsx`, the `handleSubmit()` function (lines 542-577) updates the permit but does NOT save the `selectedMaterials` to the `selected_products` column.

### Issue 2: Products Not Fetched on Detail Page

In `PermitQueensRequestDetail.tsx`, the `handleRegeneratePacket()` function (lines 137-179) calls the edge function but only passes `uploadedDocuments`, not any product approvals.

### Issue 3: Database Column Exists But Is Empty

The `permit_projects` table has a `selected_products` column (verified in database), but for the current permit it shows `selected_products: []` (empty).

## Solution

### Fix 1: Save Selected Products on Submit

Update `PermitQueensNewRequest.tsx` to save products to the database:

```typescript
// In handleSubmit() and draft creation
await supabase.from('permit_projects').update({
  selected_products: selectedMaterials.map(m => ({
    id: m.product.id,
    manufacturer: m.product.manufacturer,
    product_name: m.product.product_name,
    noa_number: m.product.noa_number,
    file_url: m.product.file_url,
    category: m.category,
  })),
  // ... other fields
}).eq('id', permitId);
```

### Fix 2: Pass Products When Regenerating Packet

Update `PermitQueensRequestDetail.tsx` to read products from the permit record and pass them to the edge function:

```typescript
// In handleRegeneratePacket()
const selectedProducts = permit.selected_products || [];

await supabase.functions.invoke('permit-packet-assembler', {
  body: { 
    permitRequestId: permit.id, 
    selectedProducts: selectedProducts,  // Add this
    uploadedDocuments: [...],
  },
});
```

### Fix 3: Edge Function Already Handles Products

The edge function (lines 594-667) already processes `selectedProducts` correctly - no changes needed there.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PermitQueensNewRequest.tsx` | Save `selectedMaterials` to `selected_products` column on draft creation and submit |
| `src/pages/PermitQueensRequestDetail.tsx` | Fetch `selected_products` from permit record and pass to edge function |

## Technical Implementation Details

### PermitQueensNewRequest.tsx Changes

1. **Update draft permit creation** (around line 184-206):
   - Add `selected_products` to the insert statement

2. **Update handleGeneratePacket** (around line 457-481):
   - Add `selected_products` when creating/updating permit

3. **Update handleSubmit** (around line 545-551):
   - Include `selected_products` in the update

### PermitQueensRequestDetail.tsx Changes

1. **Update handleRegeneratePacket** (around line 142-152):
   - Read `selected_products` from the `permit` object
   - Pass it to the edge function as `selectedProducts`

## Data Flow After Fix

```text
Step 1: User selects products in new request wizard
    ↓
Step 2: Products saved to permit_projects.selected_products
    ↓
Step 3: User views permit detail page
    ↓
Step 4: Page loads permit record including selected_products
    ↓
Step 5: User clicks "Regenerate Packet"
    ↓
Step 6: Edge function receives selectedProducts array
    ↓
Step 7: Edge function fetches NOA PDFs and merges them
    ↓
Step 8: Complete packet downloaded with all NOAs
```

## Expected Result

After implementation:
- Selected products are persisted to the database
- Regenerating a packet includes all linked NOA documents
- Downloaded permit packets contain cover sheet + uploaded docs + product approval PDFs
