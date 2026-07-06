# GCN Equipment Store — Implementation Plan

Additive feature at `/equipment`. No existing routes, pages, or tables are modified. Uses current Supabase project.

## 1. Database (new tables only)

New migration creates 4 tables with RLS:

- `equipment_products` — catalog (rigs + parts), `cost_cents` restricted to admins via column-aware policy (split into a public view exposing everything except cost, plus a table-level admin SELECT). Public SELECT where `active = true`.
- `equipment_orders` — order_no auto-generated `GCN-######`. Public INSERT, admin SELECT.
- `equipment_order_items` — line items. Public INSERT tied to order, admin SELECT.
- `financing_leads` — public INSERT, admin SELECT.

Admin gate: reuse existing `has_role(auth.uid(), 'admin')` from `user_roles`. No changes to existing tables.

Seed data inserted for the 5 rigs and 6 parts exactly as specified (prices in cents).

## 2. Design system (scoped to /equipment)

Industrial jobsite / data-plate aesthetic implemented as CSS variables and utility classes scoped under a `.equipment-scope` wrapper so it does NOT leak into the rest of the app:

- Carbon `#0E1216`, cards `#171E26`, panels `#1F2833`, hairlines `#2B3644`, text `#F2F5F7` / `#93A1B0`, safety orange `#FF5A1F`/`#FF7A45`, green `#2FBF71`, amber `#FFB020`.
- Google Fonts loaded in `index.html`: Barlow Condensed 700/800, Barlow 400–700, IBM Plex Mono.
- Utility classes: `.eq-heading` (Barlow Condensed uppercase), `.eq-mono` (IBM Plex Mono for prices/specs/SKUs), `.eq-btn-primary` (safety orange), `.eq-btn-ghost` (steel outline), `.eq-plate` (12px radius card with 2px orange top border).

## 3. Pages & components

New folder `src/pages/equipment/` and `src/components/equipment/`:

- `pages/equipment/EquipmentStore.tsx` — full landing page: announcement bar → header → hero + spec ticker → rigs grid → parts grid → How It Works → financing section w/ calculator → FAQ accordion → footer.
- `pages/equipment/EquipmentAdmin.tsx` — `/equipment/admin`, admin-gated, orders + financing leads tables with status dropdown.
- `components/equipment/ProductCard.tsx` — data-plate card (name, cross-ref, spec table, price, compare-at strikethrough, launch-sale badge, `$X/mo financed*` for rigs ≥ $3k, admin-only dashed cost/margin line).
- `components/equipment/CartDrawer.tsx` — right-side drawer, qty steppers, BTO badge, pay-mode toggle (Deposit 50% vs Pay-in-Full −3%), freight-quoted-by-ZIP line, checkout button.
- `components/equipment/CheckoutDialog.tsx` — form (name, company, phone, email, address, ZIP, payment method), submits order, routes to Stripe / ACH message / financing lead.
- `components/equipment/FinancingModal.tsx` — application form; inserts to `financing_leads`; if `FINANCING_PARTNER_URL` constant is set, redirects with `?amount=` query.
- `components/equipment/PaymentCalculator.tsx` — amount input + term pills (24/36/48/60), formula `m = amount × (r/12) / (1 − (1+r/12)^-months)` at r=0.129, footnote.
- `components/equipment/FAQ.tsx` — 5-item accordion (exact copy from spec).
- `hooks/useEquipmentCart.ts` — Zustand-free lightweight React context + localStorage persistence; exposes items, add/remove/qty, subtotals, deposit/full mode math.

Routing: add lazy routes in `src/App.tsx`:
- `/equipment` → `EquipmentStore`
- `/equipment/admin` → admin-guarded `EquipmentAdmin` (wrap in existing `ProtectedRoute` + admin role check).

Wrap both in `<Suspense>`.

## 4. Edge functions

Two new functions in `supabase/functions/`:

- `create-equipment-checkout` — accepts `{ order_id, amount_cents, success_url, cancel_url }`, creates Stripe Checkout Session (mode `payment`), returns URL. Uses `STRIPE_SECRET_KEY` (to be added via secrets flow).
- `stripe-equipment-webhook` — verifies signature with `STRIPE_WEBHOOK_SECRET`, on `checkout.session.completed` updates order status to `deposit_paid` or `paid_full` based on metadata.
- `notify-equipment-order` — sends email to `sales@globalcontractor.network` via existing Resend connector on new order and new financing lead. Called from client after successful insert (or via DB trigger → not needed; simpler to invoke from client).

Both configured with `verify_jwt = false` in `supabase/config.toml`. CORS via `npm:@supabase/supabase-js@2/cors`.

Secrets required (I'll request via `add_secret` in build mode): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. `RESEND_API_KEY` already exists.

## 5. Cart & checkout math

- Subtotal = sum(line unit_price × qty).
- Deposit mode: `due_today = 0.5 × BTO_subtotal + parts_subtotal`; `balance = subtotal − due_today`.
- Pay-in-full mode: `due_today = subtotal × 0.97`; `balance = 0`; show "−3% discount applied".
- Freight line always reads "Quoted by ZIP at confirmation" (no numeric add).
- Order rows record `pay_mode`, `subtotal_cents`, `deposit_due_cents`, `balance_cents`.

## 6. Admin surface

- Product cards render dashed orange `COST $X · MARGIN $Y (Z%)` line when `has_role(user,'admin')`.
- `/equipment/admin`: two tables (orders, financing leads) with status dropdown on orders (`pending_payment`, `deposit_paid`, `paid_full`, `in_production`, `shipped`, `delivered`, `cancelled`).

## 7. Quality

Mobile-first (375px+), semantic HTML, Escape closes drawer/dialogs (Radix defaults), sonner toasts on add-to-cart, `Intl.NumberFormat` for prices, `font-display: swap` to prevent CLS, focus-visible rings on all interactive elements.

## Technical Notes

- All new UI scoped under `.equipment-scope` — no impact on global theme.
- Cart persisted in `localStorage` under key `gcn-equipment-cart-v1`.
- Product images: use a placeholder gradient data-plate look for v1 (no image assets required); spec table is the visual anchor.
- No changes to `src/integrations/supabase/client.ts` or existing hooks.
- Zod schemas validate checkout + financing forms.

## Deliverables order in build mode

1. Migration (tables + RLS + seed) — pause for approval.
2. Request `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` via `add_secret`.
3. Edge functions.
4. Frontend (scoped styles → components → pages → routes).
5. Verify build + smoke test /equipment renders.
