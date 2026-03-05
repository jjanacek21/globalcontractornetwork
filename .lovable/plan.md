

# Make Roof Color Preview More Realistic and 3D

## Overview
Replace the flat 2D SVG house illustration with a perspective 3D-style SVG that has depth, shadows, gradients, and material-specific textures. Each house style will have a distinct 3D shape.

## Approach
Keep it as SVG (no Three.js overhead) but use 3D isometric perspective with:
- **Depth/perspective**: Walls shown at an angle to give 3D appearance
- **Shadows**: Drop shadows beneath the house and roof overhangs
- **Gradients**: Roof surfaces with light/dark sides to simulate sun direction
- **Material textures**: Shingle rows with staggered pattern, metal standing seam ridges
- **Ambient details**: Bushes, walkway, garage, more realistic windows with shutters

## File to Change
`src/components/roofing/RoofColorVisualizer.tsx` — replace the SVG block (lines 139-193) with a new 3D-perspective SVG per house style.

## SVG Design Per Style

### Ranch (default)
- Low-profile single-story, wide house from 3/4 angle
- Two visible wall faces (front lighter, side darker)
- Low-pitched gable roof with overhang, two color faces (sun side / shade side)
- Garage door on side, front door with porch

### Colonial
- Two-story from 3/4 angle, taller proportions
- Steep gable roof, dormers, symmetrical windows

### Mediterranean
- Stucco walls (warm tone), barrel tile texture on roof
- Arched windows, terracotta accents

### Modern
- Flat/low-slope roof, large glass windows
- Clean geometric lines, minimal overhangs

## Rendering Technique
- Use `selectedColor.hex` as the base roof fill
- Compute a darker shade (multiply RGB by 0.75) for the shadow side of the roof
- Add a subtle highlight gradient on the sun-facing side
- Use `<filter>` for drop shadow beneath house
- Shingle texture: staggered horizontal lines with slight opacity variation
- Metal texture: vertical standing seam lines with white highlight

## No functional changes — purely visual enhancement to the SVG illustration.

