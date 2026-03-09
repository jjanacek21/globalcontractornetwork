

# Add Roof Type Override Selector to AI Roof Measurement

## Problem
The Google Solar API sometimes reports inaccurate pitch data (e.g., 13.5° for a flat roof). Users need to override the roof type to correct the pitch multiplier and recalculate squares.

## Approach

### Modify `AIRoofMeasurement.tsx`

1. **Add a Roof Type selector** between the address input and the Measure button — three toggle buttons: **Flat Roof**, **Low Slope**, **Pitched**. User can select before or after measuring.

2. **Override logic**: When a roof type is selected and results exist, recalculate the displayed values client-side:
   - **Flat Roof** → pitch multiplier 1.00 (overrides API's `average_pitch_degrees` display to show "0°")
   - **Low Slope** → pitch multiplier 1.05 (display "~3°")
   - **Pitched** → use API data as-is (no override)

3. **Recalculated fields** when override is active:
   - `total_pitched_area_sqft` = `total_flat_area_sqft × overrideMultiplier`
   - `total_with_waste_sqft` = pitched area × (1 + waste_percent/100)
   - `total_squares` = total_with_waste / 100
   - Show a badge/indicator that values are user-adjusted

4. **UI placement**: A small card or inline toggle group placed inside the main input card, below the address geocoder and above the Measure button. Use the existing `PITCH_OPTIONS` data from `roofMeasurements.ts` for the flat/low multipliers, but present only 3 simplified choices (not all 5 pitch buckets).

5. **Visual indicator**: When an override is active, show an amber badge on the Avg Pitch card like "User Override" so it's clear the API pitch was corrected.

### Files to Modify
- `src/components/measurements/AIRoofMeasurement.tsx` — add state for roof type override, toggle UI, and recalculation logic using `useMemo`

No edge function or database changes needed — this is purely a client-side override on top of the existing API data.

