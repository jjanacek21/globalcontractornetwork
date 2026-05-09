## Goal

Build out the contractor lifecycle — company auto-approval, team invitations, vetting for independent crews/handymen, a public directory that shows both verified and unverified profiles (with a safety disclaimer), and admin tools to manage everything from `/admin/dashboard`.

---

## 1. Company registration → auto-approve + invite team

**Auto-approve companies on registration**
- In `CompanyRegistration` submission, set `companies.verification_status = 'verified'` immediately (instead of `pending`) and set `verified_at = now()`.
- Auto-insert the creator into `company_members` with `role = 'company_admin'`.
- Update `CompanyAdminDashboard` verification banner to only show when `verification_status != 'verified'` (already does).

**New: `company_invitations` table** (no table exists today)
- Fields: `id`, `company_id`, `email`, `role` (company_role enum), `team_id` (nullable), `job_title`, `token` (uuid, unique), `status` (`pending|accepted|expired|revoked`), `invited_by`, `expires_at` (default `now() + 14 days`), `created_at`, `accepted_at`, `accepted_user_id`.
- RLS: company_admins of the matching company + super_admins can SELECT/INSERT/UPDATE/DELETE; public SELECT only by `token` (used in accept flow via edge function — see below).
- Index on `token`, `email`, `company_id`.

**Invite flow (replace stub in `UsersSettings.tsx` "Invitation system coming soon")**
- Company admin enters email + role + optional team/job_title → insert `company_invitations` row.
- New edge function `send-company-invite`: sends Resend email with link `/contractor/auth?invite=<token>`.
- `ContractorAuth` reads `?invite=<token>` query param. On successful signup/login:
  - New edge function `accept-company-invite` validates token (not expired/accepted), inserts `company_members(user_id, company_id, role, team_id, job_title)`, marks invitation `accepted`, and stamps `contractor_profiles.company_id` if a profile exists (or pre-fills it on registration).
- Token never trusted client-side; all writes happen in the edge function with service role.

---

## 2. Contractor registration: types, vetting, directory eligibility

Three explicit `contractor_type` values already supported in code: `company_admin`, `independent`, `handyman` (we'll formalize).

**`ContractorAuth` updates**
- Add a "Who are you?" step:
  1. **Company team member** (joined via invite or selecting an existing verified company)
  2. **Independent contractor with crew** (vetting required)
  3. **Handyman / solo** (vetting required)
- Independent + handyman flows create `contractor_profiles` with `verification_status = 'pending'`, `is_directory_eligible = false`, `social_access_approved = false`, but **can immediately**:
  - Access Job Marketplace (`/job-board`) — confirm `JobBoardAccessGuard` allows pending contractors (right now it gates on a separate flag — we'll widen it to "any contractor profile exists").
  - Build their profile (gallery, references, services).
  - Access door-to-door tools.
- They are blocked from directory listing visibility (controlled by `is_directory_eligible`) until approved.

---

## 3. Public directory: show verified + unverified, with disclaimer

**`ContractorDirectory` page**
- Two sections (or filter chips): **Verified Pros** (badge: green check) and **Unverified Crews & Handymen** (badge: amber).
- Show a persistent disclaimer card above unverified results:
  > "These contractors have not been fully vetted. We recommend using them only for repairs, handyman work, or alongside a project consultant."
- Property owners can open any unverified profile. Profile detail page shows the same disclaimer banner inline.
- Add filter: `contractor_type` (Company / Independent / Handyman) and `verification_status`.

**Directory access request**
- New table `directory_access_requests`: `id`, `contractor_profile_id`, `request_type` (`directory` | `referral` | `social`), `status` (`pending|approved|denied`), `notes`, `reviewed_by`, `reviewed_at`, `created_at`. RLS: contractor sees own; super_admins see all.
- Add "Request directory listing" / "Request referral access" buttons on contractor dashboard that insert into this table.

---

## 4. Super Admin Dashboard (`/admin/dashboard`) enhancements

Existing tabs: Pending Signups, Leads, Contractors, Companies, Property Owners, etc.

**New tab: "Access Requests"** (between Pending Signups and Contractors)
- Shows rows from `directory_access_requests` with contractor info, request type, age, action buttons.
- Approve sets `contractor_profiles.verification_status = 'approved'`, `is_directory_eligible = true` (and/or `social_access_approved = true` for social/referral requests).

**Contractors tab — edit + assign**
- `ContractorsTable`: add an Edit row action that opens `ContractorDialog` in `edit` mode (already exists; ensure it covers all fields).
- New "Assign" sub-action opens a dialog to set `company_id` + `team_id` (dropdowns of all companies / teams in that company). Writes to both `contractor_profiles` and `company_members`.
- Bulk filter by `contractor_type`, `verification_status`.

**Companies tab**
- Add Edit (opens existing `CompanyDialog`/`CompanyManagementDialog` in edit mode).
- Quick toggle for `verification_status` (since we auto-approve, admins still need to be able to suspend).
- "Manage team" button → opens a panel that lists `company_members` for that company with role/team editors and an "Invite member" button (reuses the same invitation flow).

**Property Owners tab**
- Already exists (`PropertyOwnersTable`). Add Edit dialog: name, email, phone, primary address, notes.

**Teams**
- Add a "Teams" sub-section under each company (uses existing `TeamsTable` + `TeamDialog`) so admins can create/edit teams and assign members.

---

## 5. Job marketplace + tools access for pending contractors

- `JobBoardAccessGuard`: change `hasAccess` rule to "user has a `contractor_profiles` row" (regardless of verification) so independents and handymen can browse leads while waiting for vetting.
- Add a small amber banner inside the job board when `verification_status != 'approved'`:
  > "Your account is pending verification. You can browse and respond to jobs, but homeowners will see an 'unverified' badge until approved."

---

## 6. Out of scope (this plan)

- Stripe billing changes for contractor subscriptions.
- Email template redesign beyond the new invite email.
- Mobile-app-specific changes.

---

## Technical details

**New tables (one migration)**
- `company_invitations` (see fields above) + RLS using `is_company_or_super_admin(company_id)`.
- `directory_access_requests` + RLS.

**New edge functions**
- `send-company-invite` — Resend email, validates caller is company_admin via JWT.
- `accept-company-invite` — service-role insert into `company_members`, marks token consumed.

**Files to add**
- `supabase/functions/send-company-invite/index.ts`
- `supabase/functions/accept-company-invite/index.ts`
- `src/components/admin/AccessRequestsTab.tsx`
- `src/components/admin/AssignContractorDialog.tsx`
- `src/components/admin/PropertyOwnerEditDialog.tsx`
- `src/components/contractor-directory/UnverifiedDisclaimer.tsx`

**Files to edit**
- `src/pages/CompanyRegistration.tsx` — auto-approve + auto-create company_admin member.
- `src/components/settings/UsersSettings.tsx` — wire real invitation flow.
- `src/pages/ContractorAuth.tsx` — type selector + invite token handling.
- `src/pages/ContractorDirectory.tsx` — verified/unverified sections + disclaimer.
- `src/components/job-board/JobBoardAccessGuard.tsx` — relax to any contractor.
- `src/pages/SuperAdminDashboard.tsx` — add Access Requests tab.
- `src/components/admin/ContractorsTable.tsx` — Edit + Assign actions.
- `src/components/admin/CompaniesTable.tsx` — Edit + Manage Team.
- `src/components/admin/PropertyOwnersTable.tsx` — Edit dialog.

Approve to proceed and I'll build this in stages (DB migration → admin UI → contractor flows → directory polish).