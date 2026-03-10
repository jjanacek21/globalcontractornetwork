

## Plan

Two main areas of work:

### 1. Measurement: Auto-add flat roof section after AI measurement

The current "Additional Sections" feature requires manual entry. For properties like 2847 NE 2nd Ave with a visible white flat roof, the AI only captures the pitched (tan/grey) roof. 

**Fix**: After AI measurement completes, automatically pre-populate an additional section labeled "Flat Roof (not detected by AI)" with roof type "flat" and 0 sqft — prompting the user to fill in the area. Also add a prominent banner after results saying "Does this property have additional roof sections? The AI may not detect flat or white roofs. Click 'Add Section' below to include them."

Changes in `src/components/crm/InlineRoofMeasurement.tsx`:
- After `setResult(data.data)`, auto-add a flat roof section to `additionalSections` if the AI detects a pitched roof
- Add an info banner above the Additional Sections card explaining that flat/white roofs are often missed
- Auto-expand the additional sections card (remove the dashed/collapsed feel)

### 2. Insurance Section: Expand sidebar + build 4 pages

**Sidebar** (`src/components/crm/CRMSidebar.tsx`):
- Expand `insuranceItems` array to include: Claims, Carriers, Adjusters, Supplements (4 items total, replacing Scope Intelligence)

**New pages** (each in `src/pages/crm/`):
- `CRMInsuranceCarriers.tsx` — Table of insurance carriers with name, phone, email, portal URL. "Add Carrier" button with dialog.
- `CRMInsuranceAdjusters.tsx` — Table of adjusters with name, carrier, phone, email, assigned claims count. "Add Adjuster" button.
- `CRMInsuranceSupplements.tsx` — Table of supplements with claim reference, amount requested, amount approved, status, date submitted.
- Update existing `CRMInsuranceClaims.tsx` — keep as-is (already has placeholder UI)

**Database**: Create 3 new tables:
- `insurance_carriers` (id, user_id, name, phone, email, portal_url, notes, created_at)
- `insurance_adjusters` (id, user_id, carrier_id FK, name, phone, email, notes, created_at)  
- `insurance_supplements` (id, user_id, claim_reference, amount_requested, amount_approved, status, date_submitted, notes, created_at)
- RLS: all use `user_id = auth.uid()` for authenticated access

**Routes** (`src/App.tsx`):
- Add routes for `/member/crm/insurance/carriers`, `/member/crm/insurance/adjusters`, `/member/crm/insurance/supplements`
- Add lazy imports for the 3 new page components

### Files to create/modify:
- `src/components/crm/InlineRoofMeasurement.tsx` — auto-add flat section + info banner
- `src/components/crm/CRMSidebar.tsx` — update insurance nav items
- `src/pages/crm/CRMInsuranceCarriers.tsx` — new
- `src/pages/crm/CRMInsuranceAdjusters.tsx` — new
- `src/pages/crm/CRMInsuranceSupplements.tsx` — new
- `src/App.tsx` — add routes + lazy imports
- Database migration for 3 new tables with RLS

