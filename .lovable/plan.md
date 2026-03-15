

## Plan: Fix Measurement Tool Bugs

### Issues Identified

1. **Waste % not inline** — Currently waste selectors are in a separate section below the pin rows. User wants `[Color] [Name] [Pitch] [Area] [×Mult] [Waste%] [Squares] [Delete]` all in one row.

2. **Facet colors not pitch-based** — AI-generated facets use generic FACET_COLORS array instead of coloring by pitch. Should use `getPinColor(pitch)` with alpha for fill.

3. **Edge fallback values** — In `recalcTotals()`, edge values fall back to `prev.ridgeFt` etc., which preserves stale/placeholder values. Should default to 0 when no edges of that type exist.

4. **Report panel uses global multiplier** — `MeasurementReportPanel` calculates `totalPitchedArea` using a single `components.pitchMultiplier` instead of summing per-facet pitched areas.

### Changes

**`PinListPanel.tsx`** — Restructure pin row grid to 8 columns: add inline waste % dropdown, remove the separate "Waste % Per Section" block. New grid: `[20px_1fr_80px_52px_48px_56px_54px_20px]` (Color, Name, Pitch, Area, ×Mult, Waste, Sqrs, Del).

**`RoofMeasurementTool.tsx`** — Fix `recalcTotals`: change edge fallbacks from `prev.ridgeFt` to `0`. Fix `generateSimulatedFacets` call to pass per-pin pitch data so facets get pitch-based colors.

**`MeasurementMap.tsx`** — Update facet rendering to use pitch-based fill colors via `getPinColor`.

**`utils.ts`** — Update `generateSimulatedFacets` to assign facet colors based on pitch using `getPinColor()` with alpha.

**`MeasurementReportPanel.tsx`** — Calculate `totalPitchedArea` by summing each facet's `areaSqft * PITCH_MULTIPLIERS[facet.pitch]` instead of using a global multiplier.

