## Goal
Replace the bare-bones approve/reject controls in `PendingSignupsTable` with a proper admin workflow: clear approve/reject dialogs, structured rejection reasons, persisted audit fields, and email notifications to the applicant for both outcomes.

## 1. Database — add rejection audit columns
Single migration on `contractor_profiles`:
- `rejection_reason text` — short category (e.g. "missing_license", "incomplete_documents", "duplicate_account", "credentials_unverifiable", "other")
- `rejection_notes text` — free-form admin message included in the email
- `rejected_at timestamptz`
- `rejected_by uuid` (admin user id)

Mirror the same four columns on `companies` so company applications carry the same audit trail when they're rejected.

No RLS changes — both tables are already admin-writable.

## 2. Reject dialog (replaces the `confirm()`)
New `RejectSignupDialog` component opened from the Reject button in `PendingSignupsTable`. Captures:
- Reason category (Select with the 5 options above)
- Notes (Textarea, required, ≥ 10 chars) — this is what the applicant will read
- Confirm checkbox: "I understand this will email the applicant"

On submit:
- Update `contractor_profiles.subscription_status='rejected'` plus the four new columns
- If `company_id` is set, also update `companies.verification_status='rejected'` plus the four new columns
- Invoke the new edge function (below) with `{ contractorId, reason, notes }`
- Toast and refresh

## 3. Approve flow — keep existing dialog, add explicit email
The Approve dialog already exists (features picker). We will:
- Fire `notify-application-approved` for non-company applicants too (currently the company branch sends `notify-company-approved`; independents only get the per-feature email). The new function sends a clean "You're approved" email regardless of whether features were selected, so independents get notified the same way.
- Stamp `approved_at` and `approved_by` on `contractor_profiles` (use existing column if present; otherwise add to the same migration).

## 4. Edge functions (notifications)
Two new functions, both using the existing `RESEND_API_KEY` pattern already in use by `notify-company-approved`:

- `notify-signup-rejected` — input `{ contractorId, reason, notes }`. Looks up applicant email + name, sends a respectful rejection email containing the reason category (human-readable label) and the admin's notes. Includes a "Reply to discuss" CTA pointing at the support email.
- `notify-signup-approved` — input `{ contractorId }`. Generic approval email; called for every approval (companies still also receive the existing `notify-company-approved` branded email for backward compatibility — or we collapse them; see "Decision" below).

Both functions:
- Native `Deno.serve` + `corsHeaders`
- `verify_jwt = false` is the project default
- Validate input with a small zod-like manual check (matches existing function style)
- Return `{ success, messageId }` or `{ success: false, error }`

## 5. UI changes in `PendingSignupsTable`
- New "Reject" button opens `RejectSignupDialog` instead of `window.confirm`
- Show a "Rejected" row state with reason + notes tooltip when status is rejected (so admins can see history while filtering)
- Add a small status filter at the top: All / Pending / Rejected (so rejected applications don't disappear)

## Decision needed
Collapse `notify-company-approved` into the new `notify-signup-approved`, or keep both? Default in the plan: **keep both** — `notify-company-approved` is already deployed and includes the features list; `notify-signup-approved` is a thin generic notice for independents. Less churn, no risk of breaking the existing branded email.

## Files
- new migration — add 4 rejection columns to `contractor_profiles` and `companies`
- new `supabase/functions/notify-signup-rejected/index.ts`
- new `supabase/functions/notify-signup-approved/index.ts`
- new `src/components/admin/RejectSignupDialog.tsx`
- edit `src/components/admin/PendingSignupsTable.tsx` — wire reject dialog, add status filter, fire approval email for independents

## Out of scope
- No changes to `notify-company-approved` (still used by approve flow for companies).
- No bulk approve/reject.
- No changes to homeowner-side notifications.
