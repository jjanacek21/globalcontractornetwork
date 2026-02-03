
# Fix Door to Door World Live Feed Post Creation

## Problem Summary

The "Failed to create post" error occurs because the code attempts to create a fallback `field_sessions` record with columns that don't exist in the database. This happens when a user tries to post from the Live Feed without an active field session.

## Root Cause

**Database/Code Mismatch:**
The `FeedPostComposer.tsx` inserts into `field_sessions` using:
- `status` - Column does not exist
- `goals_doors` - Column does not exist  
- `goals_leads` - Column does not exist

Actual `field_sessions` columns: `id`, `user_id`, `started_at`, `ended_at`, `total_doors`, `total_points`, `route_geojson`, `is_active`, `created_at`

## Solution

### Step 1: Add Missing Columns to field_sessions Table

Add the missing columns that the application expects:

```sql
ALTER TABLE public.field_sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS goals_doors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goals_leads INTEGER DEFAULT 0;
```

### Step 2: Fix FeedPostComposer.tsx Fallback Session Logic

Update the fallback session creation to use correct column names:

**Current problematic code (lines 263-277):**
```tsx
const { data: newSession, error: sessionError } = await supabase
  .from('field_sessions')
  .insert({
    user_id: userId,
    status: 'completed',        // ❌ Column doesn't exist
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    goals_doors: 0,             // ❌ Column doesn't exist
    goals_leads: 0              // ❌ Column doesn't exist
  })
```

**Fixed code after migration:**
```tsx
const { data: newSession, error: sessionError } = await supabase
  .from('field_sessions')
  .insert({
    user_id: userId,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    is_active: false,
    total_doors: 0,
    total_points: 0,
    status: 'completed',
    goals_doors: 0,
    goals_leads: 0
  })
```

## Verification Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| session_feed_posts table | ✅ Ready | Has all required columns |
| session_feed_comments table | ✅ Ready | Supports threaded replies |
| session_feed_reactions table | ✅ Ready | Working with 6 emoji types |
| feed-media storage bucket | ✅ Ready | Public bucket with upload policies |
| field_sessions table | ❌ Fix Required | Missing status, goals_doors, goals_leads |

## Technical Details

### Database Migration
- Adds 3 columns with safe defaults
- Non-breaking change (existing data preserved)
- All new columns have DEFAULT values

### Code Changes
- Update fallback session insert to include `is_active` and `total_*` columns
- Ensures RLS policies work correctly (field_sessions requires `user_id = auth.uid()`)

## Expected Outcome

After this fix:
1. Users can post text/photo/video from Live Feed without an active session
2. The system creates a valid fallback session record
3. Posts display correctly in the feed with real-time updates
4. Comments and reactions work as expected
