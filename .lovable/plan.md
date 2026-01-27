

# Plan: Fix Smart Document Upload - Missing jurisdiction_name

## Problem

The upload is now failing with a different error:
```
"null value in column \"jurisdiction_name\" of relation \"permit_form_templates\" violates not-null constraint"
```

The RLS policy fix worked, but the `jurisdiction_name` column is required (NOT NULL) and the code doesn't provide a value.

## Root Cause

Looking at the `DocumentUploadZone.tsx` component:
- It receives `buildingDeptId` as a prop
- But the insert statement doesn't include `jurisdiction_name`
- The table requires `jurisdiction_name` to have a value

| Column | Nullable | Current Value |
|--------|----------|---------------|
| `jurisdiction_name` | NO (required) | Not provided |
| `building_dept_id` | YES | Provided in separate update |

## Solution

Modify `DocumentUploadZone.tsx` to:
1. Accept the building department name as a prop (or fetch it)
2. Include `jurisdiction_name` in the initial insert statement
3. Move all the data into a single insert instead of insert + update

## Implementation

### Option 1 (Recommended): Pass department info from parent

The parent component `SmartDocumentManager.tsx` already has the selected department with its name. We should pass it down:

**File: `src/components/permit-queens/admin/SmartDocumentManager.tsx`**
- Change the `DocumentUploadZone` call to pass the department name:
```tsx
<DocumentUploadZone 
  buildingDeptId={selectedDepartment}
  buildingDeptName={selectedDept?.name || ''}
  onDocumentUploaded={handleDocumentUploaded}
/>
```

**File: `src/components/permit-queens/admin/DocumentUploadZone.tsx`**
- Add `buildingDeptName` prop
- Update the insert to include all required fields:
```tsx
.insert({
  form_name: formName,
  form_type: formType,
  file_path: filePath,
  trade_types: [tradeType],
  is_fillable: false,
  jurisdiction_name: buildingDeptName,  // Add this
  building_dept_id: buildingDeptId,     // Move this here
  field_count: 0,
  analysis_status: 'analyzing'
})
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/permit-queens/admin/SmartDocumentManager.tsx` | Pass `buildingDeptName` prop to `DocumentUploadZone` |
| `src/components/permit-queens/admin/DocumentUploadZone.tsx` | Add `buildingDeptName` prop and include it in the insert statement |

## Expected Result

After this fix:
- The insert will include the required `jurisdiction_name` value
- Smart document uploads will complete successfully
- AI analysis will trigger as expected

