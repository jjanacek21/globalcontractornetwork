

# Fix Door Knock Registration and Lead Tracking in Door to Door World

## Problems Identified

### Issue 1: Doors Not Registering When Disposition is Selected
When a user selects ANY disposition (not just high-value ones), the door knock is not being recorded to the session because:

1. **Conditional Door Recording**: In `DoorToDoor.tsx` line 294, door knocks are only recorded when `activeSession` exists AND `disposition !== 'not_contacted'`
2. **High-Value Disposition Flow Broken**: When `inspected`, `canvass_lead`, or `won` is selected, the `PropertySidePanel` opens the video verification modal but the `onComplete` callback does NOT trigger `recordDoorKnock` - it only saves the property disposition

### Issue 2: Stats Not Updating for Leads with Customer Info
The user expects:
- When a lead disposition (`inspected`, `canvass_lead`, `won`) is selected with customer name
- The session stats should update (doors knocked count + leads count)
- The global feed should show the activity

**Current broken flow:**
```
User taps "Lead" → Video Modal opens → User records video → 
handleVideoComplete() called → onSave() saves property → 
BUT recordDoorKnock() is NEVER called for video-verified dispositions
```

### Issue 3: Global Feed Not Showing Lead Activity
When a lead is captured with customer info, nothing is posted to the global feed because:
- The `DispositionVideoModal` only saves to `session_progress_videos`
- No post is created in `session_feed_posts`

---

## Solution

### Step 1: Fix Door Knock Recording for ALL Dispositions

**File: `src/components/door-to-door/PropertySidePanel.tsx`**

The `handleVideoComplete` and `handleVideoSkip` callbacks need to be enhanced to also trigger the door knock recording. Currently they just call `onSave()` but the parent component (`DoorToDoor.tsx`) handles door knock recording separately.

**Solution**: Pass a callback prop to track when a door has been knocked with video verification so the parent can call `recordDoorKnock`.

### Step 2: Update DoorToDoor.tsx to Handle Video-Verified Dispositions

**File: `src/pages/DoorToDoor.tsx`**

Update `handleSaveDisposition` to correctly detect when the save is coming from a video-verified flow vs. regular flow. The issue is:

**Current Code (lines 293-307):**
```tsx
// Also record as a door knock for session tracking
if (activeSession && disposition !== 'not_contacted') {
  await recordDoorKnock(...);
}
```

This works for regular dispositions, but for video-verified ones, the panel's internal video modal handling is separate. The `handleSaveDisposition` IS called after video completion, so door knocks SHOULD be recorded.

**Debug Step**: The real issue may be that `recordDoorKnock` fails silently or the session is not active.

### Step 3: Post to Global Feed on High-Value Dispositions

**File: `src/components/door-to-door/DispositionVideoModal.tsx`**

After uploading the video, also create a post in `session_feed_posts` so the activity appears in the global feed:

```tsx
// After saving to session_progress_videos, also post to feed
await supabase
  .from('session_feed_posts')
  .insert({
    session_id: effectiveSessionId,
    user_id: userId,
    video_url: urlData.publicUrl,
    video_type: locationType,
    post_type: 'video',
    content: `${dispositionConfig?.label} at ${propertyAddress || 'a property'}! ${locationType === 'roof' ? '🏠' : locationType === 'homeowner' ? '🤝' : '📍'}`,
    points_earned: calculatedPoints,
    doors_knocked: 1,
    leads_gotten: 1, // High-value dispositions are leads
    goals_doors: null,
    goals_leads: null,
  });
```

### Step 4: Update Session Stats in Database

The `field_sessions` table has `total_doors` and `total_points` columns. Currently `useDoorToDoorSession.recordDoorKnock` updates the local state AND should update the database.

**File: `src/hooks/useDoorToDoorSession.ts`**

Verify the `recordDoorKnock` function updates the database session record (it currently only updates local state on lines 319-323):

```tsx
// Update local session totals
setActiveSession(prev => prev ? {
  ...prev,
  total_doors: prev.total_doors + 1,
  total_points: prev.total_points + pointsAwarded
} : null);
```

**Fix**: Add database update to persist session totals.

### Step 5: Update door_to_door_stats

Create a database trigger or add code to update the `door_to_door_stats` table when door knocks are recorded. This table tracks all-time stats.

---

## Implementation Summary

| File | Changes |
|------|---------|
| `src/pages/DoorToDoor.tsx` | Ensure door knock is recorded for ALL disposition changes (including video-verified ones) |
| `src/components/door-to-door/DispositionVideoModal.tsx` | Add feed post creation on video upload success |
| `src/hooks/useDoorToDoorSession.ts` | Add database update to persist `total_doors`/`total_points` on session record |

---

## Technical Details

### Database Updates Needed

Add a trigger to update `door_to_door_stats` when door_knocks are inserted:

```sql
CREATE OR REPLACE FUNCTION update_door_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO door_to_door_stats (user_id, total_doors, total_points)
  VALUES (NEW.user_id, 1, NEW.points_awarded)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_doors = door_to_door_stats.total_doors + 1,
    total_points = door_to_door_stats.total_points + NEW.points_awarded,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_door_knock_insert
AFTER INSERT ON door_knocks
FOR EACH ROW EXECUTE FUNCTION update_door_stats();
```

Update `field_sessions` totals:

```sql
CREATE OR REPLACE FUNCTION update_session_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE field_sessions
  SET 
    total_doors = total_doors + 1,
    total_points = total_points + NEW.points_awarded
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_door_knock_update_session
AFTER INSERT ON door_knocks
FOR EACH ROW EXECUTE FUNCTION update_session_totals();
```

### Code Changes

**DispositionVideoModal.tsx - Add feed post after video upload:**
- After the `session_progress_videos` insert succeeds
- Insert into `session_feed_posts` with disposition info, video URL, and points

**PropertySidePanel.tsx - Ensure parent records door knock:**
- The current flow already calls `onSave()` which triggers `handleSaveDisposition` in parent
- This should work IF there's an active session

**useDoorToDoorSession.ts - Database persistence:**
- Currently only local state is updated after door knock
- Add Supabase update to persist `total_doors` and `total_points` on `field_sessions`

---

## Expected Outcome

After these fixes:
1. ANY disposition selected will count as a door knocked
2. High-value dispositions (Inspect, Lead, Won) with video verification will post to global feed
3. Session stats (doors/points) will update in real-time and persist to database
4. All-time stats in `door_to_door_stats` will automatically increment
5. Leads with customer info will be tracked toward goals

