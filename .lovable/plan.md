## Goal

Get a clean, accurate picture of what's actually in the database for this app, find out where the other two apps' data really lives, and prepare unified auth + Stripe plumbing — without deleting anything until you approve each item.

## What I already confirmed

- **This app (globalcontractor.network)** runs on Lovable Cloud, Supabase ref `ujalvgknnbsxqpujxvwk`. 226 public tables, RLS is enabled on all of them.
- **globalcontractor.app** (estimating, "Global Contractor App") is on a **different Supabase project**: ref `pqeheibflaetpcqzkral`. Not the same account/project as this app.
- **GCN.support** isn't visible from this workspace yet, so I can't see where its backend points.
- Important constraint: once Lovable Cloud is enabled on a project it **cannot be repointed** to a different Supabase. So whichever Supabase project ends up being "the master" will be the one all three apps connect to as a shared backend; we don't move this app off Cloud.

## Phase 1 — Backend inventory (read-only, no changes)

I produce one report covering:

1. **Per-app backend map** — for each of the 3 apps: Supabase project ref, URL, anon key location, where auth users live, whether `profiles` / `user_roles` / `super_admins` exist there. To do this for GCN.support I need either (a) workspace access to that Lovable project, or (b) you paste its `.env` (URL + anon key) so I can compare.
2. **Legacy table report** for this app's DB — every public table grouped as:
   - **Active** (referenced in `src/`)
   - **Legacy / brand-removed** — confirmed candidates already visible: `coating_leads`, `coating_admins`, `window_leads`, `window_admins`, `supplement_leads`, `supplement_lead_*`, `supplement_admins`, `supplement_contractors`, `roofing_admins`, `roofr_reports`, `gcn_customers`, `gcn_reviews`
   - **Possible duplicates** to reconcile: `crm_jobs` vs `jobs` vs `contractor_jobs` vs `job_requests`; `contacts` vs `customers` vs `gcn_customers`; `leads` vs `contractor_leads` vs `marketing_leads`; `permit_contractors` vs `contractor_profiles`
   - **Demo data** (e.g. `piq_*` rows with `a0000001-…` UUIDs)
   Each row gets row count, last write timestamp, and "safe to drop / archive / keep".
3. **Security gaps** — already spotted: `broadcast_consent_tokens` has 0 RLS policies. Full lint + missing-policy list will be in the report.
4. **Schema export** of this app's Supabase as a `.sql` dump in `/mnt/documents/` so you have a portable copy for any future move.

Deliverable: a single markdown report + the `.sql` dump. Nothing deleted, nothing migrated.

## Phase 2 — Pick the master backend (your call after Phase 1)

After reading the report you tell me which Supabase becomes the shared one:
- A) This Cloud project (`ujalvgknnbsxqpujxvwk`) — simplest, no migration of this app's data.
- B) The estimating app's project (`pqeheibflaetpcqzkral`) — requires rebuilding this app fresh against it, since Cloud can't be repointed.
- C) A third Supabase you already own — same caveat as B.

Then I'll produce the migration plan for the other 1–2 apps to point at the chosen master (env swap + schema diff + data copy script).

## Phase 3 — Unified auth (cross-app SSO)

Once the master is chosen:
- Standardize on `auth.users` + `profiles` + `user_roles` + `super_admins` (this app's pattern is already correct).
- Enable email/password + Google on the master project.
- Turn on leaked-password (HIBP) check.
- All three apps use the same Supabase URL + anon key → automatic SSO; sessions persist across `globalcontractor.network`, `gcn.support`, `globalcontractor.app`.
- Add a shared `app_membership` table so a single user can have different roles per app (homeowner here, agent in support, estimator in the estimating app) without duplicating accounts.

## Phase 4 — Stripe plumbing only

You picked "just enable Stripe + webhook plumbing", so:
- Run the seamless Stripe payments flow (`enable_stripe_payments`) — no BYOK, no key paste.
- Create one `stripe_customers` table (user_id ↔ stripe_customer_id) and one `stripe_events` table for webhook idempotency.
- Deploy two edge functions: `stripe-checkout` (stub) and `stripe-webhook` (verifies signature, writes to `stripe_events`, dispatches by event type).
- No products, no prices, no checkout UI yet — added later when you define the catalog.

## Phase 5 — Cleanup execution (only after you approve the report)

For each row in the legacy report you mark **drop / archive / keep**. I then:
- Generate `*_archive` tables for "archive" rows.
- Generate one migration that drops "drop" tables.
- Update RLS / fix `broadcast_consent_tokens` and any other gaps surfaced by the linter.
- Re-run the security scan and confirm 0 critical issues.

## Out of scope for this round

- Building the actual Stripe product catalog or checkout pages.
- Custom domain / email-template work.
- Any data deletion before you've reviewed the Phase 1 report.
- Moving this app off Lovable Cloud (not possible without a fresh rebuild).

## What I need from you to start Phase 1

1. Confirm I can proceed with the read-only audit and `.sql` export now.
2. Either grant me workspace access to the GCN.support Lovable project, or paste its Supabase URL + anon key from its `.env`, so I can include it in the backend map.
