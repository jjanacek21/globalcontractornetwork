
# Implementation Plan: Remaining Phases for Enhanced Permit Expediting System

## Overview

Based on the approved plan, most components have been implemented. Here's what remains to complete the system:

## Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| JSON Parsing Fix (Phase 1-3) | **Complete** | `max_tokens` increased to 16000, `extractArrayItems()` helper added, quality scoring updated |
| SmartDocumentManager | **Complete** | Organized by building department with trade tabs |
| DocumentUploadZone | **Complete** | Drag-drop with AI analysis trigger |
| PropertyDataEnrichment | **Complete** | Batch year_built lookup from property appraiser |
| BatchProductSourcing Quick-Start | **Complete** | Underlayment/Shingle quick buttons added |
| AITrainingCenter Tabs | **Complete** | Smart Docs and Property Data tabs integrated |

## Remaining Work to Implement

### Phase 1: Auto-Populate year_built During Permit Creation

Currently, `year_built` is only populated through manual admin enrichment. We should auto-trigger the property appraiser lookup when a user enters an address during permit creation.

**Changes Required:**

1. **Modify `PermitAddressInput.tsx`** (or equivalent address input component)
   - After successful geocoding/jurisdiction detection, trigger property appraiser lookup in background
   - Store result in component state to pass to `RoofingQuestions`

2. **Modify `RoofingQuestions.tsx`**
   - Accept optional `suggestedYearBuilt` prop from parent
   - Auto-populate `yearBuilt` field when property data is received
   - Show "auto-detected" indicator with option to override

3. **Create `usePropertyLookup` hook**
   - Encapsulates the property appraiser lookup logic
   - Returns loading state, result, and error handling
   - Debounces lookups to avoid excessive API calls

### Phase 2: Enhanced Address-to-Folio Resolution

The property appraiser lookup currently requires a folio/PCN for reliable results. We need to add address-to-folio resolution for each county.

**Changes to `property-appraiser-lookup` edge function:**

```typescript
// Add address search capability per county
const addressSearchUrls: Record<string, (address: string) => string> = {
  palm_beach: (addr) => `https://www.pbcgov.org/papa/Asps/Search/Search.aspx?q=${encodeURIComponent(addr)}`,
  broward: (addr) => `https://www.bcpa.net/Property_Search.asp?q=${encodeURIComponent(addr)}`,
  miami_dade: (addr) => `https://www.miamidade.gov/pa/property_search.asp?address=${encodeURIComponent(addr)}`,
};
```

- Scrape search results page to extract folio
- Then use existing folio-based lookup
- Cache address-to-folio mappings

### Phase 3: Enhanced Section 1524 Compliance UI

Add visual compliance checklist to `RoofingQuestions.tsx` that dynamically updates based on `year_built`:

```typescript
// Add to RoofingQuestions.tsx
const section1524Requirements = useMemo(() => {
  const reqs = [];
  if (formData.yearBuilt && formData.yearBuilt < 1994) {
    reqs.push({
      id: 'deck_renailing',
      label: 'Deck Renailing Required',
      description: 'FBC 1524.3 - Pre-1994 wood deck must be renailed with 8d ring-shank nails',
      required: true,
      checked: formData.deckAttachmentConfirmed
    });
  }
  // ... additional requirements based on conditions
  return reqs;
}, [formData.yearBuilt, formData.deckAttachmentConfirmed, isHVHZ]);
```

### Phase 4: Property Cache Table

Create a database table to cache property appraiser results and avoid redundant lookups:

```sql
CREATE TABLE IF NOT EXISTS property_cache (
  folio TEXT NOT NULL,
  county TEXT NOT NULL,
  property_data JSONB NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (folio, county)
);

CREATE INDEX idx_property_cache_address ON property_cache 
  USING gin ((property_data->>'address') gin_trgm_ops);
