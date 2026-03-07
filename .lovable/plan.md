

## Plan: Add Firecrawl Intelligence to Master Admin Portal

### What
Add a new "Firecrawl Intelligence" sub-tab inside the existing **AI Training Center** tab on the SuperAdminDashboard (`/admin/dashboard`). This embeds the four Firecrawl tab components (NOA Search, Building Dept Crawler, Discovered Documents, Crawl Jobs) directly into the master admin portal.

### Changes

**1. `src/components/admin/AITrainingCenter.tsx`**
- Import `AdminFirecrawl` (or import the 4 individual tab components directly)
- Add a new `TabsTrigger` for `"firecrawl"` with a `Search` icon and label "Firecrawl Intelligence", styled with the purple active state like other tabs
- Add corresponding `TabsContent` rendering the `AdminFirecrawl` component (which already contains its own internal tabs)

That's it — one file, ~6 lines added. The standalone `/admin/firecrawl` route remains available as well.

