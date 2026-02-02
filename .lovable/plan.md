
# Fix Door to Door World Feature - Critical Updates

## Summary

After analyzing the Door to Door World feature at `/door-to-door`, I've identified several issues that need to be fixed to ensure the feature works correctly. The primary issues are:

1. **Missing Mapbox token fallback** - Map may fail to load if the environment variable isn't available
2. **Property marker click events not properly captured** - Coordinates passed incorrectly in some cases  
3. **Missing session ID reference** - Door knocks may not link properly to property dispositions
4. **Stats display timer not updating** - Session duration doesn't update in real-time
5. **Video storage bucket policies** - May prevent video uploads

---

## Fix 1: Add Mapbox Token Fallback

**File**: `src/components/door-to-door/DoorToDoorMap.tsx`

The current code has no fallback if `VITE_MAPBOX_TOKEN` isn't available. Other map components have fallbacks. I'll add one to ensure the map always loads.

**Change**:
```typescript
// Before
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// After  
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 
  'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNxcXAyMGkwMmt3MmtwOHRtZzRtdTQ0In0.r5TIIyCB7DcObd5rs4BVIw';
```

---

## Fix 2: Fix Session Stats Timer

**File**: `src/components/door-to-door/SessionStats.tsx`

The current implementation calculates duration once when rendered, but doesn't update in real-time. I'll add a `useEffect` with an interval to update every second.

**Change**: Add state for live duration and interval to update it:
```typescript
const [liveDuration, setLiveDuration] = useState("00:00");

useEffect(() => {
  if (!sessionStartTime) return;
  
  const interval = setInterval(() => {
    // Calculate and update duration
  }, 1000);
  
  return () => clearInterval(interval);
}, [sessionStartTime]);
```

---

## Fix 3: Improve Property Click Handling

**File**: `src/components/door-to-door/DoorToDoorMap.tsx`

Currently, the property click handler uses `properties.find()` which may not find the correct property due to floating point comparison issues. I'll improve the lookup logic to use the `latLngHash` from the feature properties directly.

**Change**: Update click handlers to pass complete property data:
```typescript
// Use latLngHash for lookup instead of coordinate matching
const existingProperty = properties.find(p => p.latLngHash === props?.latLngHash);
```

---

## Fix 4: Add Missing Session ID to Property Updates

**File**: `src/hooks/usePropertyDispositions.ts`

When updating a property disposition during an active session, the session ID should be recorded for tracking purposes. I'll add an optional `sessionId` parameter.

**Change**: Add session tracking to property disposition upserts:
```typescript
const setPropertyDisposition = useCallback(async (
  lat: number,
  lng: number,
  disposition: PropertyDisposition,
  customerInfo?: {...},
  address?: string,
  sessionId?: string  // New optional parameter
) => {
  // Include session_id in upsert if provided
});
```

---

## Fix 5: Add Video Storage Policy Check

**Database Migration**

Ensure the `door-to-door-videos` bucket has proper RLS policies allowing authenticated users to upload their own verification videos.

**SQL**:
```sql
-- Add storage policies for video uploads
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'door-to-door-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Fix 6: Improve Error Handling

**File**: `src/pages/DoorToDoor.tsx`

Add better error handling for the case when GPS permission is denied or session creation fails.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/door-to-door/DoorToDoorMap.tsx` | Add Mapbox fallback token |
| `src/components/door-to-door/SessionStats.tsx` | Add real-time duration timer |
| `src/hooks/usePropertyDispositions.ts` | Add optional session ID tracking |
| `src/pages/DoorToDoor.tsx` | Improve error handling |
| Database migration | Add storage policies for video bucket |

---

## Technical Details

### Current Data Flow

```text
User opens /door-to-door
    ↓
Auth check → redirects to login if not authenticated
    ↓
Map initializes with user's GPS position
    ↓
On bounds change → fetch existing properties + generate grid
    ↓
User clicks property circle → side panel opens
    ↓
User selects disposition → saves to property_dispositions + door_knocks
    ↓
Points awarded via gamification hook
```

### Points System (already correct)

| Action | Points |
|--------|--------|
| Base knock | 5 |
| Not home | +2 |
| Go back | +3 |
| Interested | +10 |
| Customer info | +20 |
| Appointment set | +50 |
| Needs inspection | +75 |
| Contract signed | +200 |
| Video verification | +25 |

---

## Expected Outcome

After implementing these fixes:
- Map will always load (with fallback token)
- Session timer will update in real-time
- Property markers will be clickable and save properly
- Video uploads will work correctly
- Better error messages for GPS/session issues

