

## Plan: Fix Measurement-to-Estimate Flow and Flat Roof Handling

### Problems Identified

1. **"Measure Roof" from lead page** — no inline measurement on the Lead Detail page; it should work the same as Contact Detail.
2. **"Use for Estimate" button** on saved measurements opens a dialog instead of navigating to the estimate builder with the measurement pre-selected.
3. **Estimate builder doesn't auto-select measurement** — when navigating from a contact with `contact_id`, the measurement step loads ALL measurements instead of filtering by that contact, and doesn't auto-select the most recent one.
4. **Flat roof not accounted for** — The edge function applies `1/cos(pitch)` even when the AI identifies the roof as flat. There's no mechanism to override the calculation based on the AI's suggestion or user's flat roof selection. For coatings/flat roofs, `pitched_area` should equal `flat_area` (multiplier = 1.0).

### Changes

#### 1. Edge Function: `solar-roof-measure/index.ts`
- Add an optional `roof_type_override` parameter (`"flat"` | `"low_slope"` | `"pitched"`).
- When `roof_type_override === "flat"`, force `pitchMultiplier = 1.0` and `wastePercent = 5` (flat roof waste).
- When `roof_type_override === "low_slope"`, force `pitchMultiplier = 1.02` and `wastePercent = 5`.
- This lets the client-side override take effect in the actual calculation.

#### 2. `InlineRoofMeasurement.tsx` — Flat Roof Override
- Add a roof type toggle group (Flat / Low Slope / Pitched) like `AIRoofMeasurement.tsx` has.
- When user selects "Flat", recalculate displayed values locally: set `total_pitched_area_sqft = total_flat_area_sqft`, `pitch_multiplier = 1.0`, `waste_percent = 5`, and recompute squares.
- Auto-select "Flat" when AI suggests `flat`.
- Pass the override when saving so the stored measurement reflects the corrected values.

#### 3. `InlineRoofMeasurement.tsx` — Save Function Improvement
- After save, show a "Create Estimate" button that navigates to `/member/crm/estimates/new?contact_id={contactId}&measurement_id={savedMeasurementId}`.

#### 4. `CRMContactDetail.tsx` — "Use for Estimate" Button Fix
- Change the "Use for Estimate" button on each measurement card to navigate to `/member/crm/estimates/new?contact_id={contactId}&measurement_id={m.id}` instead of opening a dialog.

#### 5. `CRMEstimateBuilder.tsx` — Auto-select Measurement
- Read `measurement_id` from URL search params.
- After measurements load, auto-select the matching measurement and skip to step 2 (line items) if both contact and measurement are pre-selected.

#### 6. `useEstimateBuilder.ts` — Filter Measurements by Contact
- When `customer_id` is set, filter `roof_measurements` by `contact_id` matching the customer's linked contact instead of loading all measurements.
- Since `estimates` table has `contact_id` and `customer_id`, and `roof_measurements` has `contact_id`, filter by `contact_id` when available (pass as additional param).
- Add a `setContactId` method to allow setting `contact_id` directly from URL params, and filter measurements by it.

#### 7. `CRMLeadDetail.tsx` — Add Inline Measurement
- Add an `InlineRoofMeasurement` component to the lead detail page using the lead's property address.
- Wire the "Measure Roof" action to auto-trigger measurement using the lead's address.

### Technical Details

**Flat roof calculation fix** (core logic in `InlineRoofMeasurement.tsx`):
```text
User selects "Flat" override:
  displayPitchedArea = result.total_flat_area_sqft  (no multiplier)
  displayWaste = 5%
  displaySquares = (flatArea * 1.05) / 100

User selects "Low Slope":
  displayPitchedArea = result.total_flat_area_sqft * 1.02
  displayWaste = 5%

Default "Pitched":
  Use API values as-is
```

**Estimate builder auto-population flow**:
```text
URL: /member/crm/estimates/new?contact_id=X&measurement_id=Y
  → useEffect reads params
  → setCustomer(X) triggers measurement fetch filtered by contact
  → setMeasurement(Y) selects measurement
  → auto-advance to step 2 if both set
```

