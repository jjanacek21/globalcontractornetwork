

## Integrate Interactive Satellite Measurement into RoofScope Wizard

### What You'll Get
- **Step 0 (Customer & Property)**: Address field becomes an autocomplete that searches as you type, with city/state/zip auto-populated from the selected result
- **Step 3 (Measurements)**: Completely rebuilt as an interactive satellite map where you can:
  - See the property from satellite view
  - Drop multiple pins on different buildings/roof sections
  - Set pitch factor and waste factor per pin
  - Click "Measure All" for instant AI measurements
  - OR switch to manual polygon drawing mode to measure yourself
  - Totals (squares, SF, edge lengths) auto-populate from the map measurements

### Technical Approach

This reuses the existing `MeasurementMap`, `PinListPanel`, `DrawingToolbar`, and related components already built in `src/components/measurements/` — no need to rebuild the map or drawing engine.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/crm/RoofScopeEstimateWizard.tsx` | **Step 0**: Replace plain address `Input` with `AddressBar` component from measurements module; auto-fill city/state/zip from geocode result. **Step 3**: Replace manual number inputs with full interactive panel — embed `MeasurementMap` with satellite view, pin list with pitch/waste selectors, AI measure button, and polygon drawing toggle. Wire measured totals back into estimate state (total_squares, total_sf, ridges, hips, valleys, eaves, rakes, penetration counts). |
| `src/components/roofscope/RoofScopeMeasurementStep.tsx` | **New file** — Self-contained component wrapping `MeasurementMap` + `PinListPanel` + `DrawingToolbar` for the wizard context. Manages pins, facets, edges, and exposes an `onMeasurementsChange` callback that pushes totals up to the wizard state. Includes mode toggle (AI Fast Measure vs Manual Polygon). |

### Key Details

- The `AddressBar` already calls the `geocode-address` edge function and returns coordinates — we parse the `place_name` to extract city/state/zip
- `MeasurementMap` renders Mapbox satellite at zoom 19 with draggable pin markers
- Pin pitch multipliers use the exact values from `PITCH_MULTIPLIERS` in `types.ts` (1/12 through 24/12)
- AI measurement calls the existing `roof-vision-ai` edge function per pin
- Manual polygon mode uses the existing facet/edge drawing engine with vertex snapping
- The measurement step will be taller (min 600px) to give the map enough space
- All measured values flow into the estimate's line item calculations in Steps 7-9

