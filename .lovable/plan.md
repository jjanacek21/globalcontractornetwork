

# Retheme Supplement Kings to White & Green

## Overview
Convert the Supplement Kings page and all its sub-components from the current dark blue/slate theme to the white background + emerald green accent theme used across other service pages (like Green Home Solutions).

## Color Mapping

| Current (Dark Blue/Slate) | New (White/Green) |
|---|---|
| `bg-slate-950`, `bg-slate-900` | `bg-white`, `bg-gray-50` |
| `bg-slate-800/50` | `bg-white border-gray-200` |
| `border-slate-700` | `border-gray-200` |
| `text-white` | `text-gray-900` |
| `text-slate-300`, `text-slate-400` | `text-gray-600`, `text-gray-500` |
| `text-blue-400`, `bg-blue-600` | `text-emerald-600`, `bg-emerald-600` |
| `from-blue-600 to-yellow-500` | `from-emerald-500 to-emerald-600` |
| `bg-blue-500/10` | `bg-emerald-50` or `bg-emerald-500/10` |
| `hover:border-blue-500` | `hover:border-emerald-500` |

## Files to Update (6 files)

### 1. `src/pages/SupplementKings.tsx`
- Root: `bg-slate-950` → `bg-white`
- Hero gradient: emerald-based instead of blue/slate
- All section backgrounds: white/gray-50 alternating
- Text colors: dark text on light backgrounds
- Buttons: emerald gradients replacing blue
- Stats: emerald-600 instead of blue-400
- Cards: white bg with gray borders
- CTA section: emerald gradient border/bg

### 2. `src/components/supplement-kings/SupplementKingsHeader.tsx`
- Header bg: `bg-white border-b shadow-sm` (matching GreenHomeHeader)
- Logo icon bg: emerald gradient
- Nav text: `text-gray-700 hover:text-emerald-600`
- Buttons: emerald colors
- Mobile menu: white bg

### 3. `src/components/supplement-kings/SupplementKingsFooter.tsx`
- Footer bg: `bg-gray-900` (standard dark footer)
- Accent colors: emerald replacing blue
- Link hovers: emerald-400

### 4. `src/components/supplement-kings/TestimonialsSection.tsx`
- Section bg: `bg-gray-50`
- Cards: white bg, gray borders
- Text: dark on light
- Play button: emerald
- Stars: keep yellow
- Review card: white bg

### 5. `src/components/supplement-kings/XactimateExamplesSection.tsx`
- Section bg: white
- Cards: white bg, gray borders
- Header text: dark
- Supplement Kings column: emerald tint bg
- Badge: emerald

### 6. `src/components/supplement-kings/AboutUsModal.tsx`
- Dialog bg: white
- Text: dark colors
- Icon accents: emerald
- Video placeholder: gray-100 bg

## Hero Section Design
The hero will use an emerald gradient background (matching GreenHomeHero pattern):
- `bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900`
- White text on dark green hero
- Yellow accent for highlights (matching existing pattern)
- Crown icon retained with emerald/yellow gradient

## No functional changes -- purely visual/CSS class swaps.

