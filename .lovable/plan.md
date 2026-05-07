## Problem

The new contractor dashboard UI (MemberDashboard) no longer surfaces any way to submit a referral. The full `ReferralsDashboard` component (which contains the "Submit Referral" button + `SubmitReferralDialog`) exists in the codebase but is no longer routed or rendered anywhere. The current `ReferralEarningsCard` shown on `ContractorDashboard` is read-only — no submit action.

## Fix

Restore two entry points so contractors can create a referral from the new UI:

1. **Add a "Submit Referral" button to `ReferralEarningsCard`**
   - File: `src/components/contractor/ReferralEarningsCard.tsx`
   - Add a header action button (Plus icon, "Submit Referral") that opens `SubmitReferralDialog`.
   - Remove the `if (referrals.length === 0) return null;` early-return so the card (and button) is always visible for contractors. Show empty-state copy when no referrals exist.

2. **Add a dedicated Referrals page + nav tile**
   - New route: `/contractor/referrals` rendering `ReferralsDashboard` (passing the logged-in contractor's `profile.id`). Wire it up in `src/App.tsx` with the existing lazy-load + Suspense pattern.
   - New file: `src/pages/ContractorReferralsPage.tsx` — thin page wrapper that loads the contractor profile (same pattern as `ContractorDashboard`) and renders `<ReferralsDashboard contractorId={profile.id} />` plus a "Return to Dashboard" link to `/member/dashboard`.
   - Add a tile to `contractorApps` in `src/pages/MemberDashboard.tsx`:
     `{ icon: Lightbulb, title: "Referrals", description: "Submit and track customer referrals", link: "/contractor/referrals" }`

## Technical notes

- `SubmitReferralDialog` already exists and is fully wired to the `referrals` table via `useReferrals`. No DB or RLS changes needed.
- No backend changes. Pure UI restoration.
- Follows the project memory rule: sub-modules include a "Return to Dashboard" link back to `/member/dashboard`.

## Out of scope

- No changes to the referrals data model, payout logic, or RLS.
- No redesign of `ReferralsDashboard` itself — just re-exposing it.
