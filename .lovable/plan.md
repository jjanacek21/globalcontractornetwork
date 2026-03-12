

# Add Return to Dashboard Button on PropertyIQ Main Page

## Change

### `src/pages/PropertyIQ.tsx`
- Import the existing `ReturnHomeButton` component from `@/components/layout/ReturnHomeButton`
- Place it in the header area (top of the hero section or above it) so users can navigate back to `/member/dashboard`

This reuses the existing `ReturnHomeButton` component which already links to `/member/dashboard` with proper styling.

