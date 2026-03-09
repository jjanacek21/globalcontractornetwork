

# Fix AI Roof Measurement — Add Satellite Verification Image

## Problem
After measuring a roof, there's no visual confirmation that the correct property was measured. Users need to see a satellite view of the property.

## Approach

### 1. Edge Function Update (`supabase/functions/solar-roof-measure/index.ts`)
- After successful Solar API call, construct a Google Maps Static API URL using the same `GOOGLE_MAPS_API_KEY`
- Include the building's actual lat/lng from the Solar API response (`solarResponse.payload.center`) for accuracy, falling back to input coordinates
- Add a red marker at the pin location
- Return `satellite_image_url` and `center` coordinates (lat/lng) in the response

URL format:
```
https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom=20&size=600x400&maptype=satellite&markers=color:red|{lat},{lng}&key={KEY}
```

**Security note**: The API key is already restricted server-side; the static map URL is safe to return to the client as it's a signed/temporary image fetch.

### 2. Frontend Update (`src/components/measurements/AIRoofMeasurement.tsx`)
- Add `satellite_image_url` and `center` (lat/lng) to the `SolarMeasurementData` interface
- After results load, display the satellite image prominently above the measurement cards in a Card with:
  - The satellite image at full width with rounded corners
  - A pin/marker overlay showing the measured location
  - Address text below the image
  - A note: "Verify this is the correct property" with the lat/lng displayed
  - A subtle "Adjust Location" concept — since we can't do true drag on a static image, add +/- nudge buttons (N/S/E/W arrows) that re-run the measurement with slightly offset coordinates, or simply display the coordinates for manual verification

### Files to Modify
- `supabase/functions/solar-roof-measure/index.ts` — add `satellite_image_url` and `center` to response
- `src/components/measurements/AIRoofMeasurement.tsx` — add satellite image card above results with verification UI

