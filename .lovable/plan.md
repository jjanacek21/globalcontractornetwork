

## Plan: Fix Flat Pin Facet Generation & Squares Calculation

### Root Cause

When multiple pins are measured (e.g., a pitched pin + a flat pin), `generateSimulatedFacets` on line 231 of `RoofMeasurementTool.tsx` only uses `primaryResult.segments` (from the first measured pin). If the flat pin is a separate measurement point, its area data never becomes a facet. The facets table in the report then shows 0 for flat sections, and the report's `totalFlatArea` (summed from facets) doesn't include the flat pin's area.

### Changes

**`src/components/measurements/RoofMeasurementTool.tsx`** (lines 214-238) — After generating simulated facets from the primary pin's segments, create additional synthetic facets for each measured pin that isn't represented in those segments. For each non-primary pin with a result:
- Create a facet with `areaSqft = pin.result.total_flat_area_sqft`, `pitch = pin.pitch`, `type = pin.pitch === "Flat" ? "flat" : "pitched"`, and color from `getPinColor(pin.pitch)`.
- Generate simple rectangular vertices around the pin's lat/lng coordinates.
- Append these facets to the simulated facets array before setting state.

**`src/components/measurements/utils.ts`** — Add a new exported helper `createPinFacet(pin: RoofPin, index: number): RoofFacet` that generates a simple rectangular facet polygon centered on a pin's coordinates with the pin's measured area. This keeps the facet generation logic reusable.

**`src/components/measurements/MeasurementReportPanel.tsx`** — No changes needed; it already correctly calculates per-facet squares using `PITCH_MULTIPLIERS[f.pitch]` (line 160-161). Once facets are properly generated for flat pins, the report will show correct values.

### Summary of flow after fix
1. AI measures all pins → each gets `result.total_flat_area_sqft`
2. `generateSimulatedFacets` creates facets from primary pin's Solar API segments
3. NEW: For each additional measured pin, a synthetic facet is created with that pin's area and pitch
4. All facets (including flat) appear in the report table with correct squares

