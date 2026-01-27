
# Fix PDF Viewing + Optimize Permit Expediting Workflow

## Overview

This plan addresses two objectives:
1. **Immediate Fix**: Enable PDF viewing for AI-sourced product approval documents (ERR_BLOCKED_BY_CLIENT error)
2. **Workflow Optimization**: Streamline the permit intake wizard for TurboTax-like efficiency

---

## Part 1: Fix PDF Viewing for Product Approvals

### Problem
When viewing AI-sourced NOA documents in ProductApprovalsManagement, Chrome blocks navigation to Supabase storage URLs with `ERR_BLOCKED_BY_CLIENT`. This is caused by using direct `<a href target="_blank">` links.

### Solution
Replace all direct anchor links with the existing `PDFViewerDialog` component that renders PDFs inline in an iframe modal.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/ProductApprovalsManagement.tsx` | Replace `<a>` links with PDFViewerDialog state management |

### Implementation Details

1. **Add imports and state** (top of component):
```typescript
import { PDFViewerDialog } from '@/components/ui/PDFViewerDialog';

const [viewingDocument, setViewingDocument] = useState<{
  url: string;
  title: string;
} | null>(null);
```

2. **Replace View Button** (lines 445-459):
   - Change from `<a href={...} target="_blank">` to `<Button onClick={...}>`
   - Set `viewingDocument` state with product PDF URL and title

3. **Replace Document Links in Dialog** (lines 561-590):
   - Change NOA, FL Approval, UL Listing preview links from `<a>` to `<button>` with click handlers

4. **Add PDFViewerDialog at component end** (before closing div):
```typescript
<PDFViewerDialog
  open={!!viewingDocument}
  onOpenChange={(open) => !open && setViewingDocument(null)}
  url={viewingDocument?.url || ''}
  title={viewingDocument?.title || 'Product Approval Document'}
/>
```

---

## Part 2: Workflow Optimization Strategy

### Current Flow Analysis

The current wizard has 4 steps with data collection:

```text
Step 1: Location & Trade
  - Address input with autocomplete (Mapbox)
  - Jurisdiction auto-detection (county/city/HVHZ)
  - Permit type selection (8 types)

Step 2: Project Scope  
  - Owner info (name, email, phone, valuation)
  - Trade-specific questions (RoofingQuestions/WindowDoorQuestions)
  - Material/product selection (MultiMaterialSelector)

Step 3: Documents
  - Jurisdiction document requirements display
  - Smart document uploader
  - Packet preview/generation

Step 4: Review
  - Summary card
  - Generated packet viewer
  - Gap analysis (missing items)
  - Signature checklist
  - Service tier selection
  - Payment agreement
  - Submit
```

### Optimization Goals

| Goal | Current State | Target State |
|------|---------------|--------------|
| Steps | 4 distinct steps | 3 condensed steps (40% reduction) |
| Owner data | Manual entry every time | Prefill from profile/previous permits |
| Contractor data | Not prefilled | Auto-loaded from contractor profile |
| Product selection | Separate from scope | Inline with material selection |
| Packet generation | Manual button click | Auto-generate when step 2 completes |
| Validation | End-of-step checking | Real-time inline validation |
| AI automation | Gap detection only | Valuation estimation, NOA suggestions |

---

## Part 2A: Contractor Profile Auto-Fill

### Database Utilization

The `permit_contractors` table already stores:
- `company_name`, `contact_name`, `phone`, `email`
- `license_number`, `address`

### Implementation

1. **Create useContractorProfile hook**
   - Fetch contractor profile on auth
   - Cache in context for reuse across forms

2. **Auto-fill contractor fields** in wizard:
   - On step 1 load, check for contractor profile
   - Pre-populate any fields that match (phone, email)
   - Show "Using saved profile" indicator

3. **Prior permit data lookup**
   - When address matches previous permit:
   - Auto-suggest owner name from `permit_projects.owner_name`
   - Show "Previously submitted for this address" badge

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useContractorProfile.ts` | New hook to fetch/cache contractor data |
| `src/pages/PermitQueensNewRequest.tsx` | Integrate profile auto-fill logic |

---

## Part 2B: Condensed Wizard Structure

### New 3-Step Flow

