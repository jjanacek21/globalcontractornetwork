
# Enhanced Live Feed Sidebar for Door to Door World

## Overview
Upgrade the existing FeedSidebar component with improved UI/UX, better toggle mechanics (chat icon), enhanced real-time notifications, a "My Team" tab, and an optimized post display showing user profiles, goal panels, progress bars, point multipliers, and emoji reactions from ALL users.

---

## Current State Analysis

The `FeedSidebar.tsx` component already has:
- Real-time Supabase subscriptions for new posts and reactions
- Following/Trending tabs
- Basic post cards with avatar fallbacks, video playback, and reactions
- New posts notification banner
- Slide-out animation with framer-motion

**Missing/Needs Improvement:**
1. Toggle button uses generic arrows instead of a chat icon
2. No "My Team" tab to filter by team/company members
3. Profile photos not displayed (profiles table lacks `avatar_url` column)
4. Emoji reactions only show 4 of 6 available types
5. No pulsing/attention animation for new content
6. Progress bars could be more prominent
7. No live status indicators for active sessions

---

## Implementation Plan

### Phase 1: Database Enhancement

**Add avatar_url column to profiles table:**

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

This allows users to have profile photos displayed in the feed.

---

### Phase 2: UI/UX Improvements

**File: `src/components/door-to-door/FeedSidebar.tsx`**

#### 2.1 Toggle Button Enhancement
- Replace arrow icons with `MessageSquare` (chat icon) from Lucide
- Add pulse animation when new posts arrive
- Show notification badge count

```tsx
// Before
<TrendingUp className="w-5 h-5 text-primary" />
<ChevronLeft className="w-4 h-4" />

// After
<MessageSquare className="w-5 h-5 text-primary" />
{newPostsCount > 0 && (
  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center animate-pulse">
    {newPostsCount}
  </span>
)}
```

#### 2.2 Add "My Team" Tab
- Extend `FeedTab` type: `'following' | 'trending' | 'team'`
- Filter posts by team members (users from same company)
- Query company_members table to get team user IDs

```tsx
// Three-column tab layout
<TabsList className="grid w-full grid-cols-3 h-8">
  <TabsTrigger value="following">
    <Bell className="w-3 h-3 mr-1" /> All
  </TabsTrigger>
  <TabsTrigger value="team">
    <Users className="w-3 h-3 mr-1" /> My Team
  </TabsTrigger>
  <TabsTrigger value="trending">
    <TrendingUp className="w-3 h-3 mr-1" /> Hot
  </TabsTrigger>
</TabsList>
```

#### 2.3 Enhanced Profile Display
- Fetch `avatar_url` from profiles table
- Use `AvatarImage` component for profile photos
- Add online/active session indicator ring

```tsx
<Avatar className="w-10 h-10">
  <AvatarImage src={post.profile?.avatar_url || undefined} />
  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
    {post.profile?.first_name?.[0] || 'U'}
    {post.profile?.last_name?.[0] || ''}
  </AvatarFallback>
</Avatar>
```

#### 2.4 Show All 6 Emoji Reactions
- Display all reaction types: fire, muscle, clap, target, star, rocket
- Better layout with flex-wrap for reactions

```tsx
const REACTION_TYPES = ['🔥', '💪', '👏', '🎯', '⭐', '🚀'] as const;

// Show all reactions instead of slice(0, 4)
{REACTION_TYPES.map((emoji) => { ... })}
```

#### 2.5 Enhanced Goal Panel
- More prominent progress bars with labels
- Show doors knocked vs goal, leads vs goal
- Color-coded progress (amber for doors, green for leads)
- Add percentage completion text

```tsx
<div className="bg-gradient-to-r from-muted/60 to-muted/40 rounded-lg p-3 space-y-2.5">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium flex items-center gap-1.5">
      <Target className="w-3.5 h-3.5 text-primary" />
      Goals Progress
    </span>
    <span className="text-xs text-muted-foreground">
      {Math.round((post.doors_knocked / post.goals_doors) * 100)}% complete
    </span>
  </div>
  {/* Progress bars */}
</div>
```

#### 2.6 Point Multiplier Badges
- More visible multiplier badges for 2x (Roof) and 3x (Homeowner)
- Gradient background for bonus indicators

```tsx
{showMultiplier && (
  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 border-0">
    {config.multiplier} BONUS
  </Badge>
)}
```

#### 2.7 Real-time Animations
- Pulse animation on toggle button when new posts arrive
- Smooth entry animations for new posts
- "New" indicator on recently posted items

```tsx
// Add to toggle button when new posts exist
className={cn(
  "fixed z-50 bg-card border shadow-lg rounded-l-xl p-2",
  newPostsCount > 0 && "animate-pulse ring-2 ring-primary"
)}
```

---

### Phase 3: Data Fetching Improvements

#### 3.1 Optimized Profile Fetching
Update the profiles query to include `avatar_url`:

```tsx
const { data: profilesData } = await supabase
  .from('profiles')
  .select('id, first_name, last_name, avatar_url')
  .in('id', userIds);
```

#### 3.2 Team Filtering Logic
For "My Team" tab, fetch team members first:

```tsx
// Fetch current user's company
const { data: membership } = await supabase
  .from('company_members')
  .select('company_id')
  .eq('user_id', userId)
  .single();

if (membership?.company_id) {
  // Fetch team member IDs
  const { data: teamMembers } = await supabase
    .from('company_members')
    .select('user_id')
    .eq('company_id', membership.company_id);
  
  // Filter posts by team members
  query = query.in('user_id', teamMembers.map(m => m.user_id));
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/door-to-door/FeedSidebar.tsx` | Major UI overhaul, add My Team tab, enhance reactions/profiles |
| Database migration | Add `avatar_url` column to profiles table |

---

## Technical Details

### Updated FeedPost Interface
```tsx
interface FeedPost {
  id: string;
  session_id: string;
  user_id: string;
  video_url: string | null;
  video_type: 'goal' | 'progress' | 'roof' | 'homeowner';
  content: string | null;
  points_earned: number;
  doors_knocked: number;
  leads_gotten: number;
  goals_doors: number | null;
  goals_leads: number | null;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null; // NEW
  };
  reactions: { reaction_type: string; count: number }[];
  userReaction?: string;
  totalReactions: number;
}
```

### Component Props (unchanged)
```tsx
interface FeedSidebarProps {
  userId?: string;
  isOpen: boolean;
  onToggle: () => void;
}
```

---

## Visual Changes Summary

```text
Current Toggle:                    Enhanced Toggle:
┌─────────┐                       ┌─────────┐
│  📈 ◀  │                       │  💬 ●3 │  (chat icon + badge)
└─────────┘                       └─────────┘
                                   ↑ pulses when new posts

Current Tabs:                      Enhanced Tabs:
┌──────────────────┐              ┌──────────────────────────┐
│ Following │ Trending │          │  All │ My Team │  Hot   │
└──────────────────┘              └──────────────────────────┘

Current Reactions (4):             Enhanced Reactions (6):
🔥 💪 👏 🎯                        🔥 💪 👏 🎯 ⭐ 🚀
```

---

## Expected Outcome

After implementation:
- Chat icon toggle button with pulsing notification badge
- Three tabs: All (Following), My Team, Hot (Trending)
- Profile photos displayed when available
- All 6 emoji reactions visible and interactive
- Enhanced goal panels with clear progress visualization
- Point multiplier badges prominently displayed
- Smooth real-time animations for new content
- Team-based filtering for company members
