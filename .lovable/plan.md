## What's wrong

**1. Map doesn't appear** — Tiles ARE downloading from Mapbox (verified in network requests), so the token and API are fine. The problem is the map container is collapsing visually. Likely causes:
- Tailwind arbitrary class `h-[420px]` not being applied/purged in this build
- Map mounts before the container has measurable size, so the GL canvas stays at 0×0 and never resizes
- Placeholder overlay's absolute positioning + `backdrop-blur` covering tiles

**2. No "Analyze Roof Condition" button visible** — A `RoofConditionStep` exists, but it only appears AFTER the user finishes the Waste Factor step. From the user's perspective, after measuring they go straight to waste-factor questions and never see a clear "analyze condition" CTA tied to the measurement.

## Fix plan

### A. `RoofMapMeasureStep.tsx` — guarantee the map renders
1. Replace the Tailwind `h-[420px]` with an explicit inline `style={{ height: 460, minHeight: 460 }}` on the map container so the size is bulletproof regardless of CSS purge.
2. Wrap the map container in a sized parent and add a `ResizeObserver` that calls `map.resize()` whenever the container's box changes (handles late layout, fonts, scroll).
3. Defer `mapboxgl.Map` construction until the container has a non-zero `clientHeight` (poll a couple of animation frames). If still zero after 500ms, force-set inline style and try again.
4. Move the placeholder overlay so it never overlaps the canvas once `coords` is set, and drop `backdrop-blur` (it can mask GL canvases on some GPUs).
5. Add a visible **"Open in larger view"** / recenter row above the map and a satellite-image `<img>` fallback (using `primaryMeasurement.satellite_image` or a Mapbox Static API URL) shown beside the map only if `map.loaded()` is still false after 4s.
6. After `map.on("load")` fires, also call `map.resize()` inside a `requestAnimationFrame` (fixes the well-known Mapbox sizing race).

### B. Surface the Condition step right after measurement
Two complementary changes:

1. **In `RoofMapMeasureStep`**, change the post-measurement primary CTA from "Continue with X sqft" to two stacked buttons:
   - `Analyze roof condition` (primary) — calls `onComplete` with a flag `gotoCondition: true`
   - `Skip — looks fine, continue` (ghost)
   Update the `onComplete` payload to include this flag.

2. **In `RoofingWizardSteps.tsx`**, reorder the flow so Condition runs immediately after the map:
   ```
   stories → map → condition → waste → packages
   ```
   This matches how the user thinks ("I just measured my roof, now tell me what's wrong with it") and means the analyze button is one tap away. Waste factor still happens, just after we know roof shape/condition (which is actually more accurate because complexity feeds the waste %).

3. Pass measurement, coords, and address into `RoofConditionStep` (already wired). On `onBack` from Condition, return to Map. On Skip, set `condition` to `{ severity: 'unknown', source: 'photos', issues: [], recommendations: [], material: 'unknown' }` so downstream pricing still works.

### C. Safety / UX polish
- Add a visible loading skeleton (animated grey block at 460px) before the first tiles paint, so users always see SOMETHING in the map area even if Mapbox is slow.
- Catch Mapbox init errors and show a friendly fallback: "Map preview unavailable — using satellite snapshot instead" with the static Mapbox image and a manual "I confirmed this is my roof" checkbox so the flow still completes.
- Log `[RoofMap] container size`, `[RoofMap] map loaded`, and `[RoofMap] resize` to console for future diagnosis.

## Out of scope
- Solar measurement math (handled in earlier round).
- Pricing logic and financing breakdown.
- Contractor-side CRM measurement tools.

## Files to touch
- `src/components/instant-quote/roofing/RoofMapMeasureStep.tsx` — sizing fix, resize observer, fallback image, new CTA buttons
- `src/components/instant-quote/RoofingWizardSteps.tsx` — reorder substeps to `map → condition → waste → packages`, handle skip
- `src/components/instant-quote/roofing/RoofConditionStep.tsx` — minor: support back-to-map and a "Skip analysis" button

After this, you should see the satellite map appear within ~1 second of address selection, and a clearly labelled **"Analyze roof condition"** button immediately after measurements complete.