```text
Step 1: Property & Scope (merged Location + Trade basics)
  - Address autocomplete with instant jurisdiction detection
  - Permit type selection
  - Year built auto-populated from property appraiser
  - Basic scope (work type, size, stories for roofing)
  - Owner info with profile prefill

Step 2: Materials & Requirements (merged Scope details + Documents prep)
  - Material selection with inline NOA search
  - Section 1524 compliance checkboxes (auto-computed)
  - Real-time AI packet preview (side panel)
  - Missing document checklist (inline, not separate step)
  - Upload zone for required documents

Step 3: Review & Submit (streamlined)
  - Generated packet viewer (auto-generated, not button)
  - Signature status tracker
  - Service tier dropdown (simplified)
  - Single submit button
```

### Implementation Approach

1. **Merge Step 1 & 2 partial content**
   - Move owner info to Step 1 (after address)
   - Keep trade-specific questions inline with material selection

2. **Auto-generate packet on Step 2 completion**
   - Remove "Generate Packet" button
   - Trigger packet assembly when `tradeQuestionsComplete` becomes true
   - Show loading skeleton in side panel while generating

3. **Inline document requirements**
   - Display required documents as a checklist in Step 2
   - Show green checkmarks for auto-sourced NOAs
   - Red flags for missing uploads

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/PermitQueensNewRequest.tsx` | Restructure wizard steps, add auto-generate logic |
| `src/components/permit-queens/WizardProgress.tsx` | Update to 3 steps |

---

## Part 2C: AI-Enhanced Features

### Real-Time Valuation Estimation

Add AI-powered valuation suggestion based on:
- Roof size (squares) x average cost per square
- Material type multiplier
- Jurisdiction complexity factor

### Implementation

1. **Create edge function** `estimate-permit-valuation`:
   - Input: roof_size, material, county, work_type
   - Output: estimated_valuation, confidence, range_low, range_high

2. **Show estimate in form**:
   - Display "AI Estimate: $X-$Y" below valuation field
   - Allow user to accept or override

### Inline NOA Suggestions

When contractor selects a material type:
- AI filters product_approvals by category
- Highlights "recommended" products based on:
  - HVHZ approval status (if in HVHZ zone)
  - Expiration date (not expired or expiring soon)
  - Prior usage (if same product used in previous permits)

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/estimate-permit-valuation/index.ts` | AI valuation estimation |

---

## Part 2D: UI/UX Improvements

### Progress Indicator Enhancement

Current: Static step numbers
Target: Animated progress with completion percentage

```typescript
// Add to WizardProgress
<div className="relative h-2 bg-muted rounded-full overflow-hidden">
  <div 
    className="absolute h-full bg-primary transition-all duration-300"
    style={{ width: `${completionPercentage}%` }}
  />
</div>
```

### Real-Time Validation

Replace end-of-step validation with inline field validation:
- Green checkmarks appear as fields complete
- Red borders on invalid fields with helper text
- "Complete" badge on section headers when done

### Mobile Optimization

Current wizard is desktop-focused. Add:
- Stacked cards on mobile (no 2-column grid)
- Bottom-sheet for material selection
- Swipe navigation between steps

---

## Implementation Phases

### Phase 1 (Immediate - This Session)
1. Fix PDF viewing in ProductApprovalsManagement
2. Add contractor profile prefill hook

### Phase 2 (Next Session)
1. Restructure wizard to 3 steps
2. Implement auto-generate packet logic
3. Add inline document checklist

### Phase 3 (Future)
1. AI valuation estimation
2. Enhanced progress indicators
3. Mobile optimization

---

## Database Changes

None required - existing tables support all features:
- `permit_contractors` for profile data
- `permit_projects` for prior permit lookup
- `product_approvals` for NOA matching

---

## Technical Considerations

### Performance
- Profile data cached in React context
- Prior permit lookup debounced (500ms after address selection)
- Packet generation runs in background (non-blocking)

### Security
- Contractor profile only fetched for authenticated users
- Prior permit lookup restricted to user's own permits via RLS
- AI functions use rate limiting

### Backwards Compatibility
- Existing 4-step wizard remains functional during transition
- Feature flag can toggle between old/new flow
- No data migration required

---

## Summary

| Change | Impact | Effort |
|--------|--------|--------|
| PDF viewing fix | High - Unblocks document access | Low - 30 min |
| Contractor profile prefill | Medium - Reduces data entry | Medium - 2 hrs |
| 3-step wizard | High - Major UX improvement | High - 4 hrs |
| Auto-generate packet | High - Eliminates manual step | Medium - 2 hrs |
| AI valuation | Medium - Nice-to-have | Medium - 2 hrs |

The immediate priority is the PDF viewing fix, followed by the contractor profile integration and wizard consolidation.
