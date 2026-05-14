# Referrals upgrade — picker, broadcasts, lifetime binding, 30% GCN

## Why the partner list is empty today
`ReferCustomerModal` loads `usePartners()`, which only returns contractors where `is_directory_eligible = true`. Right now **all 4 contractors in the system are `pending` and `is_directory_eligible = false`**, so the dropdown is empty. We also don't filter by the trade the customer needs.

## What we'll build

### 1. Smart trade-matched partner picker (in Refer Customer modal)
- Customer fills: name, email, phone, address, **trade needed** (dropdown of available trades, picked first).
- Once a trade is selected, the "Refer To" list re-queries and shows **only contractors that perform that trade**, sorted by:
  1. GCN rating/score (high → low)
  2. Bounty offered for the estimated contract value (high → low)
- Each row shows: company name, rating + tier badge, service area, and the bounty they'll pay at the entered contract value (e.g. "Pays $450 — you keep $315").
- Eligibility relaxed: include contractors that are `verification_status = 'verified'` OR `is_directory_eligible = true` so the network isn't gated to zero while contractors are being onboarded.

### 2. Two referral modes
Inside the modal, a toggle:
- **"Send to one partner"** — current behavior, pick one company.
- **"Broadcast to top 3"** — customer is offered to up to 3 contractors. First 3 to message the customer can engage. After 3 have claimed, the broadcast is closed.

### 3. New "Available Referrals" tab
- New top-level tab in `ReferralsDashboard.tsx` between "Received" and "Payouts".
- Lists **open broadcasts** that match the contractor's trade and service area.
- Each card shows: trade, area, estimated value, expected bounty, time left, **claims remaining (3 of 3 / 2 of 3 / 1 of 3)**.
- "Message Customer" button claims a slot (atomic — race-safe via DB unique constraint) and opens the messaging thread. Once 3 contractors claim, the card disappears for everyone else.
- The customer sees up to 3 contractor messages and picks who to work with.

### 4. Lifetime client binding (forever residuals)
- Every customer added through a referral is **bound to the original referring contractor** in `client_pool` (already a unique `customer_id` table — perfect).
- A DB trigger on `referrals` insert ensures: if no `client_pool` row exists for that customer, one is created pointing to the referring contractor. If one already exists, it is **never overwritten**.
- Whenever any future referral for that customer reaches `status = 'won'`, a row is auto-inserted into `residuals` paying the original introducing contractor — even if a different contractor now sends the customer.

### 5. GCN 30% cut on every payout
- All bounty math switches from 75/25 to **70/30** (70% to the referrer/introducer, 30% to GCN).
- Updated in `ReferCustomerModal`, `BountyTiersTab` copy ("GCN takes 30%"), and the trigger that creates payout rows.

## Database changes (one migration)

```text
new table: referral_broadcasts
  id, customer_id, referring_contractor_id, trade,
  service_area, contract_value, bounty_amount, status (open|filled|expired),
  expires_at, created_at
  RLS: referrer + claimers + admin can read; insert via referrer

new table: referral_broadcast_claims
  id, broadcast_id, contractor_id, claimed_at, message_sent_at
  UNIQUE(broadcast_id, contractor_id)
  + trigger that rejects insert when broadcast already has 3 claims
  (atomic count-check inside SECURITY DEFINER function)
  RLS: contractor sees own claims; broadcast referrer sees all

trigger: bind_customer_to_introducer
  AFTER INSERT ON referrals
  upserts client_pool(customer_id, introducing_contractor_id)
  ON CONFLICT (customer_id) DO NOTHING  -- never reassigns

trigger: pay_introducer_residual
  AFTER UPDATE ON referrals  WHEN NEW.status='won'
  inserts residuals row paying client_pool.introducing_contractor_id

migration also: rewrites existing 25% gcn_share / 75% referrer_share defaults to 30 / 70 across functions and seed copy
```

## Files to change

- `src/components/referrals/modals/ReferCustomerModal.tsx` — trade-first flow, mode toggle (single vs broadcast), 70/30 math, partner cards w/ rating + bounty preview, broadcast insert path
- `src/hooks/referrals/index.ts` — `usePartners` accepts `trade` filter and sorts by score+bounty; new `useAvailableBroadcasts(contractorId)` and `useClaimBroadcast()` mutation; eligibility filter relaxed
- `src/pages/ReferralsDashboard.tsx` — add `"available"` tab "Available Referrals"
- `src/components/referrals/tabs/AvailableReferralsTab.tsx` (new) — list + claim UI
- `src/components/referrals/tabs/BountyTiersTab.tsx` — copy: "GCN takes 30%"
- `supabase/migrations/<ts>_referral_broadcasts_and_lifetime_binding.sql` — schema above

## Out of scope (ask before adding)
- Actual messaging UI — we'll wire the "Message Customer" button to the existing messaging route if one exists, otherwise stub it with a toast for now.
- Notifications/SMS to customers when broadcast goes out.
- Admin UI to release escrow / mark referrals `won` (already exists in admin).

Approve and I'll implement.