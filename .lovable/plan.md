

## Plan: Fix Double-Counting — Pins Must Use Section-Specific Areas

### Problem

Both Pin 1 (Pitched) and Pin 2 (Flat) show 2,020 sqft because `calcPin` falls back to `total_flat_area_sqft` (the **entire building**) whenever the section-specific area is 0. Since both pins hit the same building, this double-counts the full roof for each pin, producing ~44 squares instead of the correct ~30.

The API returns `flat_section_area_sqft` and `pitched_section_area_sqft`, but if Google Solar classifies all segments as pitched (pitch > 5°), `flat_section_area_sqft = 0` and the fallback kicks in, giving the flat pin the whole building area.

### Fix

**`src/components/measurements/utils.ts`** — Two changes:

1. **`calcPin`** (lines 8-21): Remove the fallback to `total_flat_area_sqft` when section data exists. If `flat_section_area_sqft` and `pitched_section_area_sqft` fields are present in the API response, always use them — even if 0. Only fall back to `total_flat_area_sqft` for legacy responses missing these fields entirely.

```
// Before:
const flatSqft = sectionArea > 0 ? sectionArea : pin.result.total_flat_area_sqft;

// After: only fall back if section fields don't exist at all
if (hasSectionData) {
  flatSqft = isFlat ? flat_section : pitched_section;
} else {
  flatSqft = total_flat_area_sqft; // legacy
}
```

2. **`createPinFacet`** (line 175): Use the same section-based area logic instead of `total_flat_area_sqft`, so synthetic facets on the map/report also show correct per-section areas.

### Result

For 2847 NE 2nd Ave:
- Pitched pin uses `pitched_section_area_sqft` (~2221 if Google agrees, or whatever Google returns)
- Flat pin uses `flat_section_area_sqft` (~852 if Google has flat segments, or 0 if none detected)
- No more double-counting of the full building area

If Google Solar finds no flat segments for a building the user marked as flat, the pin will show 0 sqft — which is accurate per the API data. The user can then adjust pin placement or use manual measurement mode.

