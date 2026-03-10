

# Add pitch_over_12 to Edge Function + UI

## Problem
The filtering logic is already correct (flat ≤ 5°, pitched > 5°). The user wants two additions:
1. **Add `pitch_over_12`** (rise/run format) to each segment and as an average — formula: `round(tan(degrees * π/180) * 12)`
2. **Show pitch_over_12 alongside degrees** in the UI segment table and summary cards

## Changes

### 1. Edge Function — `supabase/functions/solar-roof-measure/index.ts`

- Add helper: `const toPitchOver12 = (deg: number) => Math.round(Math.tan(deg * Math.PI / 180) * 12);`
- Add `pitch_over_12` to each segment object in the `.map()` call
- Add `average_pitch_over_12` to the response data using the weighted average pitch

### 2. UI — `src/components/measurements/AIRoofMeasurement.tsx`

- Add `pitch_over_12` to the `Segment` interface
- Add `average_pitch_over_12` to the `SolarMeasurementData` interface
- In the segment table: add a "Pitch" column showing `X/12` alongside degrees
- In the Average Pitch summary card: show `X/12` alongside degrees

