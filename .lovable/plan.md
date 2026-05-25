
# Export Door-to-Door Feature as a Drop-In Doc

Goal: produce **one markdown file** at `/mnt/documents/door-to-door-export.md` that you paste into the Lovable chat on `globalcontractor.app`. It will contain every file's full source + a SQL migration + setup instructions, so the other project's agent can recreate the feature exactly.

## What goes in the document

**1. Overview & setup checklist** (for the other project's agent)
- Required deps: `mapbox-gl`, `@tanstack/react-query`, `lucide-react`, `date-fns`, existing shadcn/ui components
- Required secrets: `MAPBOX_PUBLIC_TOKEN` (or equivalent), confirm Lovable Cloud is enabled
- Required storage buckets: `session-videos`, `property-photos` (with RLS)
- Route to register in `App.tsx`: `/door-to-door` → `<DoorToDoor />`
- Link from member dashboard

**2. Database migration** (single SQL block)
Tables to recreate with RLS:
- `field_sessions` — active rep sessions, GPS path, stats
- `door_knocks` — every knock event with disposition + points
- `property_dispositions` — per-address status persistence
- `door_session_goals` — pre-session goal videos
- `door_to_door_stats` — aggregated leaderboard stats
- `session_feed_posts`, `session_feed_comments`, `session_feed_reactions` — live feed
- `session_progress_videos` — milestone celebration videos
- Storage buckets + policies for video/photo uploads

**3. Edge function**
- `log-training-session/index.ts` (full source)

**4. Frontend source — full files, copy-paste ready**
- `src/pages/DoorToDoor.tsx` (520 lines)
- `src/hooks/useDoorToDoorSession.ts` (483 lines)
- All 22 files in `src/components/door-to-door/`:
  - Map / session: `DoorToDoorMap`, `SessionControls`, `SessionStats`, `SessionFeed`, `DwellTimeIndicator`
  - Knock flow: `DoorKnockPanel`, `DispositionQuickBar`, `CustomerInfoForm`, `NotesHistory`
  - Property panel: `PropertySidePanel`, `PropertyPhotos`, `PropertyResidents`, `PropertyTags`, `InstantQuoteSection`, `GoodBetterBestCards`
  - Video/gamification: `VideoVerificationModal`, `DispositionVideoModal`, `ProgressVideoModal`, `PreSessionGoalVideo`
  - Feed: `FeedSidebar`, `FeedPostComposer`, `FeedComments`

**5. Integration snippets**
- Diff snippet to add lazy route in target `App.tsx`
- Optional dashboard tile snippet (from `ContractorTools.tsx`)

**6. Adaptation notes**
- Any references to this app's specific tables (`profiles`, `super_admins`, `gcn_*`) flagged inline with a `// PORT NOTE:` comment so the other agent knows what to wire up
- Mapbox token env var name to confirm
- Anything pointing at `/member/dashboard` or other GCN-specific routes flagged for update

## Process

1. Read every file listed above in full
2. Dump current schema for the 10 tables + storage buckets/policies via `supabase--read_query` and convert to a portable `CREATE TABLE ... CREATE POLICY ...` migration
3. Concatenate everything into `/mnt/documents/door-to-door-export.md` with clear section headers and fenced code blocks tagged with file paths
4. Emit a `<presentation-artifact>` tag so you can download it

## Out of scope

- No changes to this project (the feature stays live here)
- No actual porting in the other project — that's done by pasting the doc into its Lovable chat
- I won't migrate historical data (rep sessions, knocks) — schema only
