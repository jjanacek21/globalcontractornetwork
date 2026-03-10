

## Fix: Change iCanvas Map to Satellite View

The `CanvassMap.tsx` component on line 79 uses `streets-v12` style instead of satellite.

### Change
**`src/pages/crm/CanvassMap.tsx`** line 79:
- Change `style: "mapbox://styles/mapbox/streets-v12"` → `style: "mapbox://styles/mapbox/satellite-streets-v12"`

Single line change, matching the satellite style used in `DoorToDoorMap.tsx`.

