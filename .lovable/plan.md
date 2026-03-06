

# Admin Dashboard: User Segmentation and Admin Access Management

## Summary

Restructure the admin dashboard so **Contractors**, **Companies**, and **Property Owners** are cleanly separated by signup type, and add admin access management (Super Admin, Permit Admin, Company Admin) directly to the Contractors tab.

## Current Problems
1. Property Owners table queries `profiles` with `role = 'homeowner'` — but contractors/companies who sign up may also appear if `role` is not set correctly
2. No way to grant admin access (Super Admin, Permit Admin, Company Admin) from the Contractors tab
3. CompanyManagementDialog doesn't show signup data like references, job photos, certifications, or insurance documents — all of which exist in the `companies` table

## Changes

### 1. ContractorsTable.tsx — Add Admin Access Dialog

Add a **Shield** icon button per contractor row. Opens a dialog with checkboxes:
- **Company Admin** — inserts/removes from `company_admins` (only shown if contractor has a `company_id`)
- **Permit Admin** — inserts/removes from `permit_admins`  
- **Super Admin** — inserts/removes from `super_admins`

On open: query all three tables by `user_id` to determine current state. On save: insert or delete records accordingly.

Only contractors with a `user_id` will show the Shield button (those without auth accounts cannot have admin roles).

### 2. CompanyManagementDialog.tsx — Show Signup Submission Data

Add new sections to the company view/edit dialog to display data submitted during registration:
- **Client References** section — render `client_references` JSONB array (name, company, phone, testimonial)
- **Job Photos** section — render `job_photos` JSONB array as image thumbnails
- **Insurance Documents** — show links/previews for `insurance_document_url` and `workers_comp_document_url`
- **Certifications** — render `certifications` JSONB
- **Licenses** — render `licenses` JSONB array
- **Directory Approval** — clear "Approve for Directory" button that sets `verification_status = 'verified'` and `verified_at = now()`

### 3. PropertyOwnersTable.tsx — Already Correct

The current query filters by `role = 'homeowner'`, which already excludes contractors. No changes needed here — the separation is already working via the `profiles.role` column.

### 4. Signup Flow Verification

The existing `register-company` and `ContractorAuth` signup flows already set the correct profile role. Property owner signups set `role = 'homeowner'`. This ensures clean separation.

## Files to Modify

- **`src/components/admin/ContractorsTable.tsx`** — Add Shield button + Admin Access dialog with Super Admin / Permit Admin / Company Admin checkboxes
- **`src/components/admin/CompanyManagementDialog.tsx`** — Add sections for references, job photos, insurance docs, certifications, licenses, and a "Approve for Directory" action

## No Database Changes Needed

All tables (`super_admins`, `permit_admins`, `company_admins`, `companies` with its JSONB columns) already exist with the correct schema.

