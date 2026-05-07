## Restore the homeowner profile experience

### What happened
The "My Profile" button in the header of `MemberDashboard` now routes everyone (including homeowners) to `/my-profile` → `src/pages/MyProfile.tsx`. That page is a generic 3-tab summary (Projects / Quotes / Requests) and is missing all the homeowner tools.

The full-featured page still exists at `/homeowner-profile` → `src/pages/HomeownerProfile.tsx` and already includes:
- Messages icon with unread badge → `/homeowner-messages`
- Notifications panel
- `MyJobsSection` (lists posted jobs + opens `CreateJobDialog` to post to the Job Marketplace)
- `PhotoGallery` (upload / delete project photos)
- `MyEstimatesSection`, `AppointmentsSection`, `FavoriteContractorsList`, `ReferralInvitationsSection`, `PendingReviewsCard`, `HomeownerNotes`, `SubmissionsList`

We just need to send homeowners back to that page.

### Changes

1. **`src/pages/MemberDashboard.tsx`** — route homeowners to the rich profile, contractors/admins to the summary:
   - Add a helper: `const profileRoute = (!isContractor && !isSuperAdmin) ? "/homeowner-profile" : "/my-profile";`
   - Replace both `navigate("/my-profile")` calls (header avatar button ~line 240, "Edit Full Profile" button ~line 360) with `navigate(profileRoute)`.

2. **`src/pages/MyProfile.tsx`** — safety net: if the logged-in user is a homeowner (not contractor, not super admin), `useEffect` redirect them to `/homeowner-profile` so deep links land on the full page too.

3. **Verify Job Marketplace posting works for the homeowner**:
   - `MyJobsSection` already renders a "Post a Job" CTA that opens `CreateJobDialog` and inserts into `job_requests` via `useHomeownerJobs`. No change needed; once the homeowner can reach `HomeownerProfile`, posting is restored.
   - The `/job-board` route (`JobBoardAccessGuard`) is the contractor-side browse view — homeowners do not browse there. Keep as is.

4. **Verify Messages**:
   - The header in `HomeownerProfile` already has a `MessageSquare` button → `/homeowner-messages` with the unread badge from `useHomeownerMessages`. No change needed.

### Technical notes
- No DB / RLS changes. All hooks and tables (`job_requests`, `homeowner_uploads` storage bucket, `social_conversations`, etc.) are already wired up.
- Role detection in `MemberDashboard` already exists via `isContractor`, `isSuperAdmin`, and the loaded `profile`. We reuse those flags — no new queries.