

# Fix Satellite Image + Enhanced AI Measurement

## Problem
The Google Maps Static API returns an empty image (likely the API isn't enabled or has restrictions on the key). Meanwhile, the `roof-vision-ai` function already successfully uses **Mapbox** satellite imagery with a working token. The measurement data from Google Solar API is fine — only the satellite image is broken.

## Plan

### 1. Fix satellite image in `solar-roof-measure/index.ts`
Replace the Google Static Maps fetch with a **Mapbox Static Images API** call using the same token already used in `roof-vision-ai`:

```text
Mapbox URL pattern:
https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/
  pin-s+ff0000({lng},{lat})/{lng},{lat},19,0/600x400@2x
  ?access_token={MAPBOX_TOKEN}
```

- Use `VITE_MAPBOX_TOKEN` secret (already configured)
- Fetch server-side, convert to base64 data URI (same pattern as current code)
- Falls back gracefully if Mapbox also fails

### 2. Add AI-enhanced verification in `solar-roof-measure/index.ts`
After fetching the Mapbox satellite image, optionally call the **Lovable AI Gateway** (Gemini) to cross-validate the Solar API's pitch and area data against the satellite image:

- Send the satellite image to Gemini with a prompt: "Does this appear to be a flat roof, low-slope, or pitched roof?"
- Return an `ai_roof_type_suggestion` field (e.g., `"flat"`, `"low_slope"`, `"pitched"`) alongside the Solar API data
- If AI detects a mismatch (e.g., Solar says 13.5° but AI sees flat), include a warning message
- Uses `LOVABLE_API_KEY` (already configured)

### 3. Surface AI suggestion in frontend (`AIRoofMeasurement.tsx`)
- Show an info banner when `ai_roof_type_suggestion` differs from the Solar API pitch classification
- Example: "AI analysis suggests this is a flat roof. The Solar API reported 13.5° avg pitch. Consider selecting 'Flat Roof' above."
- Auto-select the suggested roof type override (user can still change it)

### Files to Modify
- `supabase/functions/solar-roof-measure/index.ts` — swap Google Static Maps for Mapbox, add AI verification call
- `src/components/measurements/AIRoofMeasurement.tsx` — display AI suggestion banner, auto-select override

### Data Flow
```text
Address → Google Solar API (segments, pitch, area)
       → Mapbox Static Image (satellite photo, base64)
       → Gemini AI (analyze satellite image → roof type suggestion)
       → Client receives all three data sources combined
```

