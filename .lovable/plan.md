## Goal
Make the GCN gold logo prominent in the homepage header (and footer) with a transparent background, sized 3× current.

## Changes

### 1. Replace logo asset with a transparent version
- The uploaded `gcn-logo-2.png` has a solid white background that will not blend with the cream/parchment hero background.
- Use `imagegen--edit_image` on `user-uploads://gcn-logo-2.png` to remove the white background, output a clean transparent PNG to `public/gcn-logo.png` (overwrites existing).

### 2. Resize logo in `src/pages/Home.tsx`
Update the `.gcn-home .logo-img` CSS block (around line 69-71):
- Header logo: `height: 64px` → `height: 192px`, `max-width: 240px` → `max-width: 720px`
- Footer logo: `height: 56px` → `height: 168px`
- Keep `background: transparent`, drop-shadow, and hover scale.
- Adjust header padding/row alignment if needed so the larger logo sits cleanly next to the nav (vertically centered, no clipping).

### 3. No other content changes
- Hero copy, CTAs, SEO, routes — all untouched.
- Footer layout only adapts to the taller logo.

## Out of scope
Login/Join nav, JoinNetwork page, routing.
