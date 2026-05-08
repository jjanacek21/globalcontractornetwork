## Problems

**1. Map not visible after address selection** — long page, no auto-scroll, missing `map.resize()` after layout change, and re-picking an address doesn't rebuild the marker cleanly.

**2. Measurements way off** — `solar-roof-measure` takes Google Solar's `roofSegmentStats[].stats.areaMeters2` (already the slanted/actual roof surface) and multiplies it by `1/cos(pitch)` again, inflating by 10–25%. Then `WasteFactorStep` adds another 11–18% on top.

**3. Flat sections missed entirely (e.g. 2847 NE 2nd Ave, Boca Raton)** — Google Solar frequently skips low-slope/flat sections of a mixed roof (the gray flat area looks like a concrete slab). Florida has tons of mixed pitched-tile-front + flat-rear-addition homes, so this is a recurring blind spot. We need a way for the user to add the missing flat area without re-measuring everything.

## Plan

### A. Map visibility & UX (`RoofMapMeasureStep.tsx`)
1. Always render the map container (placeholder overlay until `coords` exists) so the ref is stable.
2. On `coords` change: `map.flyTo(...)`, `map.resize()`, move marker, and `scrollIntoView({ behavior: "smooth", block: "center" })` the first time.
3. Resize on map `load` and on debounced window resize.
4. Add helper text + a "Recenter on address" button.

### B. Measurement accuracy (`supabase/functions/solar-roof-measure/index.ts`)
1. Treat segment `areaMeters2` as **actual roof surface area**. Stop multiplying by `1/cos(pitch)`.
2. Output:
   - `total_roof_area_sqft` = sum of segment surface areas (this is what gets shingled).
   - `footprint_area_sqft` = informational only.
3. Drop `total_with_waste_sqft` from response; waste lives in the frontend only.
4. If avg pitch < 1° but AI vision says "pitched", default display pitch to 22° (6/12); area unaffected.
5. Return `building_bounding_box` and per-segment polygon coords so the frontend can outline what Solar measured.
6. **New: detect missing flat sections.** Compute the building footprint area from `solarPotential.buildingStats.areaMeters2` (or the bounding box). If `sum(segment surface) * cos(avg pitch) < 0.7 × footprint`, flag `likely_missing_flat_section: true` with the estimated missing footprint sqft. This triggers the "add flat roof" UI on the frontend.

### C. Multi-pin flat-roof addition (NEW — answers your question)
Yes, the cleanest fix is a second-pin flow, and we'll automate it where possible:

1. After the primary "Measure this roof" runs, if `likely_missing_flat_section` is true (or the user opts in by clicking **"Add a flat / low-slope section"**), the map enters **Add Flat Section mode**:
   - Cursor changes to a crosshair.
   - User clicks anywhere on the flat portion of the roof.
   - A blue pin drops; the AI auto-traces the flat section.
2. **Auto-trace logic** (new edge function `trace-flat-roof`):
   - Pulls the Mapbox high-res satellite tile centered on the new pin.
   - Sends to Lovable AI Gateway (`google/gemini-3-flash-preview`) with vision: "Outline the rectangular/polygonal flat roof section centered on this pin. Return polygon corners as lat/lng offsets in meters from the pin."
   - Converts polygon to sqft via Shoelace formula on a local equirectangular projection.
   - Falls back to a draggable rectangle the user can resize if AI confidence is low.
3. The added flat section is appended to the measurement as an additional segment with `pitch_degrees: 2`, `is_user_added: true`, and shown on the map as a translucent blue polygon with sqft label + delete button.
4. User can drop **multiple flat pins** if there are several flat additions (Florida porches, carports, lanai roofs).
5. Final `total_roof_area_sqft` = Solar surface area + Σ user-added flat sections. Pitch multiplier is **not** re-applied to flat additions.

### D. Frontend wiring
1. `MeasurementResult` gains `user_added_flat_sqft` and `segments_user_added[]`.
2. `WasteFactorStep` shows a breakdown: "Pitched roof: 1,840 sqft + Flat section: 420 sqft = 2,260 sqft measured", then applies waste once.
3. Surface the Solar building outline (yellow) and user-added flat sections (blue) on the map.
4. Inline "Looks wrong? Re-measure" + "Add flat section" buttons before advancing.

### E. Sanity check
- Server logs raw Solar areas + computed surface sqft + footprint ratio for known addresses.
- Test against 2847 NE 2nd Ave: expected ≈ pitched front + flat rear; without the fix Solar returns just the pitched area, after the fix the user adds the flat slab via second pin and total reconciles to building footprint ÷ cos(pitch) + flat add.

## Out of scope
- Contractor-side roof tools (CRM `InlineRoofMeasurement`) — separate code path.
- Pricing logic in `roofing-package-pricing`.

## Direct answer to your question
**Yes — drop a second pin for flat sections.** It's the most reliable approach because Google Solar genuinely doesn't see them on a lot of Florida homes. The second pin will auto-trace via AI so the user doesn't have to draw, with a draggable rectangle fallback. The system will also auto-prompt for it whenever the measured surface area is less than ~70% of the building footprint, so users don't have to remember.
