## Goal

Adapt the uploaded GCN Referral Dashboard spec to **this** project. Add a new authenticated route `/dashboard/referrals` with 7 tabs (Overview, Referral Partners, My Bounty Tiers, My Clients, Sent, Received, Payouts), backed by 8 new Supabase tables. Brand follows the cream/green/gold spec exactly. Purely additive — no changes to existing auth, layout, tables, or the existing `/contractor/referrals` page.

---

## 1. Database — one migration, 8 new tables (none exist yet)

All tables RLS-enabled. The contractor identity is resolved via existing `contractor_profiles.user_id = auth.uid()` (already used app-wide). We'll reuse the existing `get_contractor_profile_id()` SECURITY DEFINER function.

- **`gcn_customers`** — `id`, `email` citext unique, `name`, `phone`, `property_address` jsonb, `property_type`, `created_at`. RLS: any authenticated contractor can SELECT/INSERT (needed for the modals); UPDATE/DELETE super_admin only.
- **`gcn_reviews`** — `id`, `contractor_id` (→ contractor_profiles), `customer_id`, `stars` (1–5 check), `comment`, `on_time` bool, `nps` int, `created_at`. RLS: contractor reads own; super_admin all.
- **`referral_partner_tiers`** — `id`, `contractor_id`, `trade`, `tier_name`, `min_contract_value`, `max_contract_value`, `bounty_type` enum('flat','percent'), `bounty_amount`, `status` enum('active','paused'). RLS: owner full CRUD; everyone authenticated can SELECT active rows (needed for the directory cards).
- **`referrals`** — `id`, `referring_contractor_id` (nullable), `receiving_contractor_id`, `customer_id`, `trade`, `service_description`, `contract_value`, `bounty_amount`, `referrer_share`, `gcn_share`, `status` enum('in_progress','won','lost','expired') default 'in_progress', `escrow_release_at`, `paid_out_at`, `created_at`. RLS: SELECT if I am referrer or receiver, or super_admin. INSERT if I am referrer. UPDATE: super_admin only (Mark Won is Phase 3a).
- **`client_pool`** — `id`, `customer_id` unique, `introducing_contractor_id`, `invitation_status` enum('pending','accepted','declined') default 'pending', `invitation_sent_at`, `accepted_at`, `last_activity_at`, `churned_at`. RLS: introducing contractor full CRUD; super_admin all.
- **`residuals`** — `id`, `introducing_contractor_id`, `customer_id`, `triggering_contractor_id`, `triggering_referral_id`, `contract_value`, `residual_rate`, `residual_amount`, `status`, `paid_at`, `created_at`. RLS: introducing contractor SELECT; super_admin all writes.
- **`payouts`** — `id`, `contractor_id`, `type` enum('outbound_bounty','residual','gcn_fee','withdrawal'), `referral_id`, `residual_id`, `gross_amount`, `gcn_fee`, `net_amount`, `direction` enum('credit','debit'), `status` enum('pending','in_escrow','available','withdrawn','disputed'), `method`, `description`, `created_at`, `settled_at`. RLS: contractor SELECT own; super_admin all.
- **`contractor_scores`** — `id`, `contractor_id`, `score` (0–100), `tier` enum('bronze','silver','gold','platinum'), `residual_rate`, `quality`, `refs_given`, `refs_completed`, `ontime_nps`, `is_provisional`, `computed_at`. RLS: SELECT to anyone authenticated (used in directory); writes super_admin only.
- **`activity_log`** — `id`, `contractor_id`, `event_type`, `icon_token` enum, `color_token` enum, `message_html`, `created_at`. RLS: contractor SELECT own; INSERT via triggers/edge fn (super_admin).

**Helper view** `contractor_scores_public` — latest score row per contractor with company name + trade joined from `contractor_profiles`. SECURITY INVOKER, accessible to authenticated.

**Indexes** on every FK and `(contractor_id, created_at DESC)` for the activity feed and payout history.

**No demo seeding** — empty states are designed for; user can add seed data later if desired.

---

## 2. Routing & shell integration

- Add lazy route `/dashboard/referrals` in `src/App.tsx`, wrapped in `<Suspense>` and the existing `<ProtectedRoute>` (matches Core memory rule).
- Use the existing `AppLayout` shell so the global header + sidebar render normally. Apply the cream background + 48px grid pattern only inside the dashboard's main container.
- Add a "Referrals" sidebar link in `AppSidebar` pointing to `/dashboard/referrals`. Leave the legacy `/contractor/referrals` page untouched.
- Include the persistent "Return to Dashboard" link per Core memory rule.

---

## 3. Brand layer

- Add the cream/green/gold tokens to `src/index.css` as CSS vars **scoped to `.referrals-dashboard`** so we don't override the global forest-green theme. Tailwind utility classes will reference them via arbitrary values.
- Load `Fraunces` (serif) and `Inter` (body) via Google Fonts in `index.html`. Use Tailwind `font-serif` / `font-sans` only inside the dashboard scope.
- Build reusable styled primitives in `src/components/referrals/ui/`:
  - `GreenButton3D`, `GoldText3D`, `TierBadge` (bronze/silver/gold/platinum), `Pill` (green/gold/amber/rose), `BrandCard`, `KPICard` (with floating gold icon-chip + 3s float animation, staggered delay prop).
  - Skeleton variants matching cream/green palette.

---

## 4. Tabs (all 7)

Page composition: `src/pages/ReferralsDashboard.tsx` with tab state, hero strip, and tab nav (sticky, horizontal scroll on mobile). Each tab is a component in `src/components/referrals/tabs/`.

