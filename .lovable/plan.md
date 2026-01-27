
# Rebranding "Permit Queens" to "Permit Expediting" + Workflow Streamlining

## Overview

This plan removes the "Permit Queens" branding throughout the application and streamlines the workflow so that clicking "Permit Expediting" from the Member Dashboard goes directly to the permit dashboard (no landing page).

---

## Part 1: Branding Changes

### Text/Label Replacements

| Location | Current | New |
|----------|---------|-----|
| Dashboard header | "Permit Queens" / "Client Portal" | "Permit Expediting" / "Contractor Portal" |
| MemberDashboard services | "Permit Expediting" (already correct) | Keep as-is |
| All page titles | "Permit Queens" | "Permit Expediting" |
| Auth page | "Permit Queens" | "Permit Expediting" |
| Admin pages | "Permit Queens Admin" | "Permit Expediting Admin" |

### Files to Modify for Branding

| File | Changes |
|------|---------|
| `src/pages/PermitQueensDashboard.tsx` | Change header title from "Permit Queens" to "Permit Expediting" (lines 139-141) |
| `src/pages/PermitQueensAuth.tsx` | Change page title/branding |
| `src/pages/PermitQueensNewRequest.tsx` | Update any "Permit Queens" references in UI |
| `src/pages/PermitQueensAdminAuth.tsx` | Change admin title |
| `src/pages/PermitQueensAdminDashboard.tsx` | Change admin dashboard title |
| `src/components/permit-queens/PermitQueensHeader.tsx` | Change header branding (optional - may not be needed if landing page removed) |
| `src/components/permit-queens/PermitQueensFooter.tsx` | Change footer branding (optional - may not be needed if landing page removed) |

---

## Part 2: Workflow Streamlining

### Current Flow (To Be Eliminated)
```text
MemberDashboard -> "/permit-queens" (Landing Page) -> Auth -> Dashboard
```

### New Flow (Target)
```text
MemberDashboard -> "/permit-queens/dashboard" (Direct to Dashboard)
                   |
                   v
              (If not auth) -> "/permit-queens/auth" -> Dashboard
```

### Routing Changes in `src/App.tsx`

**Option A: Redirect Landing Page Route**
```typescript
// Before (line 190)
<Route path="/permit-queens" element={<PermitQueens />} />

// After - Redirect to dashboard
<Route path="/permit-queens" element={<Navigate to="/permit-queens/dashboard" replace />} />
```

**Option B: Remove Route Entirely**
Simply remove the `/permit-queens` route and update all links.

### Link Updates in `src/pages/MemberDashboard.tsx`

```typescript
// Before (line 218-219)
{
  title: "Permit Expediting",
  link: "/permit-queens",  // Goes to landing page
}

// After
{
  title: "Permit Expediting",
  link: "/permit-queens/dashboard",  // Goes directly to dashboard
}
```

---

## Part 3: Landing Page Disposition

### Options for `PermitQueens.tsx`

1. **Keep for SEO/Marketing** - Landing page remains accessible but not in normal workflow
2. **Delete entirely** - Remove the file and route completely
3. **Convert to redirect** - Make it auto-redirect to dashboard

### Recommendation
Use **Option A** (redirect in App.tsx) - This preserves the landing page code for potential future marketing use while ensuring the workflow is streamlined.

---

## Part 4: Specific File Changes

### 4A. `src/App.tsx` - Routing

```typescript
// Line 190: Change from landing page to redirect
<Route path="/permit-queens" element={<Navigate to="/permit-queens/dashboard" replace />} />
```

### 4B. `src/pages/MemberDashboard.tsx` - Service Link

```typescript
// Line 216-221: Update link destination
{
  icon: Crown,
  title: "Permit Expediting",
  description: "Fast-track Florida building permits",
  link: "/permit-queens/dashboard",  // Changed from "/permit-queens"
  color: "bg-amber-500/10 text-amber-600",
  category: "business" as ServiceCategory
}
```

### 4C. `src/pages/PermitQueensDashboard.tsx` - Header Branding

