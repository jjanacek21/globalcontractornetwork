## Three fixes

### 1. Fix Buddy's Roofing registration (already approved)
In `supabase/functions/register-company/index.ts`, replace both references to the non-existent table `permit_companies` with `companies`:
- Line ~293: insert step
- Line ~410: rollback/cleanup step

Then clean up the orphaned profile row left behind for `Esveidy@buddysroofingfl.com` so they can register again.

### 2. Fix "Manage Company" error
`src/pages/CompanyAdminDashboard.tsx` (lines 77 and 88) queries the same non-existent `permit_companies` table. Change both to `companies`. Same root cause as the registration bug.

### 3. Fix auto-login on globalcontractor.network after signout
Auth logs show `POST /logout → 403 session_not_found` and `refresh_token_not_found`. The server session is already gone but the browser keeps stale tokens in `localStorage`, so `signOut()` throws, navigation happens, then on `/network-login` the code calls `getSession()` which returns the stale cached session and auto-redirects to `/member/dashboard`.

Changes:
- **`src/pages/MemberDashboard.tsx`** (`handleLogout`, line 171): call `supabase.auth.signOut({ scope: 'local' })` so the client always clears local storage even when the server session is missing. Wrap in try/catch and force-clear `localStorage` keys starting with `sb-` as a fallback. Then `navigate("/")` with `replace: true`.
- **`src/pages/NetworkLogin.tsx`** (lines 21–38): in the `checkSession` effect, call `supabase.auth.getUser()` (which validates the token against the server) instead of trusting `getSession()`. If `getUser` returns an error or null user, call `supabase.auth.signOut({ scope: 'local' })` to purge the stale session and stay on the login page. Only auto-redirect on a verified session.
- Apply the same `getUser`-based validation to the `onAuthStateChange` handler so a stale `INITIAL_SESSION` event doesn't trigger a redirect loop.
- Do the same `getUser` validation in `src/pages/Login.tsx` and `src/pages/Auth.tsx` if they have the same `getSession → navigate` pattern.

### Technical notes
- `signOut({ scope: 'local' })` never hits `/logout`, so it can't fail with `session_not_found`. It just clears the client.
- `getUser()` calls `/auth/v1/user`, which rejects expired/invalid tokens, unlike `getSession()` which only reads localStorage.
- No DB schema changes required for fixes 2 and 3.