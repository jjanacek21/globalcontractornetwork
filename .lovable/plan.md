
# Pre-Populated House Markers with Side Panel Disposition System

## Overview

Transform the Door to Door map experience to match Sales Rabbit / Roofing Redline style - showing clickable empty circles on every house in the visible area, with a slide-out side panel for disposition assignment.

## Key Features

### 1. Property Markers (Empty Circles on Houses)

Instead of only showing markers for knocked doors, the map will display:
- **Yellow/orange empty circles** on each property in the visible map area
- Circles positioned at property/rooftop locations
- Color changes based on disposition status
- Clicking a circle opens the side panel

### 2. Disposition Color System

| Status | Circle Style | Color |
|--------|--------------|-------|
| Not Contacted | Empty circle (outline only) | Yellow/Orange |
| Not Home | Filled circle | Gray |
| Not Interested | Filled circle | Red |
| Go Back | Filled circle with arrow | Amber |
| Interested | Filled circle | Blue |
| Needs Inspection | Filled circle | Orange |
| Appointment Set | Filled circle | Green |
| Contract Signed | Filled circle with checkmark | Gold |

### 3. Slide-Out Side Panel (Right Side)

When clicking a property marker:
1. **Header Section**
   - Property address
   - City, State, ZIP
   - Close button (arrow back)

2. **Quick Disposition Row** (horizontal scrollable)
   - Large icon buttons for each status
   - Go Back, Not Home, Not Interested, Needs Inspection (visible)
   - More options on scroll

3. **Customer Selection Section**
   - "Select Home Owner" heading
   - Radio list of residents (from reverse geocoding or manual entry)
   - "Add Customer" button

4. **Tools Section**
   - Appointments, Project, Proposals, File, Tags, Photos tabs

5. **Notes Section**
   - Quick notes input
   - Save button
   - History tab

## Technical Implementation

### Data Source for Property Locations

**Option A: Generate Grid from Visible Bounds** (Recommended for MVP)
- Calculate visible map bounds
- Generate property markers at regular intervals on residential areas
- Use Mapbox building footprints layer for positioning
- Store disposition data by lat/lng hash key

**Option B: Mapbox Building Footprints**
- Use `mapbox://mapbox.mapbox-streets-v8` building layer
- Click on building to get centroid coordinates
- More accurate but requires additional processing

### New Database Table: `property_dispositions`

Store disposition data independently of sessions to persist property status across visits:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Who assigned the disposition |
| lat | numeric | Latitude (rounded for matching) |
| lng | numeric | Longitude (rounded for matching) |
| lat_lng_hash | text | Unique hash for deduplication |
| address | text | Reverse geocoded address |
| disposition | enum | Current status |
| customer_name | text | Homeowner name |
| customer_phone | text | Phone |
| customer_email | text | Email |
| notes | text | Notes |
| updated_at | timestamptz | Last update |

### Component Architecture

```
src/components/door-to-door/
  PropertyMarkerLayer.tsx     # Generates and renders circles
  PropertySidePanel.tsx       # Right slide-out panel
  DispositionQuickBar.tsx     # Horizontal icon row
  ResidentSelector.tsx        # Customer selection list
  PropertyToolsSection.tsx    # Tools tabs (optional for MVP)
```

### Map Integration Changes

**DoorToDoorMap.tsx modifications:**
1. Add GeoJSON source for property markers
2. Add circle layer with data-driven styling
3. Handle click events on circle layer
4. Fetch existing dispositions for visible bounds
5. Update markers when disposition changes

**Marker Generation Logic:**
```
1. On map load/move: Get visible bounds
2. Query `property_dispositions` for existing data in bounds
3. Generate grid points for missing properties
4. Render circles with appropriate colors
```

### New Hook: `usePropertyDispositions`

```typescript
interface PropertyDisposition {
  id: string;
  lat: number;
  lng: number;
  address: string;
  disposition: DoorDisposition | 'not_contacted';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

// Functions:
- fetchPropertiesInBounds(bounds)
- setPropertyDisposition(lat, lng, disposition, customerInfo)
- generatePropertyGrid(bounds, existingProperties)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/door-to-door/PropertySidePanel.tsx` | Right slide-out panel with address, dispositions, customer info |
| `src/components/door-to-door/DispositionQuickBar.tsx` | Horizontal scrollable disposition icons |
| `src/components/door-to-door/PropertyMarkerLayer.tsx` | Circle marker generation and rendering |
| `src/hooks/usePropertyDispositions.ts` | Property data management hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/door-to-door/DoorToDoorMap.tsx` | Add property circle layer, click handling, bounds detection |
| `src/pages/DoorToDoor.tsx` | Add side panel state, property selection handling |
| `src/hooks/useDoorToDoorSession.ts` | Add `not_contacted` disposition type |

## Database Migration

Create `property_dispositions` table with:
- RLS policies for user access
- Index on `lat_lng_hash` for fast lookups
- Index on `(user_id, lat, lng)` for bounds queries

## UI/UX Flow

```
User opens Door to Door
       ↓
Map loads with satellite view
       ↓
Empty yellow circles appear on houses
       ↓
User taps a circle
       ↓
Side panel slides in from right
       ↓
Shows address + disposition buttons
       ↓
User selects disposition
       ↓
Circle color updates immediately
       ↓
Side panel stays open or closes
       ↓
Data persists for future visits
```

## Visual Design

- **Circle Size**: 24-32px diameter
- **Circle Border**: 3px solid
- **Empty State**: Border only (transparent fill)
- **Filled State**: Solid fill with white border
- **Side Panel Width**: 320-380px on desktop, full width on mobile
- **Animation**: Slide-in 200ms ease-out

## Notes

- The 20-second dwell time requirement is removed for this workflow (matches Sales Rabbit UX)
- Points are still awarded when disposition is set
- Property data persists across sessions
- Multiple team members could see each other's dispositions (future feature)
