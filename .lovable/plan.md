
# Permit Expediting Workflow Optimization - TurboTax-Style Efficiency

## Current State Analysis

The existing wizard has **4 steps** with significant data collection:

| Step | Current Content | Issues |
|------|-----------------|--------|
| 1. Location & Trade | Address input, permit type selection, jurisdiction detection | Works well but no profile prefill |
| 2. Project Scope | Owner info, trade questions, material selection | Owner data manual every time |
| 3. Documents | Document upload, packet preview | Manual "Generate Packet" button required |
| 4. Review | Summary, packet viewer, signatures, service tier | Gap analysis runs late, too much content |

**Pain Points Identified:**
- Owner/contractor data manually entered on every permit (no reuse)
- Valuation requires guesswork (no AI estimation)
- Packet generation requires manual button click
- 4 separate steps when content could be consolidated
- Prior permit data at same address not leveraged

---

## Optimized 3-Step Wizard Structure

### New Step 1: Property & Scope (Merged)

Combines current Step 1 + partial Step 2:

**Content:**
1. Address autocomplete with instant jurisdiction detection (existing)
2. Permit type selection (Roofing, Windows prominently; others secondary)
3. Owner info with auto-fill:
   - Prior permit lookup: If address matches previous permit, auto-suggest owner name/email/phone/valuation
   - Contractor profile prefill: Auto-fill from logged-in contractor's profile
   - "Using data from previous permit at this address" badge when applicable
4. Year built auto-populated from property appraiser
5. Basic scope questions (work type, size, stories for roofing)

**Technical Implementation:**
- Integrate `lookupPriorPermit()` from `useContractorProfile` hook
- Add `useEffect` to trigger lookup when address is selected
- Show "Previously submitted" badge with one-click prefill option
- Move owner info card from Step 2 to Step 1

---

### New Step 2: Materials & Requirements (Merged)

Combines rest of Step 2 + partial Step 3:

**Content:**
1. Trade-specific questions (RoofingQuestions, WindowDoorQuestions)
2. Multi-material selector with inline NOA search
3. Inline document requirements checklist:
   - Green checkmarks for auto-sourced NOAs from selected products
   - Red flags for missing required documents
   - Upload zone integrated (not separate step)
4. Section 1524 compliance checkboxes (auto-computed from year_built)
5. Real-time AI valuation estimation (new feature):
   - Shows "Estimated valuation: $X-$Y based on roof size and materials"
   - User can accept or override

**Technical Implementation:**
- Move `JurisdictionRulesPanel` with `showDocuments={true}` inline
- Move `SmartDocumentUploader` into this step
- Create `estimate-permit-valuation` edge function for AI valuation
- Auto-trigger packet generation when step completes (remove manual button)

---

### New Step 3: Review & Submit (Streamlined)

Consolidates Step 4:

**Content:**
1. Summary card (compact - address, owner, permit type)
2. Auto-generated packet viewer (no "Generate Packet" button - already generated)
3. Signature status tracker with inline signing capability
4. Service tier dropdown (simplified - no grid)
5. Payment agreement checkbox
6. Submit button with completeness check

**Technical Implementation:**
- Move packet generation trigger to Step 2 completion
- Show packet immediately on Step 3 load (no loading state in most cases)
- Streamline signature checklist display

---

## Technical Changes Required

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PermitQueensNewRequest.tsx` | Restructure to 3 steps, add prior permit lookup, add auto-generate |
| `src/components/permit-queens/WizardProgress.tsx` | Update step definitions from 4 to 3 |
| `src/hooks/useContractorProfile.ts` | Already has `lookupPriorPermit` - integrate into wizard |

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/estimate-permit-valuation/index.ts` | AI-powered valuation estimation |

---

## Detailed Implementation

### Phase 1: Prior Permit Auto-Fill Integration

**In `PermitQueensNewRequest.tsx`:**

