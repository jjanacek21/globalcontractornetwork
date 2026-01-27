
# Plan: Fix Smart Document Upload RLS Policy

## Problem Identified

When you try to upload smart documents, the upload fails with this error:
```
"new row violates row-level security policy for table 'permit_form_templates'"
```

## Root Cause

The RLS policy on the `permit_form_templates` table is checking the wrong admin table:

| Current Policy | Problem |
|----------------|---------|
| `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')` | Your profile has `role = 'homeowner'`, not `'admin'` |

However, you **are** a permit admin - you're correctly listed in the `permit_admins` table. The policy should be checking `permit_admins`, not `profiles.role`.

## Solution

Update the RLS policy for `permit_form_templates` to check the `permit_admins` table instead of `profiles.role`:

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "Admins can manage permit form templates" ON permit_form_templates;

-- Create new policy using permit_admins table
CREATE POLICY "Permit admins can manage form templates" 
  ON permit_form_templates FOR ALL 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM permit_admins WHERE user_id = auth.uid()));
```

## Implementation Steps

1. **Run database migration** to update the RLS policy:
   - Drop the old policy that checks `profiles.role = 'admin'`
   - Create new policy that checks `permit_admins.user_id = auth.uid()`

2. **No code changes needed** - the `DocumentUploadZone.tsx` component logic is correct; it's purely a database policy issue

## Expected Result

After the fix:
- Permit admins (users in `permit_admins` table) can upload, update, and delete smart documents
- The upload flow will complete successfully
- AI analysis will trigger as expected

## Files to Modify

| Type | Details |
|------|---------|
| Database Migration | Update RLS policy on `permit_form_templates` table |
