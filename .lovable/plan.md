## Goal
Make every CRM auth surface unreachable. The user said "CRM auth routes and pages (like `/crm/auth`)" — I'm interpreting this strictly as the **auth-gateway** to the CRM, not the entire CRM module (the `/member/crm/*` portal stays since it's still wired up and gated by Lovable Cloud auth elsewhere). If you also want the full `/member/crm/*` and `/crm/*` CRM portal removed, say the word and I'll do that as a follow-up.

## Changes

### 1. Remove the `/crm/auth` route
`src/App.tsx` line 509 — delete:
```tsx
<Route path="/crm/auth" element={<Auth />} />
```

### 2. Stop linking to `/crm/auth`
- `src/components/landing/LandingFeatureCards.tsx` lines 33 & 54 — replace `link: "/crm/auth"` with `link: "/join"` (the network signup) so the landing CTAs still resolve.
- `src/pages/ResetPassword.tsx` lines 105 & 163 — replace the two `navigate("/crm/auth")` calls with `navigate("/join")`.

### 3. Update `ProtectedRoute` default redirect
`src/components/auth/ProtectedRoute.tsx` line 15 — change the default `redirectTo` from `"/crm/auth"` to `"/join"` so any orphaned protected route falls back to the network signup instead of a dead URL.

### 4. Add a hard redirect for any direct hits
At the bottom of the route table (just above the `*` catch-all in `src/App.tsx`), add:
```tsx
<Route path="/crm/auth" element={<Navigate to="/join" replace />} />
```
This guarantees any bookmarked or external link to `/crm/auth` lands on a valid page instead of the 404.

### Files touched
- `src/App.tsx`
- `src/components/landing/LandingFeatureCards.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/pages/ResetPassword.tsx`

No DB or backend changes. The `Auth` page component itself stays in the codebase (it's also mounted at `/auth` for the legacy admin/CRM combined login) — only the `/crm/auth` URL is killed.
