

## Bug Fix: Flat Pins Return 0 Squares

### Root Cause

In the backend function `solar-roof-measure`, when a pin has pitch "Flat", the request sends `roof_type_override: "flat"`. The function then filters roof segments to only those with `pitch_degrees <= 5`. If no segments meet that threshold (common on pitched roofs), `useSegments` becomes empty, `segmentAreaM2 = 0`, and because `roof_type_override` is truthy, the fallback to `wholeRoofAreaM2` is skipped (line 141). This produces `total_flat_area_sqft = 0`, which flows through `calcPin` to show 0 squares.

### Fix

Two changes:

1. **Edge function** (`supabase/functions/solar-roof-measure/index.ts`, line 141): When `roof_type_override` is set but filtered segments are empty, fall back to using all segments' area (or `wholeRoofAreaM2`) instead of returning 0. Change the condition:
   ```
   // Before:
   const totalFlatAreaM2 = (segmentAreaM2 > 0 || roof_type_override) ? segmentAreaM2 : wholeRoofAreaM2;
   
   // After:
   const totalFlatAreaM2 = segmentAreaM2 > 0 ? segmentAreaM2 : wholeRoofAreaM2;
   ```
   This ensures that if the override filter produces no matching segments, the function still returns the whole roof area — the pitch multiplier override (1.0 for flat) will still be applied correctly.

2. **Frontend** (`src/components/measurements/RoofMeasurementTool.tsx`, line 194): Stop sending `roof_type_override` entirely. The user-selected pitch and multiplier are already applied client-side in `calcPin`. The API should always return the full measured area, and the client applies the pitch correction. Change:
   ```
   // Before:
   body: { latitude: pin.lat, longitude: pin.lng, address, roof_type_override: isFlat ? "flat" : undefined }
   
   // After:
   body: { latitude: pin.lat, longitude: pin.lng, address }
   ```

Option 2 is the cleaner fix since pitch multipliers are already handled per-pin on the client. I'll implement both — remove the override from the frontend call and fix the fallback in the edge function as a safety net.