- **Tab 1 Overview** (`OverviewTab.tsx`) — 4 KPI cards (Lifetime Earned, Pending Payouts, Client Pool, Contractor Score), Score breakdown card with SVG circular gauge + 4 progress bars + "Next tier" footer chip, Earnings chart (recharts stacked BarChart, 6 months, Bonuses + Residuals), Recent Activity (latest 10 from `activity_log`, render `message_html` via `dangerouslySetInnerHTML` since it's pre-sanitized server-side per spec), Top Earning Partners (top 5).
- **Tab 2 Referral Partners** (`PartnersTab.tsx`) — header card with search + trade dropdown + "+ Refer Customer" CTA. Card grid from `contractor_profiles WHERE id != me AND is_directory_eligible = true` joined to `contractor_scores_public` and `referral_partner_tiers`. Card shows company, trade, city, score, tier badge, 3 bounty rows, two CTAs.
- **Tab 3 My Bounty Tiers** (`BountyTiersTab.tsx`) — trade tabs from distinct trades, editable tiers table with inline edit + Active/Paused toggle + ⋯ menu, "How Bounty Splits Work" 3-column info card. Empty state copy as specified.
- **Tab 4 My Clients** (`MyClientsTab.tsx`) — header with "Your Rate: X%" gold text + "+ Add Client". Reference card showing 4 residual tiers with current tier highlighted. Clients table joining `client_pool` + `gcn_customers` + aggregates from `referrals` and `residuals`.
- **Tab 5 Sent** (`SentTab.tsx` — scaffold) — 3 stat tiles + table.
- **Tab 6 Received** (`ReceivedTab.tsx` — scaffold) — 3 stat tiles + table; "Mark Won" button disabled with tooltip "Coming soon — backend logic in progress."
- **Tab 7 Payouts** (`PayoutsTab.tsx`) — 3 KPI cards (Available, In Escrow, GCN's Lifetime Cut). "Withdraw to Bank" button → toast "Withdrawals will be enabled when ACH integration ships." Payout History table sorted desc with prettified type labels.

---

## 5. Modals

- **`ReferCustomerModal.tsx`** — fields per spec, live estimate panel (compute from selected partner's tier schedule). Submit: insert `gcn_customers` (ON CONFLICT email DO NOTHING via upsert), then insert `referrals` with `status='in_progress'`. Toast + close + invalidate Tab 5 / Tab 1 queries.
- **`AddClientModal.tsx`** — name/email/phone/address, warning chip about acceptance. Submit: upsert `gcn_customers`, insert `client_pool` row pending. Stub the email log (no real send — note for follow-up Phase). Toast success.

Both use react-hook-form + zod, match brand styling.

---

## 6. Data layer

- One hook per tab in `src/hooks/referrals/`: `useReferralOverview`, `usePartners`, `useBountyTiers`, `useClients`, `useSentReferrals`, `useReceivedReferrals`, `usePayouts`. All use TanStack Query (already in project) keyed by current `contractor_profile_id`.
- A shared `useCurrentContractor()` hook resolves the row via `contractor_profiles.user_id = auth.uid()`.
- Apply the 1000-row pagination bypass pattern (Core memory) on `payouts` history and `activity_log` if counts exceed 1000.

---

## 7. Out of scope (explicit)

- No "Mark Won" edge function (Phase 3a). Button stays disabled.
- No real ACH withdrawal. Button toasts only.
- No `/admin/referrals` super-admin route (Phase 4b).
- No email actually sent for Add Client invite — logged stub only.
- No demo seed data; tabs render empty states cleanly until rows exist.
- No edits to existing `/contractor/referrals` page or any other table.

---

## 8. Acceptance checklist

- `/dashboard/referrals` accessible after contractor login, sidebar link visible.
- All 7 tabs render against live Supabase data with skeletons + empty states.
- Cream/green/gold brand applied only inside the dashboard, no global theme regressions.
- Refer Customer modal creates a `referrals` row visible in Tab 5.
- Add Client modal creates a `client_pool` row visible in Tab 4.
- Withdraw + Mark Won both disabled with the spec'd messages.
- Mobile: tabs scroll horizontally, KPIs collapse to 2 columns at <640px.
- Existing app, auth, layout, and 49 prior tables unmodified.

---

## Technical details

**New files**
- `supabase/migrations/<timestamp>_referral_dashboard_init.sql` (8 tables + enums + view + RLS + indexes)
- `src/pages/ReferralsDashboard.tsx`
- `src/components/referrals/ui/{GreenButton3D,GoldText3D,TierBadge,Pill,BrandCard,KPICard,BrandSkeleton}.tsx`
- `src/components/referrals/tabs/{Overview,Partners,BountyTiers,MyClients,Sent,Received,Payouts}Tab.tsx`
- `src/components/referrals/modals/{ReferCustomerModal,AddClientModal}.tsx`
- `src/components/referrals/charts/EarningsBarChart.tsx`
- `src/components/referrals/charts/ScoreGauge.tsx`
- `src/hooks/referrals/{useCurrentContractor,useReferralOverview,usePartners,useBountyTiers,useClients,useSentReferrals,useReceivedReferrals,usePayouts}.ts`

**Edited files**
- `src/App.tsx` — add lazy route under `<ProtectedRoute>` + `<Suspense>`.
- `src/components/layout/AppSidebar.tsx` — add "Referrals" nav link.
- `src/index.css` — add `.referrals-dashboard` scoped tokens + grid background utility.
- `index.html` — add Fraunces + Inter Google Font links.

Approve to proceed and I'll execute in order: migration → brand primitives → routing → Overview → Partners + Refer modal → Bounty Tiers → My Clients + Add Client modal → Sent/Received scaffolds → Payouts.