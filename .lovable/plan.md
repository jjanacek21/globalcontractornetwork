

# Add Satellite Map View to PropertyIQ Search

## Overview
Add an interactive Mapbox satellite map to the PropertyIQ search page. Properties with coordinates show as clickable markers on the map. When an address is searched/selected via autocomplete, the map flies to that location. Clicking a property marker navigates to its report page.

## Layout
The search page gets a toggle between **List** and **Map** view modes. In map view, a full-width satellite map replaces the property cards. The search bar stays on top in both views.

## Changes

### 1. Update search hook to include coordinates
Modify `usePropertyIQSearch` in `src/hooks/usePropertyIQ.ts` to also select `latitude, longitude` from `piq_properties`. Add these fields to `PIQPropertySummary`.

### 2. Create `PropertyIQMap` component
New file: `src/components/property-iq/PropertyIQMap.tsx`

- Renders a Mapbox map with `satellite-v9` style
- Takes `properties: PIQPropertySummary[]` and optional `flyTo: {lat, lng}` coords
- Places colored markers for each property that has lat/lng
- Marker popups show address, type, roof score with a "View Report" link to `/property-iq/property/{id}`
- When `flyTo` changes, the map flies to that location at zoom 18
- Uses the same Mapbox token pattern as existing components

### 3. Update `PropertyIQSearch.tsx`
- Add a List/Map toggle (two buttons or tabs) above results
- Track `viewMode` state: `'list' | 'map'`
- Track `flyToCoords` state, set when `AddressAutocomplete.onSelect` fires with coordinates
- In list mode: show current property cards (unchanged)
- In map mode: render `<PropertyIQMap properties={filtered} flyTo={flyToCoords} />`
- Update `AddressAutocomplete.onSelect` to capture coordinates and set `flyToCoords`

### Files
- **Modify**: `src/hooks/usePropertyIQ.ts` — add lat/lng to search select and type
- **Create**: `src/components/property-iq/PropertyIQMap.tsx` — satellite map with markers
- **Modify**: `src/pages/PropertyIQSearch.tsx` — add view toggle and map integration