```typescript
// Lines 133-142: Update header branding
<header className="border-b border-white/10 bg-[hsl(0,0%,5%)] backdrop-blur-lg sticky top-0 z-50">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="icon-container-gold !w-10 !h-10 !rounded-full">
        <Crown className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white">Permit Expediting</h1>  {/* Changed */}
        <p className="text-xs text-white/50">Contractor Portal</p>  {/* Changed */}
      </div>
    </div>
    ...
  </div>
</header>
```

### 4D. `src/pages/PermitQueensAuth.tsx` - Auth Page Branding

Update the page title and any "Permit Queens" text to "Permit Expediting".

### 4E. `src/pages/PermitQueensNewRequest.tsx` - Wizard Page

Update any "Permit Queens" references in the wizard UI to "Permit Expediting".

### 4F. `src/pages/PermitQueensAdminAuth.tsx` & `PermitQueensAdminDashboard.tsx`

Update admin portal branding from "Permit Queens Admin" to "Permit Expediting Admin".

---

## Part 5: Mobile Optimization (From Previous Plan)

In addition to the branding changes, apply the mobile optimizations:

### 5A. Responsive Layouts in `PermitQueensNewRequest.tsx`

Add `useIsMobile` hook and update grid classes:

```typescript
import { useIsMobile } from "@/hooks/use-mobile";

const isMobile = useIsMobile();

// Update grid layouts
<div className={cn("grid gap-3 mb-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
```

### 5B. Create `MobileMaterialSheet.tsx`

New bottom-sheet component for material selection on mobile devices.

### 5C. Swipe Navigation

Add framer-motion swipe gestures for step navigation on mobile.

### 5D. Touch-Friendly Progress Indicator

Update `WizardProgress.tsx` with larger touch targets and tap-to-navigate functionality.

---

## Part 6: PDF Testing Verification

### Test Flow

1. Navigate to `/permit-queens/dashboard`
2. Click "New Permit Request"
3. Complete Step 1 (Property & Scope) with a test address
4. Complete Step 2 (Materials & Docs) - select products with PDFs:
   - Query products with PDFs: `SELECT * FROM product_approvals WHERE file_url IS NOT NULL LIMIT 5`
5. Proceed to Step 3 (Review & Submit)
6. Verify packet auto-generates
7. Click on a document in the packet viewer
8. Confirm PDF opens in modal (not new tab with blocked error)

---

## Summary of Files to Modify

| File | Type of Change |
|------|----------------|
| `src/App.tsx` | Route redirect |
| `src/pages/MemberDashboard.tsx` | Service link update |
| `src/pages/PermitQueensDashboard.tsx` | Branding text |
| `src/pages/PermitQueensAuth.tsx` | Branding text |
| `src/pages/PermitQueensNewRequest.tsx` | Branding text + Mobile optimization |
| `src/pages/PermitQueensAdminAuth.tsx` | Branding text |
| `src/pages/PermitQueensAdminDashboard.tsx` | Branding text |
| `src/components/permit-queens/WizardProgress.tsx` | Mobile touch targets |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/permit-queens/MobileMaterialSheet.tsx` | Bottom-sheet for mobile material selection |

---

## Implementation Order

1. **Routing & Links** - Update App.tsx redirect and MemberDashboard link
2. **Dashboard Branding** - Update PermitQueensDashboard header
3. **Auth Branding** - Update PermitQueensAuth page
4. **Wizard Updates** - Update PermitQueensNewRequest branding + mobile optimization
5. **Admin Branding** - Update admin pages
6. **Create MobileMaterialSheet** - New component for mobile UX
7. **Test PDF Flow** - End-to-end verification

---

## Notes

- The file names remain `PermitQueens*.tsx` for now (renaming files would be a larger refactor)
- URL paths remain `/permit-queens/*` for backward compatibility
- Only UI-visible text is changed from "Permit Queens" to "Permit Expediting"
- The `PermitQueens.tsx` landing page is preserved but bypassed via redirect
