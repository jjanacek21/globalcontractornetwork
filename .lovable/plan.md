
# Mobile Optimization + Workflow Refinement + PDF Testing Plan

## Overview

This plan addresses three interconnected objectives:
1. **Mobile Optimization**: Add responsive stacked cards, bottom-sheet material selection, and swipe navigation to the permit wizard
2. **Workflow Refinement**: Eliminate the separate Permit Queens landing page route and integrate seamlessly with the contractor dashboard
3. **PDF Testing**: Verify end-to-end permit packet generation with viewable PDFs

---

## Part 1: Mobile Optimization for Permit Wizard

### Current State Analysis

The existing `PermitQueensNewRequest.tsx` wizard:
- Uses grid layouts that don't stack well on mobile (`grid-cols-2`, `md:grid-cols-4`)
- Material selection uses inline `MultiMaterialSelector` with SearchableProductCombobox
- Navigation is button-based (Previous/Next) without swipe support

### Changes Required

| Component | Change |
|-----------|--------|
| `src/pages/PermitQueensNewRequest.tsx` | Add `useIsMobile` hook, wrap cards in mobile-responsive layouts, implement swipe handlers |
| `src/components/permit-queens/MobileMaterialSheet.tsx` | New component - Bottom sheet for material selection on mobile |
| `src/components/permit-queens/WizardProgress.tsx` | Make step indicators touch-friendly and responsive |
| `src/components/permit-queens/MultiMaterialSelector.tsx` | Add mobile-aware variant that opens bottom sheet |

### Implementation Details

#### 1A. Mobile Detection Integration

Add to `PermitQueensNewRequest.tsx`:
```typescript
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MobileMaterialSheet } from "@/components/permit-queens/MobileMaterialSheet";

const isMobile = useIsMobile();
```

#### 1B. Responsive Card Layouts

Update grid classes throughout the wizard:

**Step 1 - Permit Types Grid:**
```tsx
// Current (lines 645-664)
<div className="grid grid-cols-2 gap-3 mb-4">

// Changed to:
<div className={cn(
  "grid gap-3 mb-4",
  isMobile ? "grid-cols-1" : "grid-cols-2"
)}>
```

**Step 1 - Owner Info Grid:**
```tsx
// Current (line 699)
<CardContent className="grid md:grid-cols-2 gap-4">

// Changed to:
<CardContent className={cn(
  "grid gap-4",
  isMobile ? "grid-cols-1" : "md:grid-cols-2"
)}>
```

**Step 3 - Summary Grid:**
```tsx
// Current (line 866)
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

// Changed to:
<div className={cn(
  "grid gap-4 text-sm",
  isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"
)}>
```

#### 1C. Create Mobile Material Sheet Component

New file: `src/components/permit-queens/MobileMaterialSheet.tsx`

A bottom-sheet drawer that opens when tapping "Select Materials" on mobile:
- Uses `vaul` Drawer component (already installed)
- Full-height scrollable list of product categories
- Category accordion expansion
- Tap to select, swipe down to close
- Shows selected count badge

```typescript
interface MobileMaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHVHZ: boolean;
  roofType: 'steep' | 'flat' | 'mixed';
  selectedProducts: MultiSelectedProduct[];
  onProductsChange: (products: MultiSelectedProduct[]) => void;
}
```

#### 1D. Swipe Navigation Between Steps

Add touch gesture support using `framer-motion` (already installed):

```typescript
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  const threshold = 100;
  if (info.offset.x > threshold && currentStep > 1) {
    prevStep();
  } else if (info.offset.x < -threshold && currentStep < 3 && canProceed()) {
    nextStep();
  }
};

// Wrap step content
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: isMobile ? 50 : 0 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: isMobile ? -50 : 0 }}
    drag={isMobile ? "x" : false}
    dragConstraints={{ left: 0, right: 0 }}
    onDragEnd={handleDragEnd}
  >
    {/* Step content */}
  </motion.div>
</AnimatePresence>
```

#### 1E. Touch-Friendly Progress Indicator

Update `WizardProgress.tsx`:
- Increase step circle size on mobile (from 10x10 to 12x12)
- Add tap handlers to allow jumping to completed steps
- Show only step numbers on mobile, full titles on desktop

```typescript
const [touchedStep, setTouchedStep] = useState<number | null>(null);

// Make steps tappable (only to completed steps)
onClick={() => {
  if (isCompleted) onStepClick?.(step.number);
}}
```

---

## Part 2: Workflow Refinement - Eliminate Separate Landing Page

### Current Routing Analysis

From `App.tsx`:
```typescript
<Route path="/permit-queens" element={<PermitQueens />} />  // Landing page
<Route path="/permit-queens/auth" element={<PermitQueensAuth />} />
<Route path="/permit-queens/dashboard" element={<PermitQueensDashboard />} />
```

### Flow Change

**Current Flow:**
1. User visits `/permit-queens` (landing page)
2. User clicks "Start Your First Permit" -> `/permit-queens/auth`
3. User logs in -> `/permit-queens/dashboard`
4. User clicks "New Permit Request" -> `/permit-queens/new-request`

