## Goal

Remove the old `/join` landing page entirely and surface **Login** + **Join the Network** directly from the new homepage's right-side nav.

## Routing changes (`src/App.tsx`)

- Remove `import LandingPage from "./pages/LandingPage"`.
- Change `/join` to render `<JoinNetwork />` (the actual join-the-network signup page).
- Remove the now-redundant `/join-network` route (or keep it as a redirect to `/join` for any old links — recommend redirect to avoid 404s).

## Delete the page

- Delete `src/pages/LandingPage.tsx`.
- Quick grep for any other internal links pointing to `LandingPage` — none expected since `/join` now resolves to JoinNetwork.

## Homepage nav update (`src/pages/Home.tsx`)

Right-side nav cluster currently shows: `For Contractors` (ghost) + `Join the Network` (green) + mobile hamburger.

Change to:
- **Login** → `Link to="/login"` styled `btn btn-ghost`
- **Join the Network** → `Link to="/join"` styled `btn btn-green` (now lands on the real JoinNetwork page)
- Drop the redundant "For Contractors" button from this cluster (the nav links + dedicated Contractors section already cover that, and the user wants login + join surfaced here).

Mirror the same two buttons inside the mobile `Sheet` menu.

Footer link `Member Login → /login` already exists; leave as-is.

## Out of scope

- No changes to `JoinNetwork.tsx` content or `/login` (NetworkLogin) page.
- No other route or page touched.
