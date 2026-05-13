## Goal
From the Super Admin dashboard, let an admin manually add (1) full company directory listings and (2) independent contractors (building consultant / handyman / skilled labor), with auto-linking of any contractor profile that points to a company.

## 1. Expand "Add Company" in admin (CompanyDialog.tsx)
Today the dialog only captures name/address/phone/email/website. Expand the `add` (and `edit`) mode to capture every field needed to appear as a verified directory listing:

- Branding: `logo_url`, `banner_url` (reuse `ProfileImageUpload` + `company-photos` bucket)
- About: `description`, `years_in_business`, `yearly_revenue_range`, `service_areas[]`, `specialties[]`
- Credentials: `license_number`, `license_state`, `license_expiry`, `insurance_provider`, `insurance_policy_number`, `insurance_expiry`, `workers_comp_provider`, `workers_comp_policy_number`
- Proof: `job_photos[]` (GalleryManager), `client_references[]` (name/phone/email/project)
- Social: `social_links` (reuse `SocialLinksEditor`)
- Status controls (admin-only): `verification_status` select (`pending | verified | rejected`), `is_active` toggle
- On save: write to `companies`; trigger already recomputes `verification_score`. If admin sets `verification_status = 'verified'`, also stamp `verified_at = now()` and `verified_by = auth.uid()`.

## 2. Auto-link existing contractor profiles
This already works at the data layer: `contractor_profiles.company_id` is the link, and `calculate_directory_eligibility` flips sub-contractors to eligible the moment their parent company becomes verified. We will:

- In the company add/edit dialog, add a "Link existing contractors" multi-select that lists `contractor_profiles WHERE company_id IS NULL` (filterable by email/name) and bulk-updates `company_id` on save.
- In `ContractorDialog` (add mode), pre-populate the company dropdown from the new company immediately after creation (already fetched on open — we just refresh).

## 3. New "Add Independent Contractor" flow
Reuse the existing `ContractorDialog` add mode, but make the path explicit and richer:

- Add a button "Add Independent Contractor" on the Contractors tab next to the existing add control.
- Force `source = 'Directory'` (writes to `contractor_profiles`).
- Show a required "Profile type" select using the existing `profile_type` enum: `building_consultant`, `handyman`, `skilled_labor` (hide `company`). This drives directory categorization and the new filter added previously.
- Allow optional `company_id` selection. If set, the row is auto-attached to that company in the directory (existing FK + RLS already handles display).
- Capture: `first_name`, `last_name`, `email`, `phone`, `bio`, `logo_url` (profile pic), `service_areas[]`, `specialties[]`, optional `license_number/state` (only required for `subcontractor` independents — not these three types), `insurance_info` (optional), `social_links`, `verification_status` (admin can mark verified immediately).
- Trigger `calculate_directory_eligibility` runs automatically on insert; handymen become directory-eligible once `verification_status = 'verified'`. Building consultants and skilled labor are new — see DB note below.

## 4. Database tweak
`calculate_directory_eligibility` currently only handles `subcontractor` and `handyman`. Extend it (single migration) so `building_consultant` and `skilled_labor` profile types also become directory-eligible when `verification_status = 'verified'`. Logic gates on `profile_type` (not `contractor_type`) for these three new categories so they don't need a contractor license.

## 5. Directory surface
No schema changes here — the `ContractorDirectory` profile-type filter already added in the previous round will pick up the new rows. We will just verify the cards render `logo_url`, verified badge, and link to `/contractor/:id`.

## Files touched
- edit `src/components/admin/CompanyDialog.tsx` — full credential/photo/reference/social form, verification controls, link-existing-contractors picker
- edit `src/components/admin/ContractorDialog.tsx` — `profile_type` selector, profile picture upload, social links, verified toggle, optional company link
- edit `src/components/admin/ContractorsTable.tsx` — "Add Independent Contractor" entry point
- new migration — extend `calculate_directory_eligibility` for `building_consultant` + `skilled_labor`

## Out of scope
- No changes to `CompanyRegistration.tsx` (public signup) — admin path only.
- No changes to homeowner-facing directory layout beyond verifying it renders the new rows.
