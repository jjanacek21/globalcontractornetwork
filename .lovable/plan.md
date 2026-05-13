## Goal

Turn the pending-signup approval flow into a real review-and-list pipeline:
admins can open and review a full application before approving, every approved
company gets a public profile with a roster of its reps, individual sub-
contractors / handymen / building consultants can also build standalone
profiles, and homeowners can filter the directory to verified-only.

---

## 1. Application detail view (Super Admin → Pending Signups)

In `src/components/admin/PendingSignupsTable.tsx`, make the company name a
clickable link that opens a new `ApplicationDetailDialog`. The dialog pulls
the full record from `companies` + `contractor_profiles` and shows:

- Logo + banner preview
- Company info (name, address, phone, email, website, years in business,
  revenue range, description)
- Credentials (license #, state, expiration; insurance provider/policy/exp;
  workers comp; uploaded license/insurance/WC PDFs from `licenses`,
  `insurance_document_url`, `workers_comp_document_url`)
- Job photos gallery (`companies.job_photos`) — click to lightbox
- Client references (`companies.client_references`) with name / phone /
  email / project type
- Social links (`companies.social_links`) and Google Business URL
- A computed credential checklist with green/red ticks (license present,
  insurance present, WC present if `has_crew`, ≥3 references, ≥5 photos)
  driving an "Eligible for verified badge" status

The existing Approve / Reject buttons remain in the dialog footer.

## 2. Profile picture on registration + edit

- Add a "Profile / Logo Picture" upload step to `CompanyRegistration.tsx`
  (Step 1) using the existing `company-photos` bucket; save to
  `companies.logo_url`. Make it optional but encouraged.
- For solo sub-contractors / handymen / consultants who don't register a
  company, surface the same `ProfileImageUpload` in their dashboard editor
  (write to `contractor_profiles.logo_url`) — already exists in
  `ContractorDashboard.tsx`, just ensure it's reachable for these new
  contractor types.

## 3. Public Company Profile page — `/company/:companyId`

New page `src/pages/CompanyProfile.tsx`:

- Banner + logo header, verified badge if `verification_status='verified'`
- Tabs: Overview · Photos · References · Reviews · Team
- Overview: bio, services, service area, license/insurance summary (no
  document files), social links, contact CTA
- Team tab: queries `contractor_profiles WHERE company_id = :id` and
  renders cards for every rep (avatar, name, title, category, verified
  chip). Each card links to `/contractor/:contractorId`.

## 4. Public Rep Profile page — `/contractor/:contractorId`

New page `src/pages/ContractorPublicProfile.tsx` rendering an individual
contractor's public profile: avatar, name, title, bio, category +
secondary trades, services, gallery (`profile_gallery`), social links,
parent company link, verified badge, contact button. Works for both
company reps and standalone contractors (handyman / skilled labor /
building consultant).

## 5. Directory upgrades — `src/pages/ContractorDirectory.tsx`

- Wrap each card in a link to `/company/:id` (or `/contractor/:id` for
  solo profiles).
- Wire the existing `verifiedOnly` toggle to filter on
  `verification_status='verified'` (currently only checks `is_verified`).
- Add a "Profile type" filter: All · Companies · Building Consultants ·
  Handymen · Skilled Labor — driven by a new
  `contractor_profiles.profile_type` value.
- Show the verified gold/green check badge on cards.

## 6. Solo sub-contractor / handyman / building consultant signup

Add a lightweight registration variant (reuse `CompanyRegistration.tsx`
or a slim `IndividualRegistration.tsx`) that sets:

- `contractor_profiles.contractor_type = 'subcontractor' | 'handyman'`
- new `profile_type` enum: `building_consultant | handyman | skilled_labor | company`
- `company_id = null`
- captures avatar, bio, category/trade, services, photos, social links,
  optional license/insurance

These flow into the same Pending Signups queue and the same approval
dialog, then appear in the directory with their own profile page.

## 7. Verified badge & auto-attach logic

- On approval (existing handler), if credential checklist passes,
  set `companies.verification_status='verified'`,
  `contractor_profiles.is_verified=true`,
  `verification_status='verified'`, `verified_at=now()`,
  `verified_by=auth.uid()`. Otherwise approve as listed-but-unverified.
- Any contractor signing up with a `company_id` is already linked via
  `contractor_profiles.company_id`; the company profile's Team tab will
  pick them up automatically once approved.

---

## Database changes

```sql
-- Solo profile categorization
ALTER TABLE public.contractor_profiles
  ADD COLUMN profile_type text
  CHECK (profile_type IN ('company','building_consultant','handyman','skilled_labor'))
  DEFAULT 'company';

-- Public-read RLS for approved/verified company + contractor profiles
-- (add SELECT policies if not already present so /company/:id and
--  /contractor/:id work for anonymous homeowners).
```

No destructive changes; all new fields are additive and nullable.

---

## Technical notes

- New routes added to `src/App.tsx`:
  `/company/:companyId` → `CompanyProfile`,
  `/contractor/:contractorId` → `ContractorPublicProfile`.
- Reuse existing buckets: `company-photos` (logos/banner/gallery),
  `company-documents` (license/insurance PDFs, admin-only signed URLs).
- Reuse existing components: `ProfileImageUpload`, `GalleryManager`,
  `SocialLinksEditor`, `ReferencesEditor`, `ServicesEditor`.
- Verified badge styling: gold check, consistent across directory, company
  profile, and rep profile.
- All public-profile queries are anonymous-safe (no auth required) via
  permissive SELECT RLS scoped to `verification_status IN ('verified','active')`.
