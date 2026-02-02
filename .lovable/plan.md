
# Instant Roof Measurement Edge Function for Door to Door

## Summary

Create a new edge function `instant-roof-estimate` that combines satellite roof measurement with Good/Better/Best pricing calculations. This function will be integrated into the Door to Door property side panel, allowing canvassers to instantly get measurements and price ranges for any property they visit. The user experience will be:

1. Click property on map → Side panel opens
2. Click "Get Instant Quote" → AI analyzes satellite image
3. User selects roof pitch (from visual selector) and complexity (for waste calculation)
4. System displays Good/Better/Best pricing options

---

## Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          Door to Door Map                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Property Side Panel                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐│ │
│  │  │  [Status] [Details] [Photos] [Notes] [Quote] ← NEW TAB         ││ │
│  │  └─────────────────────────────────────────────────────────────────┘│ │
│  │                                                                      │ │
│  │  Quote Tab Contents:                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐│ │
│  │  │  [ Get Instant Measurement ]  ← Calls Edge Function            ││ │
│  │  │                                                                  ││ │
│  │  │  Satellite Preview         Measurement Results                  ││ │
│  │  │  ┌────────────────┐       Base: 2,400 sq ft                    ││ │
│  │  │  │   🛰️ Image     │       With Pitch: 2,688 sq ft              ││ │
│  │  │  │                │       With Waste: 2,957 sq ft               ││ │
│  │  │  └────────────────┘       ≈ 29.6 Squares                       ││ │
│  │  │                                                                  ││ │
│  │  │  [ Pitch Selector ]  Flat | Low | Standard | Steep | Very Steep ││ │
│  │  │                                                                  ││ │
│  │  │  [ Complexity Selector ]  Gable | Hip | 10+ | 20+ Facets       ││ │
│  │  │                                                                  ││ │
│  │  │  ┌────────────────────────────────────────────────────────────┐││ │
│  │  │  │               Good/Better/Best Cards                        │││ │
│  │  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │││ │
│  │  │  │  │ BRONZE  │  │  GOLD   │  │PLATINUM │                    │││ │
│  │  │  │  │ $17,000 │  │ $24,000 │  │ $35,000 │                    │││ │
│  │  │  │  │ -18,900 │  │ -25,400 │  │ -38,500 │                    │││ │
│  │  │  │  │         │  │⭐Popular│  │         │                    │││ │
│  │  │  │  │[Select] │  │[Select] │  │[Select] │                    │││ │
│  │  │  │  └─────────┘  └─────────┘  └─────────┘                    │││ │
│  │  │  └────────────────────────────────────────────────────────────┘││ │
│  │  │                                                                  ││ │
│  │  │  [ Create Proposal PDF ]                                        ││ │
│  │  └─────────────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. New Edge Function: `instant-roof-estimate`

**File**: `supabase/functions/instant-roof-estimate/index.ts`

This edge function combines:
- Satellite roof measurement from `roof-vision-ai`
- Pitch/complexity-adjusted calculations from `roofMeasurements.ts`
- Good/Better/Best pricing from `packagePricing.ts`

### Request Format
```typescript
interface InstantEstimateRequest {
  latitude: number;
  longitude: number;
  address: string;
  pitchBucket?: 'flat' | 'low' | 'standard' | 'steep' | 'verysteep';
  complexity?: 'gable' | 'hip' | 'complex' | 'verycomplex';
  roofCategory?: 'shingle' | 'metal' | 'tile';
  zoomLevel?: number;
}
```

### Response Format
```typescript
interface InstantEstimateResponse {
  success: boolean;
  measurement: {
    baseSqFt: number;           // Flat satellite footprint
    pitchMultiplier: number;    // Based on pitch selection
    trueSqft: number;           // baseSqFt × pitchMultiplier
    wastePct: number;           // Based on complexity
    totalWithWaste: number;     // trueSqft × (1 + wastePct)
    squares: number;            // totalWithWaste / 100
    confidence: 'high' | 'medium' | 'low';
    roofShape: string;
    roofColor?: string;
    estimatedAgeYears?: number;
    satelliteImageUrl: string;
  };
  pricing: {
    good: {
      packageId: string;
      packageName: string;
      pricePerSquare: { low: number; high: number };
      totalLow: number;
      totalHigh: number;
      features: string[];
      warranty: string;
    };
    better: { /* same structure */ };
    best: { /* same structure */ };
  };
}
```

