## Problem

The Bathrooms wizard (and other non-roofing trades) is showing absurd prices like **$3.9M – $31M**. Two root causes:

1. **Estimator multiplies the wrong quantity.** `iq-calculate-estimate` always multiplies `base_price_per_unit × measurements.sqft`. For Bathrooms the tier unit is **"each"** at $11,500–$67,500 per bathroom, but the wizard sets `sqft = rooms × 200`, so it computes `11,500 × 200 = $2.3M` per tier. It must use `count` when `unit='each'`, `linear_feet` when `unit='lf'`, etc.
2. **Generic measurement step uses satellite + "sq ft" for everything.** Satellite/Mapbox is only meaningful for Roofing. Other trades need their own units (linear feet, sqft, count, # of rooms/bathrooms/openings) and friendlier wording.

The roofing wizard is already correct and is **not** touched.

## Step 1 — Fix the estimator (edge function)

Update `supabase/functions/iq-calculate-estimate/index.ts` so each tier picks the quantity that matches its `unit`:

- `unit = 'each'` or `'count'` → use `measurements.count` (fallback `answers.count`, default `1`)
- `unit = 'room'` → use `measurements.rooms` (fallback `1`)
- `unit = 'lf'` / `'linear_feet'` → use `measurements.linear_feet` (default `50`)
- `unit = 'sqft'` (or anything else) → use `measurements.sqft` (default `1000`)
- Also clamp the result to a sane max (e.g. cap qty at 50,000 sqft / 500 lf / 50 each) to prevent typos producing million-dollar quotes
- Return `quantity` and `unit` per tier so the UI can show "$11,500/each × 2"

## Step 2 — Trade-aware Measurement step (`TradeWizard.tsx`)

Replace the current single sqft input with a per-trade measurement block driven by the trade's `measurement_method` and the tier `unit` returned by the DB:

| Trade group | measurement_method | Inputs shown |
|---|---|---|
| Roofing | satellite | (already handled by roofing wizard – not touched) |
| Gutters, Soffit & Fascia | satellite | **Linear feet of roof edge**, # of stories |
| Pavers | satellite | **Square feet of paver area**, surface type |
| Siding, Stucco, Exterior Paint, Pressure Washing | photo_ai | **Approx. wall sqft** + # of stories (no satellite image) |
| Windows, Doors | photo_ai / count_based | **Number of windows / doors**, sizes |
| EIFS Bands, Crown Molding | manual_input | **Linear feet** |
| Drywall, Texture, Flooring, Interior Paint, Cabinets | manual_input / room_based | **Sqft of area** OR **# of rooms** |
| Plumbing, Electrical | manual_input | **# of fixtures / outlets** |
| Bathrooms, Kitchens | room_based | **Number of bathrooms / kitchens** (count, NOT sqft) |
| Interior Renovation | room_based | **# of rooms** + total sqft |
| Tree & Landscaping | count_based | **# of trees**, lot size |
| Window Cleaning | count_based | **# of windows**, # of stories |
| Emergency Services | photo_ai | Type + affected sqft |

Implementation details:
- Remove the satellite image preview for every trade except Roofing (Roofing already lives in its own wizard, so this means simply: do not render `satelliteUrl` in `TradeWizard`).
- Skip the Address→Measurement satellite call for trades whose `measurement_method !== 'satellite'` (still geocode, but don't fetch a satellite image).
- Each input writes to the appropriate `measurements` key (`count`, `rooms`, `linear_feet`, `sqft`, `stories`).
- Add help text above the input that names the unit ("Most full bathroom remodels are 1–3 bathrooms").

## Step 3 — Results step polish

In `TradeWizard` results phase:
- Show `"$X,XXX – $Y,YYY"` formatted with thousands separators (already there) **and** show the per-unit basis returned by the function (e.g. "Based on 2 bathrooms at $11,500 / each").
- Keep the existing 3D / colorful tier cards.

## Out of scope

- No changes to the Roofing wizard.
- No DB migrations; `iq_trade_pricing_options` and `iq_trade_questions` already have correct unit/data.
- No changes to lead-capture / Telegram (separate plan, still pending).

## Files touched

- `supabase/functions/iq-calculate-estimate/index.ts` — unit-aware quantity + caps
- `src/components/instant-quote/TradeWizard.tsx` — per-trade measurement UI, drop satellite for non-roofing, show per-unit basis on results
