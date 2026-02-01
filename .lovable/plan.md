
# Door to Door World - Gamified Field Sales Tracking System

## Overview

This plan implements a comprehensive "Door to Door World" feature - a GPS-tracked, gamified canvassing system for contractors to track door knocking activities, earn points, and verify their field work.

## Architecture

### Database Schema (New Tables Required)

The following 5 tables need to be created (the user mentioned they are "already created" but they do not exist in the database):

**1. field_sessions** - Track canvassing sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles |
| started_at | timestamptz | Session start time |
| ended_at | timestamptz | Session end time (null if active) |
| total_doors | integer | Total doors knocked |
| total_points | integer | Points earned this session |
| route_geojson | jsonb | GeoJSON LineString of walked route |
| is_active | boolean | Whether session is currently active |

**2. door_knocks** - Individual door knock records
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | References field_sessions |
| user_id | uuid | References profiles |
| lat | numeric | Latitude |
| lng | numeric | Longitude |
| address | text | Reverse geocoded address |
| disposition | text | not_home, not_interested, go_back, interested, needs_inspection, appointment_set, contract_signed |
| dwell_time_seconds | integer | Time spent at door (20s minimum) |
| customer_name | text | Optional customer info |
| customer_phone | text | Optional |
| customer_email | text | Optional |
| appointment_date | timestamptz | If appointment was set |
| points_awarded | integer | Points given for this knock |
| notes | text | Optional notes |
| created_at | timestamptz | When door was knocked |

**3. video_verifications** - 30-minute video check-ins
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | References field_sessions |
| user_id | uuid | References profiles |
| video_url | text | URL to uploaded video |
| duration_seconds | integer | Video duration |
| points_awarded | integer | Default 25 |
| created_at | timestamptz | When recorded |

**4. door_to_door_stats** - Aggregate user statistics
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles (unique) |
| total_sessions | integer | Lifetime session count |
| total_doors | integer | Lifetime doors knocked |
| total_points | integer | Lifetime D2D points |
| total_appointments | integer | Appointments set |
| total_contracts | integer | Contracts signed |
| total_verifications | integer | Video verifications |
| current_streak_days | integer | Consecutive work days |
| longest_streak_days | integer | Best streak |
| updated_at | timestamptz | Last update |

**5. user_locations** - Real-time GPS tracking
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles |
| session_id | uuid | References field_sessions |
| lat | numeric | Latitude |
| lng | numeric | Longitude |
| accuracy | numeric | GPS accuracy in meters |
| created_at | timestamptz | Timestamp |

---

## Points System Integration

Points earned from door-to-door activities will be integrated with the existing `user_gamification` table using the `awardPoints` function from `useGamification` hook:

| Activity | Points |
|----------|--------|
| Door knocked (base) | 5 pts |
| Not home | +2 pts |
| Go back (callback) | +3 pts |
| Interested | +10 pts |
| Customer info entered | +20 pts |
| Appointment set | +50 pts |
| Inspection completed | +75 pts |
| Contract signed | +200 pts |
| Video verification | +25 pts |

---

## Component Structure

```
src/
  pages/
    DoorToDoor.tsx                    # Main page with full-screen map
  components/
    door-to-door/
      DoorToDoorMap.tsx               # Mapbox map with GPS tracking
      SessionControls.tsx             # Start/Stop session buttons
      DoorKnockPanel.tsx              # Disposition selection after dwell time
      CustomerInfoForm.tsx            # Name, phone, email, appointment
      VideoVerificationModal.tsx      # 30-minute video prompt
      DoorKnockMarker.tsx             # Clickable pin component
      SessionStats.tsx                # Real-time session statistics
      RoutePathLayer.tsx              # Draws walked route on map
      DwellTimeIndicator.tsx          # 20-second countdown UI
```

---

## Feature Implementation Details

### 1. Service Card Addition (MemberDashboard.tsx)

Add to the services array:
```typescript
{
  icon: DoorOpen,
  title: "Door to Door World",
  description: "GPS-tracked canvassing with gamified challenges",
  link: "/door-to-door",
  color: "bg-purple-600/10 text-purple-600",
  category: "business" as ServiceCategory
}
```

### 2. Route Registration (App.tsx)