### Implementation Logic
```typescript
// 1. Call roof-vision-ai for base satellite measurement
const visionData = await fetch(supabaseUrl + '/functions/v1/roof-vision-ai', {
  body: JSON.stringify({ latitude, longitude, address, zoomLevel })
});

// 2. Apply pitch multiplier (from user selection or default 'standard')
const pitchMultipliers = {
  flat: 1.00, low: 1.05, standard: 1.12, steep: 1.20, verysteep: 1.30
};

// 3. Apply waste percentage based on complexity
const wastePcts = { 
  gable: 0.10, hip: 0.12, complex: 0.15, verycomplex: 0.17 
};

// 4. Calculate squares
const trueSqft = baseSqFt * pitchMultiplier;
const totalWithWaste = trueSqft * (1 + wastePct);
const squares = totalWithWaste / 100;

// 5. Get Good/Better/Best packages based on category
const packages = getGoodBetterBest(roofCategory);

// 6. Calculate pricing for each tier
pricing.good = {
  packageId: packages.good.id,
  packageName: packages.good.name,
  totalLow: packages.good.priceLow * squares,
  totalHigh: packages.good.priceHigh * squares,
  ...
};
```

---

## 2. New Component: `PropertyQuoteTab`

**File**: `src/components/door-to-door/PropertyQuoteTab.tsx`

A new tab for the PropertySidePanel that provides instant quote functionality.

### Features
- "Get Instant Measurement" button triggers edge function call
- Satellite image preview from Mapbox
- Pitch selector using existing `PitchSelector` component
- Complexity selector using existing `ComplexitySelector` component
- Real-time recalculation when pitch/complexity changes
- Good/Better/Best pricing cards with select buttons
- "Create Proposal" button for PDF generation

### Component Structure
```tsx
export function PropertyQuoteTab({
  propertyId,
  lat,
  lng,
  address,
  onPackageSelect,
}: PropertyQuoteTabProps) {
  const [measurement, setMeasurement] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pitch, setPitch] = useState('standard');
  const [complexity, setComplexity] = useState('gable');
  const [roofCategory, setRoofCategory] = useState('shingle');

  const getInstantEstimate = async () => {
    const { data } = await supabase.functions.invoke('instant-roof-estimate', {
      body: { latitude: lat, longitude: lng, address, pitchBucket: pitch, complexity }
    });
    setMeasurement(data.measurement);
    setPricing(data.pricing);
  };

  // When pitch/complexity changes, recalculate locally
  useEffect(() => {
    if (measurement) {
      recalculatePricing(measurement.baseSqFt, pitch, complexity, roofCategory);
    }
  }, [pitch, complexity, roofCategory]);

  return (
    <div className="space-y-4">
      {!measurement ? (
        <Button onClick={getInstantEstimate} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Zap />}
          Get Instant Measurement
        </Button>
      ) : (
        <>
          <MeasurementSummary measurement={measurement} />
          <PitchSelector value={pitch} onChange={setPitch} />
          <ComplexitySelector value={complexity} onChange={setComplexity} />
          <RoofCategoryTabs value={roofCategory} onChange={setRoofCategory} />
          <GoodBetterBestCards pricing={pricing} onSelect={onPackageSelect} />
        </>
      )}
    </div>
  );
}
```

---

## 3. Update PropertySidePanel

**File**: `src/components/door-to-door/PropertySidePanel.tsx`

Add a new "Quote" tab alongside existing tabs (Status, Details, Photos, Notes).

### Changes
```typescript
// Add new import
import { PropertyQuoteTab } from './PropertyQuoteTab';
import { FileText, DollarSign } from 'lucide-react';

// Add Quote tab to TabsList
<TabsTrigger value="quote">
  <DollarSign className="w-4 h-4 mr-1" />
  Quote
</TabsTrigger>

// Add Quote tab content
<TabsContent value="quote" className="m-0 p-4">
  <PropertyQuoteTab
    propertyId={property.id}
    lat={property.lat}
    lng={property.lng}
    address={property.address}
    onPackageSelect={(pkg) => {
      // Save selected package to property disposition
      // Navigate to proposal creation
    }}
  />
</TabsContent>
```

---

## 4. Good/Better/Best Pricing Cards Component

**File**: `src/components/door-to-door/GoodBetterBestCards.tsx`

Displays the three pricing tiers in a visually appealing card layout.

### Design
- Three cards side by side (responsive: stack on mobile)
- Each card shows: Package name, price range, key features, warranty
- "Better" card highlighted with "Popular" badge
- Select button on each card

```tsx
export function GoodBetterBestCards({
  pricing,
  squares,
  onSelect
}: GoodBetterBestCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Good Card */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <Badge className="w-fit bg-amber-500">Good</Badge>
          <CardTitle>{pricing.good.packageName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${formatNumber(pricing.good.totalLow)} - ${formatNumber(pricing.good.totalHigh)}
          </div>
          <p className="text-sm text-muted-foreground">
            ${pricing.good.pricePerSquare.low}-${pricing.good.pricePerSquare.high}/sq
          </p>
          <ul className="mt-4 space-y-2">
            {pricing.good.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            {pricing.good.warranty}
          </p>
          <Button className="w-full mt-4" onClick={() => onSelect(pricing.good)}>
            Select Bronze
          </Button>
        </CardContent>
      </Card>

      {/* Better Card - Popular */}
      <Card className="border-primary ring-2 ring-primary/20 bg-primary/5">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">Most Popular</Badge>
        </div>
        {/* Similar structure */}
      </Card>

      {/* Best Card */}
      <Card className="border-slate-300 bg-slate-50/50">
        {/* Similar structure */}
      </Card>
    </div>
  );
}
```

