## Goal

Restructure contractor signup so the path is clear, route subcontractor applications to the right company admin for approval, and let any contractor without a website spin up a simple landing page tied to their directory listing.

## 1. Restructure Join Network entry

Update `src/pages/JoinNetwork.tsx` so the contractor card opens a sub-chooser with three paths:

- **Join an existing company** → company selector + team selector → submits to that company's approval queue
- **Register a new company (owner/admin)** → existing `/register-company` flow
- **Independent: building consultant / handyman / skilled labor** → existing `/register-individual` flow

The existing single contractor form is split: "subcontractor → must pick a company" becomes the only company-attached path, and the legacy "independent contractor" option is removed in favor of `/register-individual`.

## 2. Company-admin approval queue for new sub-contractors

When a sub-contractor signs up and selects a company, their `contractor_profiles` row already gets `company_id` set with `verification_status='pending'`. Add a new tab in `CompanyAdminDashboard` called **"Pending Users"** that lists those rows and lets the company admin:

- View the contractor's profile (name, email, phone, license, bio, photos/docs uploaded)
- Approve → sets `verification_status='approved'`, creates a `company_members` row at the chosen role/team, calls `grant_default_contractor_features`
- Reject → sets `verification_status='rejected'` with a reason

New file: `src/components/company-admin/CompanyPendingUsersTab.tsx`. Add the tab in `CompanyAdminDashboard.tsx`.

The existing "Add User" button in `CompanyUsersTab` already covers admin-initiated invites (no change needed there); existing `CompanyTeamsTab` already supports multiple teams/offices and assigning reps.

## 3. Optional landing page for contractors without a website

For contractors whose `contractor_profiles.website` is empty, offer a one-click landing page generator. The page is hosted at `/c/:slug` and is auto-linked from the directory and the public profile.

### Schema (one migration)

Add to `contractor_profiles`:
- `landing_slug text unique` (lowercase, kebab-case)
- `landing_enabled boolean default false`
- `landing_headline text`
- `landing_subheadline text`
- `landing_about text`
- `landing_cta_label text default 'Request a Quote'`
- `landing_theme text default 'forest'` (forest | navy | charcoal)
- `landing_hero_image_url text`
- `landing_published_at timestamptz`

Public read policy: `landing_enabled = true`. Owner can update their own row.

### UI

- New tab in the contractor dashboard: **"Landing Page"** (`src/components/contractor/LandingPageBuilder.tsx`) — only visible when `website` is empty (or when they explicitly toggle "I want a GCN landing page anyway"). Form fields map to the new columns. "Publish" sets `landing_enabled=true` and `landing_published_at=now()`.
- New public page: `src/pages/ContractorLanding.tsx` route `/c/:slug` — hero, about, services, gallery, reviews, CTA → opens an inline lead form that writes to `contact_requests` with `referral_contractor_id = contractor.id`.
- Directory card and `ContractorPublicProfile`: when `landing_enabled` is true and `website` is empty, show a "View Site" button → `/c/:slug`.

### Implementation notes (technical)

- Generate slug from `company_name` + short suffix; validate uniqueness.
- Reuse existing `profile_gallery` and `client_references` JSONB for landing gallery/testimonials — no duplicate columns.
- All landing-page edits stay frontend (form + RLS-protected updates); no edge functions required.

## Out of scope

- Custom domains for landing pages (use `/c/:slug` only)
- Drag-and-drop builder (form-based for v1)
- Stripe / billing for landing pages
- Migrating any existing references to Supplement Kings or Green Home Solutions (already removed earlier)
