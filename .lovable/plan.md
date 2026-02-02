
# Door to Door World Enhancement Plan

## Summary

This plan implements major enhancements to transform the Door to Door feature into a comprehensive "Roofing Redline"-style canvassing system with improved countdown functionality, expanded disposition options, and a detailed property sidebar.

---

## 1. Fix Countdown Timer (DwellTimeIndicator)

**File**: `src/components/door-to-door/DwellTimeIndicator.tsx`

The current countdown actually counts UP (from 0 to 20), not DOWN. I'll fix it to:
- Start at 20 and count down to 0
- Update every second with smooth circular progress animation
- Display the remaining time prominently in the center

**Change**:
```typescript
// Show countdown from requiredSeconds to 0
const remaining = Math.max(requiredSeconds - elapsed, 0);
// Progress fills as time passes (0% to 100%)
const progress = Math.min((elapsed / requiredSeconds) * 100, 100);
```

The visual shows `{remaining}` which is correct, but I'll improve the animation timing.

---

## 2. Expand Disposition Options

**Files**: 
- `src/hooks/usePropertyDispositions.ts` - Update PropertyDisposition type
- `src/components/door-to-door/DispositionQuickBar.tsx` - Add new disposition options

**New Dispositions** (matching Roofing Redline style):

| Disposition | Color | Icon | Points |
|-------------|-------|------|--------|
| Not Contacted | Amber (outline) | Circle | 0 |
| Not Home | Gray | Home | +2 |
| Go Back | Amber | RotateCcw | +3 |
| Not Interested | Red | X | 0 |
| Need Inspection | Orange | Search | +75 |
| Interested | Blue | ThumbsUp | +10 |
| Storm Damage | Purple | CloudLightning | +15 |
| Unqualified | Gray | Slash | 0 |
| Canvass Lead | Teal | Users | +25 |
| New Roof | Green | CheckCircle | +50 |
| Follow Up | Yellow | Clock | +5 |
| Waiting | Cyan | Hourglass | +5 |
| Already Solar | Lime | Sun | 0 |
| Opportunity | Indigo | Zap | +30 |
| Commercial | Slate | Building2 | +10 |
| Inspected | Emerald | ClipboardCheck | +100 |
| Old Roof | Brown | Home | +10 |
| Won | Gold | Trophy | +200 |

---

## 3. Enhanced Property Side Panel

**File**: `src/components/door-to-door/PropertySidePanel.tsx`

Add tabbed interface with sections:

### Sidebar Structure

```text
+----------------------------------+
|  [Address]                    X  |
|  [Disposition Status Badge]      |
+----------------------------------+
|  [ Dispositions Tab ] [ Details ] |
|                                   |
|  Quick Disposition Grid (4x5)    |
|  - All 18 disposition options    |
|  - Color-coded buttons           |
|                                   |
+----------------------------------+
|  Customer Info                   |
|  - Name, Phone, Email            |
|  - Add multiple residents (+)    |
+----------------------------------+
|  Project Section                 |
|  - Roof type, condition          |
|  - Insurance claim status        |
+----------------------------------+
|  Proposals                       |
|  - Link to create estimate       |
+----------------------------------+
|  Files / Photos                  |
|  - Upload damage photos          |
|  - Before/after images           |
+----------------------------------+
|  Tags                            |
|  - Storm date, priority, etc.    |
+----------------------------------+
|  Notes History                   |
|  - Timestamped notes log         |
+----------------------------------+
|        [ Save Changes ]          |
+----------------------------------+
```

---

## 4. Property Markers on Map

**File**: `src/components/door-to-door/DoorToDoorMap.tsx`

The map already has property markers! Current implementation:
- Orange outline circles = Not Contacted
- Filled circles with colors = Contacted properties

**Enhancements**:
- Improve marker sizes at different zoom levels
- Add subtle animations when disposition changes
- Show address tooltip on hover

---

## 5. Database Schema Updates

**New table**: `property_residents` (for multiple residents per property)

```sql
CREATE TABLE property_residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property_dispositions(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**New table**: `property_photos` (for damage photos)

```sql
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property_dispositions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT DEFAULT 'general', -- 'before', 'after', 'damage', 'general'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Update**: `property_dispositions` table - add new columns

```sql
ALTER TABLE property_dispositions ADD COLUMN IF NOT EXISTS
  roof_type TEXT,
  roof_condition TEXT,
  insurance_claim BOOLEAN DEFAULT false,
  storm_date DATE,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  tags TEXT[];
```

---

## 6. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePropertyDispositions.ts` | Modify | Expand PropertyDisposition type to 18 options |
| `src/components/door-to-door/DispositionQuickBar.tsx` | Modify | Add all disposition options with icons/colors |
| `src/components/door-to-door/DwellTimeIndicator.tsx` | Modify | Fix countdown animation timing |
| `src/components/door-to-door/PropertySidePanel.tsx` | Major rewrite | Add tabs, multiple residents, photos, project info |
| `src/components/door-to-door/PropertyPhotos.tsx` | Create | Photo upload/display component |
| `src/components/door-to-door/PropertyResidents.tsx` | Create | Multiple residents manager |
| `src/components/door-to-door/PropertyTags.tsx` | Create | Tag management component |
| `src/components/door-to-door/NotesHistory.tsx` | Create | Timestamped notes log |
| `src/hooks/useDoorToDoorSession.ts` | Modify | Update points for new dispositions |
| Database migration | Create | Add new tables and columns |

---

## 7. Technical Implementation Details

### Disposition Color Mapping

```typescript
export function getDispositionColor(disposition: PropertyDisposition): string {
  const colors: Record<PropertyDisposition, string> = {
    'not_contacted': '#f59e0b',
    'not_home': '#64748b',
    'go_back': '#d97706',
    'not_interested': '#dc2626',
    'need_inspection': '#ea580c',
    'interested': '#2563eb',
    'storm_damage': '#9333ea',
    'unqualified': '#94a3b8',
    'canvass_lead': '#14b8a6',
    'new_roof': '#22c55e',
    'follow_up': '#eab308',
    'waiting': '#06b6d4',
    'already_solar': '#84cc16',
    'opportunity': '#6366f1',
    'commercial': '#475569',
    'inspected': '#10b981',
    'old_roof': '#92400e',
    'won': '#fbbf24',
  };
  return colors[disposition] || '#f59e0b';
}
```

### Points System Update

```typescript
export const DOOR_POINTS = {
  base_knock: 5,
  not_home: 2,
  not_interested: 0,
  go_back: 3,
  interested: 10,
  need_inspection: 75,
  storm_damage: 15,
  unqualified: 0,
  canvass_lead: 25,
  new_roof: 50,
  follow_up: 5,
  waiting: 5,
  already_solar: 0,
  opportunity: 30,
  commercial: 10,
  inspected: 100,
  old_roof: 10,
  won: 200,
  customer_info: 20,
  video_verification: 25,
};
```

---

## Expected Outcome

After implementation:
1. Countdown timer properly counts from 20 to 0 with smooth circular animation
2. 18 disposition options matching industry-standard canvassing apps
3. Full-featured sidebar with tabs for customer info, project details, photos, and notes
4. Property markers update color immediately on disposition change
5. Support for multiple residents per property
6. Photo upload capability for damage documentation
7. Tag system for filtering and prioritization
