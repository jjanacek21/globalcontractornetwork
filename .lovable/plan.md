

# Fix Missing Documents in Packet Assembly

## Root Cause

The assembly page determines document status by checking the project's `selected_products` JSONB column (line 123 of `PermitPacketAssembly.tsx`). If no materials were selected during the permit wizard, **every `auto_source` document shows "Missing"** — even when matching products exist in the `product_approvals` table.

The Boca Raton metal structure has 6 `auto_source` documents: underlayment_fpa, underlayment_pe_evaluation, compliance_statement, roofing_material_fpa, fastening_patterns, and impact_test_report. All require product matches that don't exist in `selected_products`.

## Fix: Two-Part Solution

### 1. Auto-match products from `product_approvals` table when `selected_products` is empty

In `PermitPacketAssembly.tsx`, after fetching the project, if `selected_products` is empty or missing, query `product_approvals` for active products matching the project's material type. This populates the document status automatically.

```
- Query product_approvals WHERE category matches (e.g., 'Underlayment', 'Metal Roofing')
- Filter by is_active = true
- Check file_url presence to determine ready vs needs_sourcing
- Use these as fallback product matches for auto_source documents
```

### 2. Fix incorrect source types in packet structures

Some documents in the Boca Raton structure are tagged `auto_source` but aren't product PDFs:
- `compliance_statement` → should be `auto_fill` (it's a form the system generates)
- `fastening_patterns` → should be `auto_fill` (generated from `fastener_patterns` table data)

Update these two records in `permit_packet_structures` to use the correct source type.

### 3. Add "Select Products" action for unmatched auto_source docs

When an `auto_source` document has no matched product, show a "Select Product" button (in addition to Upload) that opens a product picker querying `product_approvals` by the document's `product_category`. Once selected, save it to the project's `selected_products` array and refresh.

## Files to Change

- **`src/pages/PermitPacketAssembly.tsx`** — Add fallback product matching from `product_approvals` table; add product selection handler
- **`src/components/permit-queens/PacketDocumentRow.tsx`** — Add "Select Product" action button for missing auto_source docs
- **`src/components/permit-queens/PacketAssemblyChecklist.tsx`** — Wire product selection callback
- **Database migration** — Update `compliance_statement` and `fastening_patterns` source types to `auto_fill` in the Boca Raton packet structure

## Key Logic Change (PermitPacketAssembly.tsx)

```typescript
// After fetching selectedProducts from project...
let productMatches = selectedProducts;

if (productMatches.length === 0) {
  // Auto-match from product_approvals table
  const { data: approvals } = await supabase
    .from('product_approvals')
    .select('id, manufacturer, product_name, noa_number, file_url, category')
    .eq('is_active', true)
    .not('file_url', 'is', null);
  
  productMatches = (approvals || []).map(a => ({
    id: a.id,
    manufacturer: a.manufacturer,
    product_name: a.product_name,
    noa_number: a.noa_number,
    file_url: a.file_url,
    category: a.category,
  }));
}
```

Then in the auto_source status check, match against `productMatches` instead of just `selectedProducts`.

