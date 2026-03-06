

# Add Contractors to Companies/Teams

## Current State
- `contractor_profiles` table already has `company_id` and `team_id` columns (both nullable UUIDs)
- The `ContractorsTable` admin view displays company/team associations but has no UI to **assign** them
- The `ContractorDialog` (add/edit) has no company or team selector fields
- The `CompanyUsersTab` only adds users to `company_members` — it doesn't handle contractor profile associations

## Plan

### 1. Add Company & Team selectors to `ContractorDialog.tsx`

In the Directory fields section (`renderDirectoryFields`), add:
- **Company** dropdown: fetches from `companies` table, sets `company_id`
- **Team** dropdown: fetches from `teams` table filtered by selected `company_id`, sets `team_id`
- **Contractor Type** dropdown: `independent`, `subcontractor`, `handyman` — sets `contractor_type`

When company changes, reset team. On save, include `company_id`, `team_id`, and `contractor_type` in the insert/update payload.

### 2. Add "Assign Company/Team" action to `ContractorsTable.tsx`

Add a new action button (Building2 icon) on each contractor row that opens a quick-assign dialog:
- Company select (from `companies`)
- Team select (from `teams` filtered by company)
- Save updates `contractor_profiles.company_id` and `team_id` directly

This provides a fast way to bulk-assign contractors without opening the full edit dialog.

### 3. Files to modify

- **`src/components/admin/ContractorDialog.tsx`** — Add company/team/type selectors to both `renderDirectoryFields` and `renderStandardContractorFields`. Fetch companies on mount, fetch teams when company changes. Include fields in save payload.
- **`src/components/admin/ContractorsTable.tsx`** — Add an "Assign to Company" quick-action button with a small dialog containing company + team selects and a save button.

No database changes needed — `company_id` and `team_id` columns already exist on `contractor_profiles`.

