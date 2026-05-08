# Roofing Instant Quote — AI Measurement & Pricing Upgrade

Replace the current text-only roofing wizard with a satellite map measurement flow, AI condition analysis, and a 3-tier estimate with financing.

## New Roofing Flow (Property Owner)

```text
Address → Satellite Map → AI Measure → Waste Factor → Condition AI → Good/Better/Best + Financing
```

### Step 1 — Address & Satellite Map
- Keep existing `AddressAutocomplete`.
- After selection, render a Mapbox satellite view (`mapbox://styles/mapbox/satellite-streets-v12`) centered on geocoded coords with zoom/pan.
- Show a draggable pin the user drops on the roof. "Measure this roof" button confirms.

### Step 2 — AI Roof Measurement
- Call existing `solar-roof-measure` edge function (Google Solar API) with the pin coords.
- Display: total roof sqft, average pitch, pitch multiplier, roof segment count, satellite preview.
- If Solar API has no data ("MEDIUM"/no coverage), fall back to manual sqft entry plus AI satellite estimate via `roof-vision-ai`.

### Step 3 — Waste Factor (3 visual options)
- User picks roof complexity, each illustrated with a simple 3D SVG (reuse `public/roof-gable.svg`, `roof-hip.svg`, `roof-complex.svg`):
  - Gable — 10–12% waste
  - Hip — 12–15%
  - Complex Hip — 15–20%
- Final sqft = measured pitched sqft × selected waste %.

### Step 4 — Condition Analysis
- Two paths the user can combine:
  1. Upload ground photos → existing `analyze-roof-photo` function.
  2. "Analyze satellite image" → new call to `roof-vision-ai` with the satellite tile URL from step 2.
- Output: damage breakdown, material guess, severity, recommended scope items.

### Step 5 — Good / Better / Best Estimate + Financing
- New estimate engine combines: sqft × waste, pitch multiplier, condition severity, regional Florida pricing.
- Three packages (re-use naming from `ai-quote-generator`):
  - **Good** — 3-tab architectural shingle, 10-yr workmanship.
  - **Better** — Premium architectural / impact shingle, underlayment upgrade, 25-yr.
  - **Best** — Standing seam metal or tile, full code upgrades, lifetime.
- Each card shows: total price, price/sq, scope bullets, warranty.
- Financing block per tier: 60/120/180-month payment estimates at a configurable APR (default 9.99%) — pure client-side amortization (`P × r / (1 − (1+r)^-n)`), labeled "estimate, not an offer".

## Technical Changes

### Frontend
- New: `src/components/instant-quote/roofing/RoofMapMeasureStep.tsx` (Mapbox satellite + pin + measure CTA).
- New: `src/components/instant-quote/roofing/WasteFactorStep.tsx` (3-card SVG selector).
- New: `src/components/instant-quote/roofing/RoofConditionStep.tsx` (upload + satellite AI analyze).
- New: `src/components/instant-quote/roofing/RoofPackagesStep.tsx` (Good/Better/Best + financing slider).
- New: `src/lib/financing.ts` (amortization helper).
- Refactor `RoofingWizardSteps.tsx` to orchestrate the 5 new sub-steps and pass measurement + condition data into a new `RoofResultsStep` (or extend `ResultsStep` with a roofing-specific render path).
- `InstantQuoteWizard.tsx`: extend `TradeAnswers` and wizard state to carry measurement + condition payloads; skip the generic `PhotoAnalysisStep` for roofing (handled inline in step 4).

### Backend
- Reuse existing edge functions: `solar-roof-measure`, `roof-vision-ai`, `analyze-roof-photo`, `geocode-address`.
- New edge function `roofing-package-pricing` (or extend `ai-quote-generator`) that takes `{sqft, pitchMultiplier, wasteFactor, condition, region}` and returns three packages with price ranges and scope. Uses Lovable AI Gateway with `google/gemini-3-flash-preview` via tool-calling for structured output.

### APIs & Secrets
- Mapbox token already in `src/lib/geocoding.ts` (`VITE_MAPBOX_TOKEN`).
- Google Solar API key already configured for `solar-roof-measure` (no new secret).
- Lovable AI Gateway (`LOVABLE_API_KEY`) used for vision + pricing — already present.
- No user-supplied API keys required.

### Out of Scope
- Contractor flow unchanged.
- Other trades (windows, emergency, landscaping, cleaning) unchanged.
- No persisted CRM job creation in this pass — the existing post-quote "Talk to a contractor" flow is retained.

## Open Question
Financing APR: should we default to a single fixed APR (e.g. 9.99%) with a clear disclaimer, or expose a slider so users can compare 6.99%/9.99%/14.99%? I'll default to the slider unless you say otherwise.