**Optimized Flow:**
1. Contractor Dashboard shows "Permit Expediting" card
2. Click -> `/permit-queens/dashboard` (if authenticated)
3. If not authenticated -> `/permit-queens/auth` with redirect
4. Dashboard shows permits + "New Request" button

### Changes Required

| File | Change |
|------|--------|
| `src/App.tsx` | Redirect `/permit-queens` to `/permit-queens/dashboard` |
| `src/pages/PermitQueensDashboard.tsx` | Update auth redirect to check for existing session |
| `src/pages/MemberDashboard.tsx` | Update link to go directly to dashboard |
| `src/pages/ContractorDashboard.tsx` | Add Permit Queens quick-access card |

### Implementation Details

#### 2A. Update App.tsx Routing

Change the `/permit-queens` route to redirect:
```typescript
// Before
<Route path="/permit-queens" element={<PermitQueens />} />

// After
<Route path="/permit-queens" element={<Navigate to="/permit-queens/dashboard" replace />} />
```

Or modify PermitQueens.tsx to auto-redirect if authenticated:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      navigate('/permit-queens/dashboard');
    }
  };
  checkAuth();
}, []);
```

#### 2B. Add Permit Queens Card to ContractorDashboard

Add a new tab or card in `ContractorDashboard.tsx`:
```typescript
<Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/permit-queens/dashboard')}>
  <CardContent className="p-6 flex items-center gap-4">
    <Crown className="h-10 w-10 text-amber-500" />
    <div>
      <h3 className="font-semibold">Permit Expediting</h3>
      <p className="text-sm text-muted-foreground">Fast-track your Florida permits</p>
    </div>
    <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
  </CardContent>
</Card>
```

---

## Part 3: PDF Viewing & Product Approvals Status

### Current Database Status

From query results:
- **Total Products**: 796
- **With `file_url`**: 15 (1.9%)
- **With `noa_pdf_url`**: 11 (1.4%)
- **With `fl_approval_pdf_url`**: 15 (1.9%)

This means most products won't have viewable PDFs in generated packets.

### PDF Flow Analysis

The `permit-packet-assembler` edge function (lines 478-500):
1. Fetches `product_approvals` for selected product IDs
2. Looks for PDF URL in order: `file_url` -> `noa_pdf_url` -> `fl_approval_pdf_url` -> passed `file_url`
3. If URL exists, adds to `documentIndex` with status `auto_sourced`
4. If no URL, product appears as missing

### Testing Approach

To verify the end-to-end flow:

1. **Identify products with PDFs** - Query products that have file URLs
2. **Create test permit** - Use the wizard with products that have PDFs
3. **Verify packet generation** - Check that PDFs are included in document index
4. **Test PDF viewing** - Confirm PDFViewerDialog opens documents correctly

### Implementation for Testing

Add a test utility or manually verify:

```sql
-- Find products with available PDFs for testing
SELECT id, manufacturer, product_name, noa_number, 
       COALESCE(file_url, noa_pdf_url, fl_approval_pdf_url) as pdf_url
FROM product_approvals 
WHERE is_active = true 
  AND (file_url IS NOT NULL OR noa_pdf_url IS NOT NULL OR fl_approval_pdf_url IS NOT NULL)
LIMIT 10;
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/permit-queens/MobileMaterialSheet.tsx` | Bottom-sheet material selection for mobile |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PermitQueensNewRequest.tsx` | Add mobile detection, responsive grids, swipe navigation, mobile material sheet integration |
| `src/components/permit-queens/WizardProgress.tsx` | Touch-friendly steps, responsive sizing |
| `src/components/permit-queens/MultiMaterialSelector.tsx` | Add mobile variant prop |
| `src/App.tsx` | Add redirect from `/permit-queens` to dashboard |
| `src/pages/PermitQueens.tsx` | Auto-redirect authenticated users |
| `src/pages/ContractorDashboard.tsx` | Add Permit Queens quick-access card |

---

## Technical Implementation Summary

### Phase 1: Mobile Optimization
1. Add `useIsMobile` hook to wizard
2. Create `MobileMaterialSheet` component using Drawer
3. Update all grid layouts with responsive classes
4. Add swipe navigation with framer-motion
5. Make progress indicator touch-friendly

### Phase 2: Workflow Refinement
1. Update routing to redirect landing page
2. Add quick-access card to ContractorDashboard
3. Ensure auth flow preserves redirect intent

### Phase 3: Testing
1. Query database for products with PDFs
2. Create test permit using those products
3. Verify packet generates with PDF documents
4. Confirm PDF viewing works in modal

---

## Expected Outcomes

| Feature | Before | After |
|---------|--------|-------|
| Mobile card layout | 2-column grid always | Stacked on mobile |
| Material selection | Inline dropdowns | Bottom sheet on mobile |
| Step navigation | Button-only | Swipe + buttons on mobile |
| Permit Queens access | Separate landing page | Direct dashboard access |
| Contractor integration | No integration | Quick-access card |
| PDF viewing | ERR_BLOCKED_BY_CLIENT | Inline modal viewer |

---

## Security Considerations

- No changes to RLS policies required
- Mobile optimizations are UI-only
- Swipe navigation respects `canProceed()` validation
- Auth flow unchanged (still requires login)