```

## Implementation Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Create `property_cache` table | 5 min | Required for Phase 2 |
| 2 | Create `usePropertyLookup` hook | 30 min | Reusable component |
| 3 | Update `property-appraiser-lookup` for address search | 45 min | Enables auto-lookup |
| 4 | Integrate auto-lookup in permit wizard | 30 min | Main user benefit |
| 5 | Enhanced Section 1524 compliance UI | 20 min | Visual improvement |

## Technical Details

### New Hook: `usePropertyLookup.ts`

```typescript
interface PropertyLookupResult {
  yearBuilt: number | null;
  ownerName: string | null;
  legalDescription: string | null;
  isHVHZ: boolean;
  loading: boolean;
  error: string | null;
}

export function usePropertyLookup(
  address: string | null,
  county: string | null
): PropertyLookupResult {
  const [result, setResult] = useState<PropertyLookupResult>({
    yearBuilt: null,
    ownerName: null,
    legalDescription: null,
    isHVHZ: false,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!address || !county) return;

    const lookup = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const { data, error } = await supabase.functions.invoke(
          'property-appraiser-lookup',
          { body: { address, county } }
        );
        
        if (error) throw error;
        
        if (data?.success && data?.data) {
          setResult({
            yearBuilt: data.data.yearBuilt,
            ownerName: data.data.ownerName,
            legalDescription: data.data.legalDescription,
            isHVHZ: data.data.isHVHZ || false,
            loading: false,
            error: null
          });
        } else {
          setResult(prev => ({ 
            ...prev, 
            loading: false, 
            error: data?.message || 'Lookup failed' 
          }));
        }
      } catch (err) {
        setResult(prev => ({ 
          ...prev, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        }));
      }
    };

    // Debounce the lookup
    const timer = setTimeout(lookup, 1000);
    return () => clearTimeout(timer);
  }, [address, county]);

  return result;
}
```

### Integration in PermitQueensNewRequest

```typescript
// In the permit wizard component
const { yearBuilt, ownerName, isHVHZ, loading: propertyLoading } = usePropertyLookup(
  formData.property_address,
  formData.jurisdiction_county
);

// Pass to RoofingQuestions
<RoofingQuestions
  isHVHZ={isHVHZ || formData.is_hvhz}
  formData={roofingData}
  suggestedYearBuilt={yearBuilt}
  suggestedOwnerName={ownerName}
  propertyLoading={propertyLoading}
  onChange={setRoofingData}
  onComplete={setRoofingComplete}
/>
```

### RoofingQuestions Props Update

```typescript
interface RoofingQuestionsProps {
  isHVHZ: boolean;
  formData: RoofingFormData;
  suggestedYearBuilt?: number | null;  // NEW
  suggestedOwnerName?: string | null;  // NEW
  propertyLoading?: boolean;           // NEW
  onChange: (data: RoofingFormData) => void;
  onComplete: (isComplete: boolean) => void;
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePropertyLookup.ts` | Reusable hook for property data lookup |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/property-appraiser-lookup/index.ts` | Add address-to-folio search, cache integration |
| `src/components/permit-queens/RoofingQuestions.tsx` | Accept `suggestedYearBuilt` prop, auto-populate, enhanced Section 1524 UI |
| `src/pages/PermitQueensNewRequest.tsx` | Integrate `usePropertyLookup` hook, pass data to trade questions |

## Database Migration

```sql
-- Create property cache table
CREATE TABLE IF NOT EXISTS property_cache (
  folio TEXT NOT NULL,
  county TEXT NOT NULL,
  property_data JSONB NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (folio, county)
);

-- Index for address-based lookups
CREATE INDEX idx_property_cache_address 
  ON property_cache USING gin ((property_data->>'address') gin_trgm_ops);

-- Enable RLS
ALTER TABLE property_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to property cache" 
  ON property_cache FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to manage cache" 
  ON property_cache FOR ALL 
  TO service_role 
  USING (true);
```

## Expected Outcomes

After implementation:
1. When a user enters an address during permit creation, `year_built` is auto-detected
2. Section 1524 compliance requirements are dynamically shown based on property age
3. Property appraiser data is cached, reducing redundant API calls
4. Pre-1994 homes automatically trigger deck renailing checkbox
5. Admin enrichment tool becomes a fallback for failed auto-lookups
