## Plan: Property Owner Marketplace overhaul

### 1. MemberDashboard — remove "For Property Owners" tab, add Marketplace tile
File: `src/pages/MemberDashboard.tsx`

- For property owners (non-contractor, non-admin), hide the third tab ("For Property Owners") entirely. Tabs become 2 columns: My Profile + Services.
- Add a new tile to `homeownerServices` next to Directory:
  - `{ icon: Briefcase, title: "Job Marketplace", description: "Post jobs and browse listings in your area", link: "/homeowner/marketplace" }`
- Contractor view unchanged.

### 2. Remove Job Listings from HomeownerProfile
File: `src/pages/HomeownerProfile.tsx`

- Remove the `<MyJobsSection userId={userId} />` block and its import (it's moving to the dedicated marketplace page).

### 3. New page: Homeowner Marketplace
File: `src/pages/HomeownerMarketplace.tsx` (new)

Layout:
- Header with "Return to Dashboard" link → `/member/dashboard`.
- Section A: **My Listings** — uses existing `useHomeownerJobs` hook. Renders a horizontal/grid of compact cards showing: first photo, title, price (budget), Edit button, response count expanding `JobResponsesList`. "Post a Job" button opens existing `CreateJobDialog`. Edit opens the same dialog pre-filled (extend `CreateJobDialog` with optional `initialJob` + `onUpdate`).
- Section B: **Browse Marketplace** — list/map view toggle of all open jobs (other homeowners' listings) with privacy redaction:
  - Show: title, service category, description, photos, budget/price, urgency, timeline, posted-time.
  - Hide: full address, city/state, contact info, contractor "View Details" interest button. No click-to-call, no contact dialog.
  - New `PublicJobCard` component (or `JobCard` with `viewOnly` prop) that strips `MapPin`, `JobDetailsDialog` contact fields, and the express-interest CTA.
  - Map view: optional — show approximate area (city only) or skip map for v1 to keep address private. **Decision:** include map view but plot only city-level (no exact pin); if too complex, omit map and keep list-only. Will implement list-only first to honor privacy.

### 4. Data fetching for public marketplace
- Reuse Supabase `job_requests` query filtered to `status='open'`, exclude current user's own jobs.
- New lightweight hook `usePublicJobMarketplace.ts` returning sanitized rows (drop `property_address`, `homeowner_*` contact fields client-side; ideally also create a DB view later, but for now strip in-app).

### 5. Routing
File: `src/App.tsx`
- Add lazy-loaded route `/homeowner/marketplace` → `HomeownerMarketplace`, wrapped in `Suspense` + `ProtectedRoute`.

### 6. Edit listing support
- Extend `CreateJobDialog` to accept `job?: JobRequest` and call `updateJob` (add to `useHomeownerJobs`) when present. Existing `createJob` path unchanged.

### Out of scope
- No DB schema changes; RLS already restricts contact info access. Address redaction is enforced in UI by simply not selecting/displaying those fields.
- No changes to contractor-facing `/job-board`.

### Question
The map view for browsing other homeowners' listings reveals location. **Should I:**
(a) skip the map view for the public browse section (list-only), or
(b) include a map but plot only the city centroid (approximate)?
