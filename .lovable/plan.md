

## Simplify Homeowner Dashboard

Remove "My Profile", "AI Project Advisor", and "Training Academy" cards from the Homeowner Tools section, keeping only "My Projects" and "My Messages".

### Changes to `src/pages/HomeownerDashboard.tsx`

1. **Remove 3 cards from the Homeowner Tools grid** (lines 228-297):
   - Delete "My Profile" card (lines 228-244)
   - Delete "AI Project Advisor" card (lines 264-278)
   - Delete "Training Academy" card (lines 280-296)

2. **Keep only**:
   - "My Projects" card (lines 211-226)
   - "My Messages" card (lines 246-262)

3. **Update grid layout**: Change `lg:grid-cols-4` to `sm:grid-cols-2` only (2 cards don't need 4 columns)

4. **Clean up unused imports**: Remove `User`, `GraduationCap`, `Sparkles` from lucide imports since they're no longer used in the tools section (verify they aren't used elsewhere in the file first)

| File | Change |
|------|--------|
| `src/pages/HomeownerDashboard.tsx` | Remove 3 tool cards, keep Projects + Messages, adjust grid |