---

## 5. Database Updates

Store quote data in `property_dispositions` table.

### Add columns (migration)
```sql
ALTER TABLE property_dispositions ADD COLUMN IF NOT EXISTS
  measurement_data JSONB,          -- Store full measurement result
  selected_package_id TEXT,        -- bronze, silver, gold, etc.
  estimate_low INTEGER,            -- Dollar amount low
  estimate_high INTEGER,           -- Dollar amount high
  quote_created_at TIMESTAMPTZ;    -- When quote was generated
```

---

## 6. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/instant-roof-estimate/index.ts` | **Create** | New edge function combining measurement + pricing |
| `supabase/config.toml` | Modify | Add function config |
| `src/components/door-to-door/PropertyQuoteTab.tsx` | **Create** | Quote tab component with measurement + pricing UI |
| `src/components/door-to-door/GoodBetterBestCards.tsx` | **Create** | Pricing cards component |
| `src/components/door-to-door/PropertySidePanel.tsx` | Modify | Add Quote tab |
| Database migration | Create | Add quote-related columns |

---

## 7. Edge Function Implementation Details

### Complete Edge Function Code Pattern
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pitch multipliers (same as roofMeasurements.ts)
const PITCH_MULTIPLIERS = {
  flat: 1.00, low: 1.05, standard: 1.12, steep: 1.20, verysteep: 1.30
};

// Waste percentages by complexity
const WASTE_PCTS = {
  gable: 0.10, hip: 0.12, complex: 0.15, verycomplex: 0.17
};

// Package pricing (from packagePricing.ts)
const PACKAGES = {
  shingle: {
    good: { id: 'bronze', name: 'Bronze', priceLow: 575, priceHigh: 650, ... },
    better: { id: 'gold', name: 'Gold', priceLow: 800, priceHigh: 850, ... },
    best: { id: 'platinum', name: 'Platinum', priceLow: 1100, priceHigh: 1300, ... },
  },
  metal: { ... },
  tile: { ... },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, address, pitchBucket, complexity, roofCategory, zoomLevel } 
      = await req.json();

    // 1. Get satellite measurement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const visionResponse = await fetch(`${supabaseUrl}/functions/v1/roof-vision-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, address, zoomLevel: zoomLevel || 19 }),
    });

    const visionData = await visionResponse.json();
    const baseSqFt = visionData.estimation?.estimatedSqft || 2500;

    // 2. Apply pitch and waste calculations
    const pitchMultiplier = PITCH_MULTIPLIERS[pitchBucket] || PITCH_MULTIPLIERS.standard;
    const wastePct = WASTE_PCTS[complexity] || WASTE_PCTS.gable;
    const trueSqft = Math.round(baseSqFt * pitchMultiplier);
    const totalWithWaste = Math.round(trueSqft * (1 + wastePct));
    const squares = totalWithWaste / 100;

    // 3. Get packages and calculate pricing
    const category = roofCategory || 'shingle';
    const packages = PACKAGES[category];
    
    const calculateTierPricing = (pkg) => ({
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerSquare: { low: pkg.priceLow, high: pkg.priceHigh },
      totalLow: Math.round(pkg.priceLow * squares),
      totalHigh: Math.round(pkg.priceHigh * squares),
      features: pkg.features || [],
      warranty: pkg.warranty || '',
    });

    return new Response(JSON.stringify({
      success: true,
      measurement: {
        baseSqFt,
        pitchMultiplier,
        trueSqft,
        wastePct,
        totalWithWaste,
        squares,
        confidence: visionData.estimation?.confidence || 'medium',
        roofShape: visionData.estimation?.roofShape,
        roofColor: visionData.estimation?.primaryRoofColor,
        satelliteImageUrl: visionData.estimation?.satelliteImageUrl,
      },
      pricing: {
        good: calculateTierPricing(packages.good),
        better: calculateTierPricing(packages.better),
        best: calculateTierPricing(packages.best),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in instant-roof-estimate:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Expected Outcome

After implementation:
1. Door to Door canvassers can click any property and get an instant satellite-based measurement
2. Users select pitch (visual picker) and complexity (waste calculation) 
3. System displays Good/Better/Best pricing with calculated totals
4. Canvassers can select a package and create a proposal PDF on the spot
5. Quote data is saved to the property for follow-up

This dramatically speeds up the canvassing workflow by providing instant, professional estimates without leaving the app.
