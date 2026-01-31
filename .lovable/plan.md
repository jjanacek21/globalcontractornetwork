

# Move ManufacturerNOASearch to PDF Sourcing Tab

## Overview
The `ManufacturerNOASearch` component already exists with full functionality. The user wants it moved from the "NOA Intelligence" tab to the "PDF Sourcing" tab for better workflow organization.

## Current State
- **Component**: `src/components/permit-queens/admin/ManufacturerNOASearch.tsx` - fully functional
- **Edge Function**: `supabase/functions/search-manufacturer-noas/index.ts` - already deployed
- **Current Location**: NOA Intelligence tab (line 194 in AITrainingCenter.tsx)

## Existing Features (Already Built)
The ManufacturerNOASearch component includes:
1. Search input with manufacturer name
2. Quick search buttons for GAF, Polyglass, CertainTeed, Owens Corning, Johns Manville, IKO, Boral
3. Results displayed in a scrollable list with checkboxes
4. Select All / Deselect All functionality
5. Export to CSV button
6. Import Selected to database button
7. Duplicate detection during import

## Implementation Plan

### Step 1: Update AITrainingCenter.tsx
Move the `ManufacturerNOASearch` component from the NOA Intelligence tab to the PDF Sourcing tab (batch-sourcing).

**Current PDF Sourcing tab (lines 130-135):**
```tsx
<TabsContent value="batch-sourcing" className="mt-4">
  <div className="space-y-6">
    <NOACSVImporter />
    <BatchProductSourcing />
  </div>
</TabsContent>
```

**Updated PDF Sourcing tab:**
```tsx
<TabsContent value="batch-sourcing" className="mt-4">
  <div className="space-y-6">
    <ManufacturerNOASearch />
    <NOACSVImporter />
    <BatchProductSourcing />
  </div>
</TabsContent>
```

**Updated NOA Intelligence tab (remove ManufacturerNOASearch):**
```tsx
<TabsContent value="noa-intelligence" className="mt-4">
  <div className="space-y-6">
    <NOABulkManager />
    <NOAUploadQueue />
  </div>
</TabsContent>
```

## Files to Modify
| File | Change |
|------|--------|
| `src/components/admin/AITrainingCenter.tsx` | Move ManufacturerNOASearch from NOA Intelligence to PDF Sourcing tab |

## Summary
This is a simple relocation - the component and edge function are already complete. The only change needed is updating the tab placement in AITrainingCenter.tsx to put the Manufacturer Search feature at the top of the PDF Sourcing tab workflow.