```typescript
// Add state for prior permit data
const [priorPermit, setPriorPermit] = useState<PriorPermitData | null>(null);
const [showPriorPermitBanner, setShowPriorPermitBanner] = useState(false);

// Add effect to lookup prior permit when address changes
useEffect(() => {
  const lookupPrior = async () => {
    if (formData.property_address.length > 15) {
      const result = await lookupPriorPermit(formData.property_address);
      if (result) {
        setPriorPermit(result);
        setShowPriorPermitBanner(true);
      }
    }
  };
  lookupPrior();
}, [formData.property_address]);

// Add "Apply prior permit data" function
const applyPriorPermitData = () => {
  if (priorPermit) {
    setFormData(prev => ({
      ...prev,
      owner_name: priorPermit.owner_name || prev.owner_name,
      owner_email: priorPermit.owner_email || prev.owner_email,
      owner_phone: priorPermit.owner_phone || prev.owner_phone,
      valuation: priorPermit.valuation || prev.valuation,
    }));
    setShowPriorPermitBanner(false);
    toast.success('Applied data from previous permit');
  }
};
```

**UI Banner (in Step 1, after address):**
```tsx
{showPriorPermitBanner && priorPermit && (
  <Alert className="border-primary/30 bg-primary/5">
    <Sparkles className="h-4 w-4 text-primary" />
    <AlertDescription className="flex items-center justify-between">
      <span>
        <strong>Previous permit found!</strong> Owner: {priorPermit.owner_name} 
        • Valuation: ${priorPermit.valuation?.toLocaleString()}
      </span>
      <Button size="sm" onClick={applyPriorPermitData}>
        Use This Data
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### Phase 2: 3-Step Wizard Restructure

**Update WIZARD_STEPS constant:**

```typescript
const WIZARD_STEPS = [
  { number: 1, title: 'Property & Scope', description: 'Address, owner & project basics' },
  { number: 2, title: 'Materials & Docs', description: 'Products, requirements & uploads' },
  { number: 3, title: 'Review & Submit', description: 'Verify and submit request' },
];
```

**Step 1 Content (merged):**
- Keep address input with jurisdiction detection
- Keep permit type selection
- ADD owner info card (moved from current Step 2)
- ADD prior permit banner
- ADD basic scope questions for the selected trade (work type, size)

**Step 2 Content (merged):**
- Keep trade-specific questions (RoofingQuestions, etc.)
- Keep multi-material selector
- ADD inline document requirements checklist
- ADD smart document uploader (moved from current Step 3)
- REMOVE separate "Documents" step

**Step 3 Content (streamlined):**
- Keep review summary (condensed)
- Keep packet viewer (auto-generated)
- Keep signature checklist
- Keep service tier dropdown
- Keep payment checkbox
- Keep submit button

---

### Phase 3: Auto-Generate Packet on Step 2 Completion

**Add effect to trigger generation:**

```typescript
// Auto-generate packet when moving to Step 3
useEffect(() => {
  if (currentStep === 3 && !generatedPacket && !generatingPacket) {
    handleGeneratePacket();
  }
}, [currentStep]);
```

**Update canProceed logic:**

```typescript
const canProceed = () => {
  switch (currentStep) {
    case 1:
      return formData.property_address && formData.permit_type && formData.owner_name;
    case 2:
      return tradeQuestionsComplete;
    case 3:
      return formData.complexity_tier && paymentAgreed;
    default:
      return false;
  }
};
```

---

### Phase 4: AI Valuation Estimation Edge Function

**Create `supabase/functions/estimate-permit-valuation/index.ts`:**

Uses the selected materials, roof size, and jurisdiction to estimate project valuation based on:
- Roof size (squares) x average cost per square
- Material type multiplier (shingle vs tile vs metal)
- HVHZ complexity factor
- Jurisdiction fee schedules

**Returns:**
```json
{
  "estimated_low": 12000,
  "estimated_high": 18000,
  "recommended": 15000,
  "confidence": "medium",
  "factors": [
    "25 squares at $450-$600/square",
    "Shingle material (standard complexity)",
    "HVHZ zone (+10% for enhanced materials)"
  ]
}
```

**UI Integration:**
Below the valuation input field, show:
```tsx
{valuationEstimate && (
  <div className="flex items-center gap-2 text-sm">
    <Sparkles className="h-4 w-4 text-primary" />
    <span className="text-muted-foreground">
      AI Estimate: ${valuationEstimate.estimated_low.toLocaleString()} - 
      ${valuationEstimate.estimated_high.toLocaleString()}
    </span>
    <Button 
      variant="link" 
      size="sm" 
      onClick={() => handleFieldChange('valuation', valuationEstimate.recommended)}
    >
      Use ${valuationEstimate.recommended.toLocaleString()}
    </Button>
  </div>
)}
```

---

## UI/UX Improvements

### Progress Bar Enhancement

Update `WizardProgress.tsx` to show completion percentage:

```tsx
// Add completion percentage bar below step indicators
<div className="mt-4 relative h-2 bg-muted rounded-full overflow-hidden">
  <div 
    className="absolute h-full bg-primary transition-all duration-300 ease-out"
    style={{ width: `${completionPercentage}%` }}
  />
