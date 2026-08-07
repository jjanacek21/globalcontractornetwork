# GCN Store: public store domain, member pricing, guarantee

## Goal
`globalcontractor.store` serves the public storefront (no login, no join gate). Non-members can buy at list price. Network members get 15% off automatically. A 30-day money-back guarantee is promised on-page and in checkout.

## 1. Store domain / subdomain
Host routing already exists: `globalcontractor.store` (and `www.`, plus `store.globalcontractor.network`) render the storefront at `/`, with `/admin` behind auth. `globalcontractor.network` keeps the marketing homepage. Work here is verification only — plus adding `store.globalcontractor.network` in Project Settings > Domains if you want the subdomain live too (DNS: CNAME/A per the connect flow).

## 2. Member pricing (15% off)
- New hook `useMemberPricing`: returns `isMember` = signed-in user with a contractor/company profile (not homeowner-only), and `discountPct = 0.15`.
- Product cards show member price when `isMember` (list price struck through, "Member price — 15% off" badge). Non-members see list price plus a "Join the network for 15% off" line.
- Cart/checkout apply the discount to line unit prices, with a "Member discount −15%" row in the cart summary and the amount stored on the order (`member_discount_cents`, `is_member_order`) so admin sees what was applied.
- Contractors arriving from their dashboard are already signed in, so the discount applies automatically — no code path needed beyond auth detection.

## 3. Join Network CTA
- Header button and a hero/pricing band CTA: "Join the network — get 15% off" linking to the network join flow (`https://globalcontractor.network/join-network` when on the store host, `/join-network` on the main host).
- Hidden once the visitor is a signed-in member; replaced with a "Member pricing active" badge.

## 4. 30-day money-back guarantee
- Guarantee section on the storefront: full refund within 30 days if quality or specs do not match the published specs or the Graco/Titan counterpart claims.
- Short guarantee line inside the checkout dialog and the order confirmation screen.
- FAQ entry covering how to start a return.

## Technical notes
- Files: `src/hooks/useMemberPricing.ts` (new), `src/components/equipment/ProductCard.tsx`, `CartDrawer.tsx`, `CheckoutDialog.tsx`, `FAQ.tsx`, `src/pages/equipment/EquipmentStore.tsx`, `src/lib/utils.ts` (join URL helper).
- One migration adds `member_discount_cents` and `is_member_order` to `equipment_orders`.
- Discount is recomputed server-side is not currently in play (orders are inserted client-side); the plan records member status on the order and the admin confirms pricing on the written sales order before payment.
