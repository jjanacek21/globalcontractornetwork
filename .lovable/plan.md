
# Fix Video Playback in Global Chat Feed

## Problem

Videos in the Door to Door World Live Feed are not playing. This is caused by missing browser-compatibility attributes on the `<video>` elements, particularly affecting iOS Safari and mobile browsers which have stricter autoplay policies.

## Root Cause

Both `SessionFeed.tsx` and `FeedSidebar.tsx` render videos with:
```tsx
<video
  src={post.video_url}
  controls
  autoPlay  // ❌ Blocked by browsers without muted
/>
```

**Missing critical attributes:**
- `playsInline` - Required for iOS Safari inline playback (without this, iOS tries to fullscreen)
- `muted` - Required for autoplay to work on most browsers
- `preload="auto"` - Helps with faster video start

## Solution

Update video elements in both components with proper attributes and add a muted autoplay fallback pattern.

### Files to Update

**1. `src/components/door-to-door/FeedSidebar.tsx`** (lines 486-506)

Update the video element:
```tsx
{activeVideoId === post.id ? (
  <video
    src={post.video_url}
    className="w-full h-full object-cover"
    controls
    autoPlay
    playsInline      // ✅ Required for iOS inline playback
    muted            // ✅ Required for autoplay
    preload="auto"   // ✅ Faster load
    onPlay={(e) => {
      // Attempt to unmute after play starts
      const video = e.currentTarget;
      video.muted = false;
    }}
  />
) : (
  // ... thumbnail remains the same
)}
```

**2. `src/components/door-to-door/SessionFeed.tsx`** (lines 377-383)

Apply the same fix:
```tsx
<video
  src={post.video_url}
  className="w-full h-full object-cover"
  controls
  autoPlay
  playsInline
  muted
  preload="auto"
  onPlay={(e) => {
    const video = e.currentTarget;
    video.muted = false;
  }}
/>
```

## Technical Details

| Attribute | Purpose | Browser Impact |
|-----------|---------|----------------|
| `playsInline` | Prevents iOS from forcing fullscreen | iOS Safari |
| `muted` | Allows autoplay without user gesture | All browsers |
| `preload="auto"` | Buffers video for faster playback | All browsers |
| `onPlay` unmute | Attempts to unmute after autoplay starts | User experience |

### Autoplay Policy Workaround

The fix uses the pattern recommended in the stack overflow solution:
1. Video starts muted (allowed by all browsers)
2. On successful play, attempt to unmute
3. Controls are visible so user can unmute if needed

## Expected Outcome

After this fix:
1. Videos will play inline on iOS Safari (no fullscreen takeover)
2. Videos will autoplay when clicked (muted initially)
3. Sound will attempt to enable automatically after playback starts
4. User can always unmute via video controls if needed
5. Works on desktop and mobile browsers
