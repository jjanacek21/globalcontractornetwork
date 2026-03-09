

# Fix Missing Satellite Map View in AI Roof Measurement

## Problem
The satellite verification image likely isn't loading because the Google Maps Static API URL (containing the API key) is returned directly to the client. The API key may have HTTP referrer restrictions that block requests from the preview domain, causing the image to silently fail.

Additionally, returning the raw API key in the URL to the client is a security concern.

## Solution
Proxy the satellite image through a new edge function endpoint so the API key never leaves the server and referrer restrictions don't apply.

### 1. Update Edge Function (`supabase/functions/solar-roof-measure/index.ts`)
- Instead of returning the raw Google Maps URL, fetch the satellite image server-side within the edge function
- Convert the image to a base64 data URL
- Return `satellite_image_base64` as a `data:image/png;base64,...` string in the response
- This avoids API key exposure and bypasses any referrer restrictions on the Google API key

Key logic:
```text
1. Build static map URL with API key (server-side only)
2. fetch() the image from Google
3. Convert response to base64
4. Return as data URI in the JSON response
```

### 2. Update Frontend (`src/components/measurements/AIRoofMeasurement.tsx`)
- Update `SolarMeasurementData` interface: rename `satellite_image_url` to `satellite_image` (accepts both URL and data URI)
- Update the `<img>` src to use the new base64 field
- Add an `onError` fallback on the image in case it still fails — show a placeholder message

### Files to Modify
- `supabase/functions/solar-roof-measure/index.ts` — fetch image server-side, return base64
- `src/components/measurements/AIRoofMeasurement.tsx` — use base64 image data, add error fallback

