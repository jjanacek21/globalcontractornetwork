

## Issues Identified

### 1. Cannot Save Measurement (RLS Policy Error)
The `roof_measurements` table requires `company_id` to match a record in `company_members`. The contact's `company_id` is `null`, so the insert fails with an RLS violation.

**Fix**: Update the RLS INSERT policy to also allow inserts where `created_by = auth.uid()` (the logged-in user), not only company-based access. This way measurements can be saved by the user who created them regardless of company association. Also update SELECT/UPDATE/DELETE policies similarly.

### 2. Flat + Pitched Roof Not Both Measured
The Google Solar API returns segments it detects, but for properties with mixed roof types (a pitched house + a flat-roof structure), it may only capture the pitched portion. The current UI has no way to combine two separate measurements or add a second roof section.

**Fix**: Add a "Multi-Section Roof" feature to `InlineRoofMeasurement`:
- After AI measurement, show a button "Add Additional Roof Section" 
- Allow the user to manually enter a second section (flat area sqft) that gets added to the total
- The save function combines both sections into the final measurement record

### 3. No "Create Detailed Report" functionality
The Measurements page and inline measurement have no report generation button.

**Fix**: Add a "Generate Report" button that creates a printable/downloadable summary using the existing `MeasurementReport` component pattern, or navigates to a report view.

---

## Implementation Plan

### Step 1: Fix RLS policies for roof_measurements
Run a migration to add policies allowing `created_by = auth.uid()` access:
```sql
DROP POLICY IF EXISTS "Company members can insert measurements" ON roof_measurements;
CREATE POLICY "Users can insert measurements" ON roof_measurements
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Similar for SELECT, UPDATE, DELETE
```

### Step 2: Fix companyId fallback in InlineRoofMeasurement
When `companyId` is null, look up the user's company from `company_members` table before inserting. This ensures the company_id field is populated when possible.

### Step 3: Add multi-section roof support
In `InlineRoofMeasurement.tsx`:
- Add state for additional roof sections (flat area additions)
- After AI results display, show "Add Flat Roof Section" button
- Show a small form for additional sqft entry
- Combine totals in the display and save logic

### Step 4: Add report/PDF generation button
Add a "Generate Report" button next to the save button that produces a printable measurement summary using jspdf (already installed).

