# Make the New Referrals Dashboard Reachable

## Why you don't see it

The new dashboard was built and the route `/dashboard/referrals` is registered in `src/App.tsx`, but **nothing on `/member/dashboard` links to it**. The existing "Referrals" tile in `MemberDashboard.tsx` (line 202) still points to the **legacy** page `/contractor/referrals` — that's the screen you're seeing.

You can confirm right now by visiting the URL directly:

```
/dashboard/referrals
```

If that loads the new cream/green/gold dashboard, the build is fine — it's just an entry-point problem.

## Plan

### 1. Repoint the contractor dashboard tile
In `src/pages/MemberDashboard.tsx` (line 202), change the existing "Referrals" tile in `contractorApps` so its `link` is `/dashboard/referrals` instead of `/contractor/referrals`. Keep the icon, title, and description.

### 2. Update the description to reflect the new product
New copy:
> "Earn bounties, manage your client pool, and track residuals."

### 3. Leave the legacy page in place (safety net)
Do **not** delete `/contractor/referrals` or `ContractorReferralsPage.tsx`. The old route stays mounted so any deep links / bookmarks still resolve. We can deprecate it in a later pass once you confirm the new dashboard covers everything.

### 4. Optional — add a sidebar link
The CRM `AppSidebar.tsx` is the only sidebar in the app and it serves the CRM, not the member portal. The member dashboard is tile-based, so there's no global sidebar to add a "Referrals" entry to. **No sidebar change needed** unless you want one added inside the new ReferralsDashboard shell itself.

## Files to edit

- `src/pages/MemberDashboard.tsx` — one-line link + description change on the Referrals tile.

## Out of scope

- No DB changes.
- No changes to `ReferralsDashboard.tsx` or its tabs/modals.
- No removal of the legacy referrals page.

## Verification

1. Reload `/member/dashboard` as a contractor.
2. Click the **Referrals** tile under "Apps".
3. You should land on the new cream/green/gold 7-tab dashboard (Overview, Partners, My Bounty Tiers, My Clients, Sent, Received, Payouts).
