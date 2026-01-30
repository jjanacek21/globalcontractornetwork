
# Fix Product Update Error: Missing `ul_listing` Column

## Problem

When saving edits to a product in the "Extracted Products" tab, the operation fails with:

```
Could not find the 'ul_listing' column of 'product_approvals' in the schema cache
```

## Root Cause

The `ExtractedProductsTab.tsx` component uses `ul_listing` as a field name, but the actual database column is named `uil_number`. This is a **field name mismatch**.

| Code Uses | Database Has | Purpose |
|-----------|--------------|---------|
| `ul_listing` | ❌ Does not exist | - |
| - | `uil_number` | UL/UIL listing number (text) |
| - | `ul_listing_url` | URL to UL listing PDF |

## Solution

Update `ExtractedProductsTab.tsx` to use `uil_number` instead of `ul_listing` throughout:

### Changes Required

**File: `src/components/admin/ExtractedProductsTab.tsx`**

1. **Update the `ExtractedProduct` type** (line ~31):
```typescript
// Change from:
ul_listing?: string | null;
// To:
uil_number?: string | null;
```

2. **Update the `EditFormData` type** (line ~49):
```typescript
// Change from:
ul_listing: string;
// To:
uil_number: string;
```

3. **Update initial state** (line ~84):
```typescript
// Change from:
ul_listing: "",
// To:
uil_number: "",
```

4. **Update product mapping** (line ~140):
```typescript
// Change from:
ul_listing: (p as { ul_listing?: string | null }).ul_listing ?? null,
// To:
uil_number: p.uil_number ?? null,
```

5. **Update form data initialization** (line ~240):
```typescript
// Change from:
ul_listing: product.ul_listing || "",
// To:
uil_number: product.uil_number || "",
```

6. **Update the database update call** (line ~258):
```typescript
// Change from:
ul_listing: editFormData.ul_listing || null,
// To:
uil_number: editFormData.uil_number || null,
```

7. **Update any form labels/inputs** that reference "UL Listing" to use `uil_number` as the field key while keeping user-friendly labels like "UL/UIL Number".

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/ExtractedProductsTab.tsx` | Replace all `ul_listing` references with `uil_number` |

## Expected Outcome

After this fix:
- Product edits will save successfully to the database
- The UL/UIL number field will work correctly
- No more "column not found" errors
