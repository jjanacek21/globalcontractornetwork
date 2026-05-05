# Member Dashboard Restructure

## 1. Remove RoofScope AI Estimator (built in separate app)

**Frontend removals:**
- Remove `RoofScope AI Estimator` service tile from `MemberDashboard.tsx`
- Delete `src/components/roofscope/RoofScopeLayout.tsx` and any other `src/components/roofscope/*` files
- Delete pages: `src/pages/crm/RoofScopeAnalyzer.tsx`, `RoofScopeCustomers.tsx`, `RoofScopeDashboard.tsx`, `RoofScopeEstimates.tsx`
- Remove `/roofscope/*` routes from `src/App.tsx`
- Remove `useRoofScope.ts` hook

**Backend removals:**
- Delete edge function `roofscope-analyze` (call `supabase--delete_edge_functions`)
- Drop RoofScope tables (prefix `rs_*`) via migration: I will first run a `supabase--read_query` to enumerate exact tables, then issue a `DROP TABLE ... CASCADE` migration

## 2. Remove the in-app Roofing CRM (combined into separate app)

**Frontend removals:**
- Remove `Roofing CRM` service tile
- Delete `src/pages/crm/*` (all CRM pages — Dashboard, Contacts, Pipeline, Jobs, Estimates, Calendar, Insurance*, FollowUp*, StormCanvas, CanvassMap, ScopeIntelligence, SmartDocs, CrewPortal, EstimateBuilder, Presentations, Placeholder, Help, HomeownerPortal, Settings, PermitExpediter)
- Delete CRM-only components: `src/components/crm/*`, `src/components/layout/AppSidebar.tsx`, `AppHeader.tsx`, `AppLayout.tsx`
- Remove all `/crm/*` and `/member/crm` routes from `App.tsx`
- Remove CRM-specific hooks (useCRMJobs, useEstimateBuilder*, useEstimates, useContacts, useLeads, useProperties, useActivities, useNotes, useInspections, usePresentations, useContactDocuments, useContactCommunications, useGPSTracking, useDoorToDoorSession, usePropertyDispositions)

**Backend:** Leave CRM tables in place for now (they may still hold data the user wants exported). Plan will note this and ask before dropping. *Note: I will NOT auto-drop CRM tables — only RoofScope tables, since user explicitly said RoofScope's data should be deleted but only said the CRM module should be removed.*

## 3. Regroup remaining services into 3 top-level tabs

New dashboard layout — only 3 nav tabs at top:

```text
[ My Profile ]   [ Contractor Services ]   [ Contractor Apps ]
```

**My Profile tab** — combines personal + company management:
- Sub-tabs inside profile view: `Overview` · `Personal Info & Bio` · `My Projects` · `Communications & Service Requests` · `Points & Rewards` · `Company` (only if user is a company owner/admin → manage team, listing, links/references, company requests)
- Move `/homeowner-profile` content + `/homeowner-dashboard` projects into tabbed `MyProfile.tsx` page
- "My Projects" becomes a tab inside My Profile (not a separate dashboard tile)

**Contractor Services tab** (services GCN provides to contractors):
- Estimating / Supplementing
- Digital Marketing, Management & Design
- Permit Expediting
- Training Academy
- Directory (contractor lookup)
- (Also keep: Instant Quote — but flagged as **property-owner only**, shown only when `!isContractor`)

**Contractor Apps tab** (tools for running the business):
- Contractor Social Hub
- Job Marketplace
- Door to Door World
- PropertyIQ
- Future placeholder card: "GCN Business Suite (estimating, invoicing, contracts, prospecting, gamification, social, marketplace) — Coming Soon" linking to the new Lovable project once connected

## 4. Maintenance Membership — Coming Soon (homeowner-only)

- Replace current `/prep-property` link tile with a `Maintenance Membership` card visible **only when `!isContractor`**
- Card shows full program details (preventative maintenance plans, property care schedule, perks) but with a `Coming Soon` overlay badge and disabled CTA
- New page `src/pages/MaintenanceMembership.tsx` with the marketing details + waitlist signup (writes to a new `maintenance_membership_waitlist` table)

## 5. Profile moved to top of screen

- In header, replace the small avatar+name with a prominent **profile button on the top-left** of the dashboard header (next to logo) that opens the My Profile tab
- Mobile: profile button stays pinned top-right with avatar

## Technical notes

- New dashboard structure uses shadcn `Tabs` at the top of `MemberDashboard.tsx` driven by URL query param `?tab=profile|services|apps` so deep links work
- `contractorOnlyServices` array updated to remove RoofScope/Roofing CRM and reflect new groupings
- Routes file (`App.tsx`) cleaned of all `/crm/*`, `/roofscope/*` entries; lazy imports removed
- Add `homeownerOnlyServices = ["Instant Quote", "Maintenance Membership", "My Projects"]` filter
- Migration file: `DROP TABLE IF EXISTS public.rs_<each> CASCADE;` after enumerating
- `supabase--delete_edge_functions(["roofscope-analyze"])`

## Order of execution

1. Enumerate `rs_*` tables via read_query
2. Migration: drop RoofScope tables
3. Delete RoofScope edge function + frontend files
4. Delete CRM frontend (pages, components, hooks, routes)
5. Restructure `MemberDashboard.tsx` with 3 tabs + new profile header
6. Build `MyProfile.tsx` with internal sub-tabs (merging homeowner profile + projects)
7. Create `MaintenanceMembership.tsx` coming-soon page + waitlist table migration
8. Wire homeowner-only filter for Instant Quote / Maintenance Membership

## Open question before I start

The CRM has live data (contacts, jobs, estimates, measurements, etc.). Should I:
- (a) Just remove the UI and leave the data in the database for export later, or
- (b) Drop the CRM tables too?

I'll default to **(a)** unless you say otherwise.