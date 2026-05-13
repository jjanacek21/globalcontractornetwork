# PropertyIQ Demo Mode

Goal: when a user clicks the "Try the Demo" button on the dashboard tile, PropertyIQ opens and behaves exactly like the real app — search, dashboard, and property reports — but reads from the seeded demo data already in the database (5 demo properties under the `a0000001-…` UUID pattern), with no login required and a clear banner stating it's a demo.

## What the user sees

1. From `/member/dashboard`, the PropertyIQ tile keeps its "Coming Soon" badge but the "Try the Demo" button now links to `/property-iq/dashboard?demo=1`.
2. Anywhere the `?demo=1` flag is present (or the `piq_demo` flag is set in sessionStorage), PropertyIQ:
   - Skips the auth gate and loads straight into the dashboard.
   - Shows a sticky amber banner across the top: **"Demo Mode — you're exploring PropertyIQ with sample data. Sign up to use it on your own properties."** with a "Sign Up" button linking to `/property-iq/auth`.
   - Loads dashboard stats, recent searches, and saved properties from the seeded demo rows so the screens look real, not empty.
   - Lets the user click into the seeded demo properties and see a full report (ATTOM data, AI score, storms, permits, owner info — all already in the DB for those 5 rows).
   - Lets them run searches; if the searched address doesn't match a seeded property, show a friendly "This is a demo — try one of the sample properties below" and list the 5 demo addresses as quick-pick chips.
3. Any write action (Save Property, edit notes, change API config, etc.) is intercepted and shows a toast: **"Demo mode — sign up to save changes."** No DB writes happen.
4. An "Exit Demo" link in the banner clears the flag and sends them to `/property-iq` (the marketing page).

## Files to change

- `src/pages/MemberDashboard.tsx` — change the PropertyIQ tile's `demoLink` from `/ni/dashboard` to `/property-iq/dashboard?demo=1`.
- `src/App.tsx` — wrap the `/property-iq/dashboard` route so the `ProtectedRoute` guard is bypassed when `?demo=1` is present (a small `DemoOrProtected` wrapper). Search and report routes already public — no change needed there.
- New `src/hooks/usePropertyIQDemo.ts` — reads `?demo=1` from URL on mount, persists `piq_demo=1` in `sessionStorage`, exposes `{ isDemo, exitDemo }`. Survives client-side navigation within `/property-iq/*`.
- New `src/components/property-iq/DemoBanner.tsx` — sticky top banner, amber theme, with Sign Up + Exit Demo actions. Mounted inside the PropertyIQ pages when `isDemo` is true.
- `src/pages/PropertyIQDashboard.tsx` — when `isDemo`:
  - Skip the `supabase.auth.getSession()` redirect.
  - Set `userEmail` to "Demo User".
  - Replace the user-scoped queries (saved properties, recent activity, stats) with queries scoped to the seeded demo property IDs (`id LIKE 'a0000001-%'`).
  - Render `<DemoBanner />` at the top.
- `src/pages/PropertyIQSearch.tsx` — when `isDemo`:
  - Render `<DemoBanner />`.
  - If the search query doesn't resolve to one of the 5 seeded properties, show a "Demo data only" empty state with the 5 sample addresses as clickable chips.
- `src/pages/PropertyIQReport.tsx` — when `isDemo`:
  - Render `<DemoBanner />`.
  - Allow viewing any of the 5 seeded property IDs; for non-seeded IDs, redirect back to `/property-iq/search?demo=1` with a toast.
  - Disable Save / Notes / Enrichment buttons (or show a toast on click).
- `src/pages/PropertyIQAuth.tsx` — add a small "Just looking? Try the demo" link below the auth form pointing to `/property-iq/dashboard?demo=1`.

## Demo data

No new DB rows or seed scripts needed — the 5 seeded rows under `id LIKE 'a0000001-%'` in `piq_properties` (and their related rows in `piq_property_scores`, `piq_storm_events`, `piq_permits`, `piq_owners`, `piq_property_ownership`) already exist and are protected per project memory. The dashboard's "stats" tiles in demo mode are computed from these rows so the UI looks populated.

## Write-protection pattern

A single helper `guardDemoWrite(isDemo, action)` wraps every mutation handler in the affected pages. In demo it shows the toast and returns early; otherwise it runs the original action. This keeps the change surgical and easy to audit.

## Out of scope

- No changes to RLS policies (the seeded rows are already readable by anon for the public report flow; if not, we'll add a single read-only RLS policy `id LIKE 'a0000001-%'` on the relevant `piq_*` tables — flag this once we wire it up if reads fail).
- No per-visitor sandboxed demo data — everyone sees the same 5 sample properties. This matches the simplest demo UX and avoids per-session provisioning complexity.
- The CRM removal work and other tiles are untouched.
