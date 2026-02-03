
# Add Video Verification for High-Value Dispositions

## Problem

When users tap **Inspect**, **Lead**, or **Won** buttons in Door to Door World, the disposition saves immediately without prompting for a video verification. The user expects to be asked to record a video showing their location (ground level, on the roof, or with the homeowner) to earn point multipliers (1x, 2x, or 3x).

## Solution Overview

Create a new **Disposition Video Verification Modal** that:
1. Opens when users select high-value dispositions (`inspected`, `canvass_lead`, `won`)
2. Lets users choose their video type: Standard (1x), Roof (2x), or Homeowner (3x)
3. Records and uploads the video
4. Awards multiplied points based on video location
5. Then saves the disposition

## Implementation Details

### Step 1: Create DispositionVideoModal Component

Create a new component `src/components/door-to-door/DispositionVideoModal.tsx` that:
- Accepts disposition type, base points, and callback props
- Shows location selection (Standard/Roof/Homeowner) with point multipliers
- Handles video recording with camera access
- Uploads to Supabase storage `door-to-door-videos` bucket
- Saves record to `session_progress_videos` table with video type
- Returns the final points earned

**Key Features:**
- 5-second minimum video duration
- Back camera preferred for proof-of-location
- Point multipliers: Standard (1x), Roof (2x), Homeowner (3x)
- Auto-post to session feed for visibility

### Step 2: Define High-Value Dispositions

```text
HIGH_VALUE_DISPOSITIONS = ['inspected', 'canvass_lead', 'won']
```

Base points from `DispositionQuickBar.tsx`:
- `inspected`: 100 pts (can earn up to 300 pts with 3x)
- `canvass_lead`: 25 pts (can earn up to 75 pts with 3x)  
- `won`: 200 pts (can earn up to 600 pts with 3x)

### Step 3: Update PropertySidePanel

Modify `handleDispositionSelect` in `PropertySidePanel.tsx`:

```text
Current Flow:
  User taps disposition → Save immediately

New Flow:
  User taps disposition
    → If high-value disposition:
        → Open DispositionVideoModal
        → User records video with location type
        → Award multiplied points
        → Save disposition
    → Else:
        → Save immediately (unchanged)
```

### Step 4: State Management

Add to `PropertySidePanel.tsx`:
- `showDispositionVideo: boolean` - controls modal visibility
- `pendingDisposition: PropertyDisposition | null` - stores disposition awaiting video
- `onVideoComplete` callback - saves disposition after successful video

### Step 5: Database Integration

The video will be saved to:
- **Storage**: `door-to-door-videos` bucket (already exists)
- **Table**: `session_progress_videos` with fields:
  - `video_type`: 'standard' | 'roof' | 'homeowner'
  - `points_multiplier`: 1.0 | 2.0 | 3.0
  - `points_awarded`: calculated points

## Component Structure

```text
PropertySidePanel
  └── DispositionQuickBar (existing)
  └── DispositionVideoModal (new)
        ├── Location Selection (Standard/Roof/Homeowner radio)
        ├── Video Recording Interface
        ├── Preview & Upload Controls
        └── Points Display with Multiplier
```

## User Experience

1. User taps **Inspect** on a property
2. Modal opens: "Verify Your Location for Bonus Points!"
3. User selects: "On the Roof" (2x multiplier)
4. User records 5+ second video showing roof
5. Video uploads, user sees "+200 Points!" (100 base × 2x)
6. Property saves as `inspected` with video verification

## Technical Notes

- Video recording uses `getUserMedia` directly in click handler (Safari compatibility)
- Back camera (`facingMode: 'environment'`) for proof videos
- 5-second minimum enforced before stop button is enabled
- Graceful fallback if user skips video (saves with 1x points, no video)
- Works with or without active field session
