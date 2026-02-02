import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Pitch multipliers (matches roofMeasurements.ts)
const PITCH_MULTIPLIERS: Record<string, number> = {
  flat: 1.00,
  low: 1.05,
  standard: 1.12,
  steep: 1.20,
  verysteep: 1.30
};

// Waste percentages by complexity
const WASTE_PCTS: Record<string, number> = {
  simple: 0.05,
  gable: 0.10,
  hip: 0.12,
  complex: 0.15,
  verycomplex: 0.17
};

// Package pricing (from packagePricing.ts)
const PACKAGES = {
  shingle: {
    good: {
      id: 'bronze',
      name: 'Bronze',
      priceLow: 575,
      priceHigh: 650,
      features: [
        'Architectural Shingles',
        'Synthetic Underlayment',
        'Ridge Vent System',
        'Full Tear-Off & Disposal',
        'Permit Handling',
        '5-Year Workmanship Warranty'
      ],
      warranty: '5-year workmanship, 20-25 year materials',
      color: '#CD7F32'
    },
    better: {
      id: 'silver',
      name: 'Silver',
      priceLow: 700,
      priceHigh: 725,
      features: [
        'Premium Architectural Shingles',
        'Peel-and-Stick Underlayment',
        'Ice & Water Shield',
        'Ridge Vents + Extra Vents',
        'Full Tear-Off & Disposal',
        '10-Year Workmanship Warranty'
      ],
      warranty: '10-year workmanship, 25-30 year materials',
      color: '#C0C0C0',
      isPopular: true
    },
    best: {
      id: 'gold',
      name: 'Gold',
      priceLow: 800,
      priceHigh: 850,
      features: [
        'Premium Shingles + Enhanced Durability',
        'High-Temp Peel-and-Stick',
        'Solar Attic Fan',
        '6-Inch Seamless Gutters',
        'Ice & Water at All Penetrations',
        'Lifetime Workmanship Warranty'
      ],
      warranty: 'Lifetime workmanship, 30-40 year materials',
      color: '#FFD700',
      isPopular: true
    }
  },
  metal: {
    good: {
      id: 'blue-collar',
      name: 'Blue Collar',
      priceLow: 860,
      priceHigh: 860,
      features: [
        '5V Crimp Metal Roof (Mill Finish)',
        'Polyglass Synthetic Underlayment',
        'Standard Ridge Vents',
        'Code-Compliant Edge Metal',
        'Full Tear-Off & Disposal',
        '10-Year Workmanship Warranty'
      ],
      warranty: '10-year workmanship, 30-40 year materials',
      color: '#4A90D9'
    },
    better: {
      id: 'blue-collar-plus',
      name: 'Blue Collar+',
      priceLow: 930,
      priceHigh: 930,
      features: [
        '5V Crimp Metal (Kynar-Coated)',
        'High-Temperature Underlayment',
        'Solar-Powered Ventilation',
        'Premium Edge Metal',
        'Full Tear-Off & Disposal',
        'Lifetime Workmanship Warranty'
      ],
      warranty: 'Lifetime workmanship, 40-50 year materials',
      color: '#2E5A8C'
    },
    best: {
      id: 'platinum',
      name: 'Platinum',
      priceLow: 1100,
      priceHigh: 1300,
      features: [
        '24-Gauge Standing Seam Metal',
        'Polyglass MTS High-Temp Underlayment',
        'Solar Attic Fan Ventilation',
        '150 MPH Wind Rating',
        'Ice & Water Protection',
        'Lifetime Warranty'
      ],
      warranty: 'Lifetime workmanship and materials',
      color: '#E5E4E2',
      isPopular: true
    }
  },
  tile: {
    good: {
      id: 'tile',
      name: 'Tile',
      priceLow: 900,
      priceHigh: 1000,
      features: [
        'Complete Tile Removal & Replacement',
        'Standard Tile Underlayment',
        'Matched Accessories',
        'Basic Ventilation Upgrade',
        'Full Tear-Off & Disposal',
        '10-Year Workmanship Warranty'
      ],
      warranty: '10-year workmanship, 30-40 year materials',
      color: '#C45C26'
    },
    better: {
      id: 'tile-plus',
      name: 'Tile+',
      priceLow: 1100,
      priceHigh: 1300,
      features: [
        'Premium Tile (Concrete or Clay)',
        'Polyglass TU MAX Underlayment',
        'Glued & Screwed Installation',
        'Upgraded Ventilation',
        'Fascia Repair & Paint',
        'Extended Warranty'
      ],
      warranty: 'Lifetime workmanship, 40-50 year materials',
      color: '#8B4513'
    },
    best: {
      id: 'ultimate',
      name: 'Ultimate',
      priceLow: 1360,
      priceHigh: 1850,
      features: [
        'Premium Standing Seam or Stone-Coated Steel',
        'Fire-Rated Underlayment',
        'Solar-Powered Ventilation',
        '180+ MPH Wind Rating',
        'Solar Panel Preparation',
        'Lifetime Comprehensive Warranty'
      ],
      warranty: 'Lifetime comprehensive warranty',
      color: '#1C1C1C'
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      latitude, 
      longitude, 
      address, 
      pitchBucket = 'standard', 
      complexity = 'gable', 
      roofCategory = 'shingle',
      zoomLevel = 19 
    } = await req.json();

    console.log(`[instant-roof-estimate] Processing: ${address} at ${latitude}, ${longitude}`);
    console.log(`[instant-roof-estimate] Params: pitch=${pitchBucket}, complexity=${complexity}, category=${roofCategory}`);

    // Get satellite measurement from roof-vision-ai
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    let baseSqFt = 2500; // Default fallback
    let confidence = 'medium';
    let roofShape = 'Unknown';
    let roofColor = '';
    let satelliteImageUrl = '';

    try {
      const visionResponse = await fetch(`${supabaseUrl}/functions/v1/roof-vision-ai`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ 
          latitude, 
          longitude, 
          address, 
          zoomLevel,
          serviceType: 'reroof'
        }),
      });

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        console.log('[instant-roof-estimate] Vision response:', JSON.stringify(visionData).slice(0, 500));
        
        if (visionData.estimation) {
          baseSqFt = visionData.estimation.estimatedSqft || baseSqFt;
          confidence = visionData.estimation.confidence || confidence;
          roofShape = visionData.estimation.roofShape || roofShape;
          roofColor = visionData.estimation.primaryRoofColor || '';
          satelliteImageUrl = visionData.estimation.satelliteImageUrl || '';
        }
      } else {
        console.warn('[instant-roof-estimate] Vision AI call failed, using default values');
      }
    } catch (visionError) {
      console.error('[instant-roof-estimate] Vision AI error:', visionError);
    }

    // Apply pitch and waste calculations
    const pitchMultiplier = PITCH_MULTIPLIERS[pitchBucket] || PITCH_MULTIPLIERS.standard;
    const wastePct = WASTE_PCTS[complexity] || WASTE_PCTS.gable;
    
    const trueSqft = Math.round(baseSqFt * pitchMultiplier);
    const totalWithWaste = Math.round(trueSqft * (1 + wastePct));
    const squares = Math.round((totalWithWaste / 100) * 10) / 10; // Round to 1 decimal

    console.log(`[instant-roof-estimate] Calculations: base=${baseSqFt}, pitch=${pitchMultiplier}, waste=${wastePct}, squares=${squares}`);

    // Get packages for the category
    const category = roofCategory as keyof typeof PACKAGES;
    const packages = PACKAGES[category] || PACKAGES.shingle;

    // Calculate pricing for each tier
    const calculateTierPricing = (pkg: typeof packages.good) => ({
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerSquare: { low: pkg.priceLow, high: pkg.priceHigh },
      totalLow: Math.round(pkg.priceLow * squares),
      totalHigh: Math.round(pkg.priceHigh * squares),
      features: pkg.features,
      warranty: pkg.warranty,
      color: pkg.color,
      isPopular: (pkg as any).isPopular || false
    });

    const response = {
      success: true,
      measurement: {
        baseSqFt,
        pitchMultiplier,
        trueSqft,
        wastePct,
        totalWithWaste,
        squares,
        confidence,
        roofShape,
        roofColor,
        satelliteImageUrl,
        pitchBucket,
        complexity
      },
      pricing: {
        good: calculateTierPricing(packages.good),
        better: calculateTierPricing(packages.better),
        best: calculateTierPricing(packages.best),
      },
      category: roofCategory
    };

    console.log('[instant-roof-estimate] Success:', JSON.stringify(response).slice(0, 500));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[instant-roof-estimate] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
