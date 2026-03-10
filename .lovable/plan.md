

## Fix: Flat Roof Measurement Too High

### Root Cause

When a pin is marked as "flat", the edge function (`solar-roof-measure`) still sums **all** roof segments from the Google Solar API — including pitched segments. It only overrides the pitch multiplier to 1.0 and waste to 5%, but the base area (`total_flat_area_sqft`) includes every segment on the building, even steeply pitched ones.

For example, a building with a 2,000 sq ft pitched main roof and a 500 sq ft flat garage would report 2,500 sq ft for a "flat" pin — massively inflating the number.

### Fix

**`supabase/functions/solar-roof-measure/index.ts`**:
- When `roof_type_override` is `"flat"` or `"low_slope"`, filter segments to only include those with pitch ≤ 5° (flat) or ≤ 10° (low slope) before summing area
- Fall back to `wholeRoofStats` area only if no low-pitch segments are found (edge case for buildings where Solar API misreports pitch)
- Add a `filtered_segments_count` field to the response so the UI can show how many segments were used

**`src/components/crm/InlineRoofMeasurement.tsx`**:
- Show the filtered segment count in the results so users understand what was measured

### Details

In the edge function, after building the `segments` array (~line 111), add filtering logic:

```typescript
// Filter segments for flat/low_slope overrides
let filteredSegments = segments;
if (roof_type_override === "flat") {
  filteredSegments = segments.filter(s => s.pitch_degrees <= 5);
} else if (roof_type_override === "low_slope") {
  filteredSegments = segments.filter(s => s.pitch_degrees <= 10);
}

// Use filtered segments for area calculation, fall back to all if none match
const useSegments = filteredSegments.length > 0 ? filteredSegments : segments;
```

Then use `useSegments` instead of `segments` for the area totals calculation. This ensures flat roof pins only count flat segments.

