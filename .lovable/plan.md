

## Update Member Dashboard: Remove Property Owner Tools & Reorganize Cards

### Changes

**1. Remove "Property Owner Tools" section** (`src/pages/MemberDashboard.tsx`, lines 689-753)
Delete the entire "Property Owner Tools" dark section that contains My Profile, My Messages, and My Projects links.

**2. Add "My Profile" and "My Projects" as service cards** (`src/pages/MemberDashboard.tsx`)
Add two new entries to the `services` array (visible to non-contractors):
- **My Profile** — links to `/homeowner-profile`, User icon, category "home"
- **My Projects** — links to `/homeowner-dashboard`, ClipboardList icon, category "home"

These will appear alongside Instant Quote, Directory, and Maintenance Membership in the same services grid.

**3. Rename "Contractor Directory" to "Directory"** (`src/pages/MemberDashboard.tsx`, line 212)
Change `title: "Contractor Directory"` → `title: "Directory"`

**4. Remove My Messages link**
No Messages card added — it's already removed by deleting the Property Owner Tools section. The messages button in the HomeownerProfile header still exists for access there.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/MemberDashboard.tsx` | Remove Property Owner Tools section (lines 689-753), add My Profile + My Projects service cards, rename "Contractor Directory" → "Directory" |

