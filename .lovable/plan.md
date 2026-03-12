

# Move Return Button to PropertyIQ Header Bar

## Changes

### 1. `src/components/property-iq/PropertyIQHeader.tsx`
- Add a "Back to Dashboard" button (using `Home` or `LayoutDashboard` icon) on the left side of the header, before the PropertyIQ logo
- Links to `/member/dashboard`

### 2. `src/pages/PropertyIQ.tsx`
- Remove the `ReturnHomeButton` from the hero section and its import