</div>
<p className="text-xs text-muted-foreground text-center mt-1">
  {completionPercentage}% complete
</p>
```

### Inline Validation

Add real-time field validation with visual feedback:
- Green checkmark appears when field is valid
- Red border + helper text for invalid fields
- Section completion badges

### Mobile Optimization

- Stacked cards on mobile (single column)
- Bottom-sheet style material selection
- Swipe gesture support for step navigation

---

## Implementation Phases

| Phase | Changes | Priority |
|-------|---------|----------|
| 1 | Prior permit lookup + auto-fill banner | High |
| 2 | Restructure to 3 steps (move content) | High |
| 3 | Auto-generate packet on Step 2 completion | High |
| 4 | AI valuation estimation edge function | Medium |
| 5 | Progress bar enhancement | Low |
| 6 | Mobile optimization | Low |

---

## Data Flow Diagram

```text
Step 1: Property & Scope
  ├── Address Input
  │   ├── Mapbox Geocoding (existing)
  │   ├── Jurisdiction Detection (existing)
  │   └── Prior Permit Lookup (NEW)
  │       └── Auto-suggest owner/valuation
  │
  ├── Owner Info
  │   ├── Prior permit prefill (NEW)
  │   └── Manual override
  │
  └── Basic Scope (work type, size)

Step 2: Materials & Requirements
  ├── Trade Questions
  │   └── RoofingQuestions / WindowDoorQuestions
  │
  ├── Material Selection
  │   └── MultiMaterialSelector with NOA lookup
  │
  ├── Document Requirements (inline)
  │   ├── Auto-sourced NOAs (green)
  │   └── Missing uploads (red)
  │
  └── Smart Uploader (moved from Step 3)
      
  [ON STEP COMPLETE → Auto-trigger packet generation]

Step 3: Review & Submit
  ├── Generated Packet (auto-loaded)
  ├── Signature Checklist
  ├── Service Tier Selection
  ├── Payment Agreement
  └── Submit
```

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Steps to complete | 4 | 3 |
| Manual data entry | High | Reduced 40-50% via prefill |
| Packet generation | Manual button | Automatic |
| Valuation entry | Guesswork | AI-suggested |
| Prior permit reuse | None | One-click apply |
| Time to complete | ~10 min | ~5-7 min |

---

## Database Changes

**None required** - all features use existing tables:
- `permit_projects` for prior permit lookup
- `contractor_profiles` for contractor data
- `product_approvals` for NOA matching

---

## Security Considerations

- Prior permit lookup restricted to user's own permits via RLS
- Valuation estimation uses sanitized inputs
- No sensitive data exposed in AI responses
- Rate limiting on estimation edge function
