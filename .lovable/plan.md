

# Fix: Roof Measurement Segment Splitting

## Problem
The Google Solar API returns segments for the **entire building**. The current filtering has a critical fallback: if no segments match the filter criteria (lines 117, 120), it silently falls back to using **all** segments (`useSegments = segments`). Additionally, when `roof_type_override` is `"pitched"`, there's **no filter at all** — it uses every segment including flat ones.

This means a Pitched pin and a Flat pin on the same building both report the full building area.

## Fix (edge function only)

**File:** `supabase/functions/solar-roof-measure/index.ts`

Three changes to the segment filtering block (lines 113-121):

1. **Add a "pitched" filter** — when `roof_type_override` is `"pitched"`, only include segments with pitch > 5°.
2. **Remove the fallback** — if the filter returns zero segments, return those zero segments (resulting in 0 sqft) rather than silently using all segments. This is the correct behavior: if someone places a "flat" pin but the building has no flat segments, the answer should be 0, not the whole building.
3. **No override = all segments** — when no override is provided (standalone measurement), keep current behavior of using all segments.

```typescript
// Replace lines 113-121
let useSegments = segments;
if (roof_type_override === "flat") {
  useSegments = segments.filter((s) => s.pitch_degrees <= 5);
} else if (roof_type_override === "low_slope") {
  useSegments = segments.filter((s) => s.pitch_degrees <= 10);
} else if (roof_type_override === "pitched") {
  useSegments = segments.filter((s) => s.pitch_degrees > 5);
}
```

Also update line 137 to not fall back to `wholeRoofAreaM2` when an override is active:

```typescript
const totalFlatAreaM2 = (segmentAreaM2 > 0 || roof_type_override)
  ? segmentAreaM2
  : wholeRoofAreaM2;
```

This ensures that a Flat pin only counts low-pitch segments and a Pitched pin only counts high-pitch segments — they partition the building correctly.

