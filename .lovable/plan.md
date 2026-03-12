

# PropertyIQ — Auth, Dashboard & Full Demo Experience

## What's Missing

Currently PropertyIQ has: landing page, search (3 seed properties), report page, and admin tab. But:
- No login/signup page
- No user dashboard
- No "Login" or "Dashboard" buttons in the header
- Search only matches 3 hardcoded addresses — entering a real address shows "No properties found"
- No way to see how the full app would function with APIs connected

## Plan

### 1. Create `src/pages/PropertyIQAuth.tsx`
Login/signup page following the PermitQueensAuth pattern:
- Email + password sign in/sign up tabs
- Redirects to `/property-iq/dashboard` on auth
- "Back to PropertyIQ" link
- Building2 icon branding

### 2. Create `src/pages/PropertyIQDashboard.tsx`
Protected dashboard (redirects to auth if not logged in) with:
- **Header stats**: Total Searches (47), Saved Properties (12), Active Alerts (3), Reports Generated (28) — demo numbers
- **Quick search bar** at top — same as landing page search
- **Saved Properties** section: shows the 3 seed properties as saved cards with owner name, roof score, last viewed date
- **Recent Searches** table: mock search history with addresses, dates, result counts
- **Alerts** section: cards showing mock alerts like "Roof Critical — 4520 S Dixie Hwy", "New Storm Data Available", "Owner Change Detected"
- **API Status** panel: shows connection status for Property Appraiser, Skip Tracing, Firecrawl, Sunbiz APIs — green/yellow/red indicators with "Connected", "Limited", "Not Configured" badges
- Logout button, user email display

### 3. Update `src/components/property-iq/PropertyIQHeader.tsx`
- Add "Login" and "Get Started" buttons linking to `/property-iq/auth`
- Show "Dashboard" and "Logout" links when user is authenticated (check session state)

### 4. Update `src/pages/PropertyIQ.tsx`
- Wire "Get Started" pricing buttons to `/property-iq/auth`

### 5. Update `src/pages/PropertyIQSearch.tsx`
- When a search query doesn't match seed data, show a **demo result card** that simulates what an API-connected result would look like: "Searching property appraiser databases..." then display a mock result for the entered address with placeholder owner data, roof score, and a "Generate Full Report" button
- This demonstrates the API workflow without real connections

### 6. Add routes to `src/App.tsx`
- `/property-iq/auth` → PropertyIQAuth
- `/property-iq/dashboard` → PropertyIQDashboard

## Files

| Action | File |
|--------|------|
| Create | `src/pages/PropertyIQAuth.tsx` |
| Create | `src/pages/PropertyIQDashboard.tsx` |
| Modify | `src/components/property-iq/PropertyIQHeader.tsx` |
| Modify | `src/pages/PropertyIQ.tsx` |
| Modify | `src/pages/PropertyIQSearch.tsx` |
| Modify | `src/App.tsx` |

No database changes needed — uses existing Supabase auth.

