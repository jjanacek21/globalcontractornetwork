# Contractor access overhaul + retire Supplement Kings & Green Home Solutions + admin approval review

## What changes for contractors

**Auto-granted on signup (always on, no admin approval):**
1. Permit Expediter (Permit Queens)
2. GCN App / Member Dashboard
3. Job Marketplace
4. Contractor Directory listing
5. PropertyIQ
6. Referral Platform

**Plus auto-granted contractor services:**
7. Estimating & Supplementing tools
8. Digital Marketing services
9. Training Academy

Everything else (CRM-style internal tools etc.) stays gated as today. Admin still approves the **public directory listing visibility** because that requires verified credentials.

## What goes away
- Supplement Kings — pages, routes, feature key, dashboard cards.
- Green Home Solutions — pages, routes, feature key, dashboard cards.
- Existing landing/marketing references in `LandingFeatureCards`, `LandingTestimonials`, `LandingHeader`, `LandingFooter`, `HomeownerServices`, `ContractorTools`, `CategoryGrid`, `Index`, `Login`, `MemberDashboard`, `GlobalAIChat`, `SuperAdminDashboard`.
- The "Estimating / Supplementing" workflow that previously lived under Supplement Kings becomes a generic **Estimating & Supplementing** card under Contractor Services (no separate sub-brand).

## What admins get

A new **Pending Approvals** review screen (one per contractor + one per company) that shows, before the approve/reject buttons, **everything the applicant submitted**:

- Profile basics (name, company, category, secondary trades, service area, bio)
- Contact info (phone, email, website, social links)
- License details + license document(s)
- Insurance provider, policy #, expiration + insurance document
- Workers comp provider + document
- Profile gallery / banner / logo
- Job photos (gallery, click to enlarge)
- Client references (name, phone, email, project — clickable to call/email)
- Years in business, revenue range, verification score (auto-calculated)
- Any uploaded miscellaneous documents

Reject flow keeps existing `rejection_reason` + `rejection_notes` fields; approve flow stamps `approved_at` / `approved_by` and (for companies) flips `is_directory_eligible` per the existing trigger.

## Database changes (one migration)

```text
1. Update default contractor onboarding (handle_new_user / new RPC):
   - On contractor signup, auto-insert contractor_feature_access rows with is_approved=true for:
     permit_queens, gcn_app, job_marketplace, directory_listing,
     property_iq, referral_network, estimating_supplementing,
     digital_marketing, academy_access
   - Do this via a new SECURITY DEFINER function grant_default_contractor_features(contractor_id)
     called from contractor profile insert trigger.

2. Backfill existing contractor profiles with the same default features.

3. Remove deprecated feature keys: supplement_kings, green_home_solutions
   (delete rows from contractor_feature_access).

4. Add table contractor_documents:
   id, contractor_id (or company_id), doc_type
   ('license' | 'insurance' | 'workers_comp' | 'w9' | 'other'),
   file_url, file_name, uploaded_at
   RLS: contractor manages own; admins read all.

5. Add storage bucket 'contractor-credentials' (private)
   with RLS: contractor reads/writes {contractor_id}/* path; admins read all.
```

## Frontend files to change

- `src/hooks/useContractorFeatures.ts` — replace `AVAILABLE_FEATURES` with the 9 auto-granted set; remove supplement_kings/green_home_solutions; default `hasFeature` to true if feature is in the auto-granted list (defensive, in case DB row missing).
- `src/components/admin/ContractorsTable.tsx` — same feature list cleanup; remove deprecated keys.
- `src/components/admin/ContractorFeatureAccess.tsx` — same.
- `src/App.tsx` — delete the 6 routes for `/supplement-kings/*` and `/green-home-solutions/*`.
- Delete pages: `SupplementKings.tsx`, `SupplementKingsContractorAuth.tsx`, `SupplementKingsContractorDashboard.tsx`, `SupplementKingsAdminAuth.tsx`, `SupplementKingsAdminDashboard.tsx`, `GreenHomeSolutions.tsx`, `GreenHomeSolutionsAdminAuth.tsx`, `GreenHomeSolutionsAdminDashboard.tsx`.
- Delete `src/components/green-home/` and `src/components/supplement-kings/` directories (after confirming nothing references them outside the removed pages).
- Strip references in `LandingFeatureCards`, `LandingTestimonials`, `LandingHeader`, `LandingFooter`, `HomeownerServices`, `ContractorTools`, `CategoryGrid`, `Index`, `Login`, `MemberDashboard`, `GlobalAIChat`, `SuperAdminDashboard`. Replace any "Supplement Kings" tile in MemberDashboard with a generic **Estimating & Supplementing** tile linking to a new `/contractor/estimating` route (lightweight placeholder page wired to the new feature key).
- New page `src/pages/ContractorEstimating.tsx` — minimal landing for the unified Estimating & Supplementing service (we can flesh it out later; today it's a hub linking to existing estimate-builder utilities).
- New admin component `src/components/admin/ContractorReviewDialog.tsx` — replaces the current edit dialog for contractors that are still `verification_status = 'pending'`. Shows everything listed above in a read-only review layout with Approve/Reject buttons at the bottom.
- Enhance `src/components/admin/CompanyDialog.tsx` — when in `view` mode and `verification_status = 'pending'`, surface job photos, references, license/insurance docs and uploaded credential files at the top with **Approve** / **Reject** primary buttons (today these are buried in form mode).
- New tab in `SuperAdminDashboard` (and `CompanyAdminDashboard` for that company's own pending team members) called **"Pending Approvals"** that lists pending contractors and companies and opens the review dialogs.

## Out of scope (will ask before adding)
- Building out the actual Estimating & Supplementing app behind the new tile (today it'll be a hub page).
- Email notifications when admin approves/rejects (existing notification system can be wired separately).
- Migrating any historical Supplement Kings / Green Home Solutions lead data (we'll leave the tables intact; only the UI/routes go away).

Approve and I'll implement.