```typescript
import DoorToDoor from "./pages/DoorToDoor";
// ...
<Route path="/door-to-door" element={
  <ProtectedRoute redirectTo="/network-login">
    <DoorToDoor />
  </ProtectedRoute>
} />
```

### 3. Main Page Layout (DoorToDoor.tsx)

- Full-height Mapbox map (satellite-streets style)
- Floating "Start Session" / "Stop Session" button
- Real-time GPS location marker
- Route line drawn as user walks
- Pins for each door knocked (color-coded by disposition)
- Floating "Knock Door" button (when session active)
- Bottom sheet for session stats
- Video verification modal (triggered every 30 minutes)

### 4. Door Knock Flow

1. User taps map or "Knock Door" button
2. 20-second dwell timer starts (circular progress indicator)
3. After 20s, disposition panel slides up
4. User selects disposition from list
5. Optional: Enter customer info form expands
6. Points awarded and animated notification
7. Door pin appears on map with disposition color

### 5. GPS Route Tracking

- Use `navigator.geolocation.watchPosition()` with high accuracy
- Store coordinates in `user_locations` table every 5 seconds
- Build GeoJSON LineString for route visualization
- Draw route as a blue line on the map

### 6. Video Verification System

- Track session start time
- Every 30 minutes, show modal: "Time for a check-in!"
- Modal has record button (uses device camera)
- 15-second minimum video
- Upload to Supabase Storage bucket `door-to-door-videos`
- Award 25 points on successful upload

### 7. Disposition Color Coding

| Disposition | Color | Icon |
|-------------|-------|------|
| Not Home | Gray | 🚪 |
| Not Interested | Red | ❌ |
| Go Back | Yellow | 🔄 |
| Interested | Blue | 👍 |
| Needs Inspection | Orange | 🔍 |
| Appointment Set | Green | 📅 |
| Contract Signed | Gold | ✅ |

---

## UI/UX Design

- **Green color scheme** to match existing app theme
- **Mobile-first** design (primary use case is in the field)
- **Large tap targets** for easy use while walking
- **Haptic feedback** on door knock registration
- **Celebration animations** for high-value dispositions
- **Real-time stats counter** visible during session

---

## Technical Details

### 1. Mapbox Integration

Using existing `VITE_MAPBOX_TOKEN` environment variable (already configured)

### 2. Hooks to Create

- `useDoorToDoorSession` - Manage active session state
- `useGPSTracking` - Handle geolocation watching
- `useDoorKnocks` - CRUD operations for door knocks
- `useVideoVerification` - Handle video recording/upload

### 3. Storage Bucket

Create `door-to-door-videos` bucket for video verifications (public: false)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/DoorToDoor.tsx` | Main page component |
| `src/components/door-to-door/DoorToDoorMap.tsx` | Map with GPS tracking |
| `src/components/door-to-door/SessionControls.tsx` | Start/Stop buttons |
| `src/components/door-to-door/DoorKnockPanel.tsx` | Disposition selection |
| `src/components/door-to-door/CustomerInfoForm.tsx` | Customer data entry |
| `src/components/door-to-door/VideoVerificationModal.tsx` | Video check-in |
| `src/components/door-to-door/SessionStats.tsx` | Live session stats |
| `src/components/door-to-door/DwellTimeIndicator.tsx` | 20s countdown |
| `src/hooks/useDoorToDoorSession.ts` | Session management hook |
| `src/hooks/useGPSTracking.ts` | GPS tracking hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/MemberDashboard.tsx` | Add Door to Door service card |
| `src/components/landing/ContractorTools.tsx` | Add Door to Door tool card |
| `src/App.tsx` | Add /door-to-door route |
| `src/hooks/useGamification.ts` | Add door-to-door point constants |

---

## Database Migrations

1. Create `door_to_door_disposition` enum type
2. Create `field_sessions` table with RLS
3. Create `door_knocks` table with RLS
4. Create `video_verifications` table with RLS
5. Create `door_to_door_stats` table with RLS
6. Create `user_locations` table with RLS
7. Create storage bucket for videos
8. Add trigger to update `door_to_door_stats` on new knock
9. Add trigger to award points to `user_gamification`

---

## Security Considerations

- All tables have RLS policies restricting access to own data
- Video uploads authenticated and stored privately
- GPS data only visible to session owner
- Points transactions logged for audit trail
