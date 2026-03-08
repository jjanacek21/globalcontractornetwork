

# Plan: Rebrand CRM to GCN-CRM with Modern 3D Glassmorphic UI

## Overview
Rename "PITCH Roofing CRM" to "GCN-CRM" across the sidebar and layout. Redesign the sidebar and top bar with a transparent glassmorphic aesthetic, animated icons, and modern 3D styling.

## Changes

### 1. CRMSidebar.tsx — Rebrand + Glassmorphic Sidebar
- Change header brand from "PITCH / Roofing CRM" to "GCN-CRM / Contractor Suite"
- Replace the `<Sidebar>` with transparent/glass styling:
  - Semi-transparent background with `backdrop-blur-xl`
  - Glowing border accents using the gold brand color
  - Active nav items get a subtle glass highlight + left accent bar
- Add hover animations to nav icons: scale + subtle rotation on hover via `group-hover` transitions
- Animate collapsible group chevrons with smooth rotation
- Footer user avatar gets a pulsing ring effect

### 2. CRMLayout.tsx — Modern Top Bar
- Make top bar glassmorphic: `bg-background/80 backdrop-blur-md` instead of solid
- Add subtle bottom glow/gradient border instead of plain `border-b`
- Search input gets a glass effect with focus glow animation
- Bell icon gets a subtle bounce animation on hover

### 3. index.css — Sidebar CSS Variables
- Update sidebar background variables for both light and dark modes to support transparency:
  - Light: semi-transparent dark green `--sidebar-background`
  - Dark: semi-transparent deeper green
- Add CSS utility classes for glass effects and icon hover animations used in the sidebar

### Files Modified
- `src/components/crm/CRMSidebar.tsx` — rebrand + glassmorphic nav + animated icons
- `src/components/crm/CRMLayout.tsx` — glass top bar
- `src/index.css` — sidebar transparency variables + utility classes

