const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AttomRequest {
  address1: string; // street address e.g. "123 Main St"
  address2: string; // city, state zip e.g. "Hollywood, FL 33021"
}

async function attomFetch(endpoint: string, params: AttomRequest, apiKey: string) {
  const url = new URL(`${ATTOM_BASE}${endpoint}`);
  url.searchParams.set('address1', params.address1);
  url.searchParams.set('address2', params.address2);

  const res = await fetch(url.toString(), {
    headers: { 'apikey': apiKey, 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`ATTOM ${endpoint} failed [${res.status}]:`, body);
    return null;
  }
  return await res.json();
}

function parseAddress(fullAddress: string): AttomRequest | null {
  // Expected formats:
  // "123 Main St, Hollywood, FL 33021"
  // "123 Main St, Hollywood, Florida 33021, United States"
  const cleaned = fullAddress.replace(/, United States$/i, '').trim();
  const firstComma = cleaned.indexOf(',');
  if (firstComma < 0) return null;

  const address1 = cleaned.substring(0, firstComma).trim();
  const address2 = cleaned.substring(firstComma + 1).trim();
  return { address1, address2 };
}

function calculateRoofScore(yearBuilt: number | null, buildingSqft: number | null): number {
  if (!yearBuilt) return 50;
  const age = new Date().getFullYear() - yearBuilt;
  let score = Math.min(100, Math.max(0, age * 4)); // older = higher need
  if (buildingSqft && buildingSqft > 3000) score = Math.min(100, score + 10);
  return score;
}

function calculateRenovationScore(yearBuilt: number | null, assessedValue: number | null, estimatedValue: number | null): number {
  if (!yearBuilt) return 50;
  const age = new Date().getFullYear() - yearBuilt;
  let score = Math.min(100, Math.max(0, age * 2.5));
  if (assessedValue && estimatedValue && estimatedValue > assessedValue * 1.3) {
    score = Math.min(100, score + 15);
  }
  return Math.round(score);
}

function calculateInvestmentScore(estimatedValue: number | null, assessedValue: number | null): number {
  if (!estimatedValue || !assessedValue) return 50;
  const ratio = estimatedValue / assessedValue;
  if (ratio > 1.5) return 85;
  if (ratio > 1.2) return 70;
  if (ratio > 1.0) return 55;
  return 40;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATTOM_API_KEY = Deno.env.get('ATTOM_API_KEY');
    if (!ATTOM_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'ATTOM_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { address } = await req.json();
    if (!address || typeof address !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const parsed = parseAddress(address);
    if (!parsed) {
      return new Response(JSON.stringify({ success: false, error: 'Could not parse address. Use format: Street, City, State Zip' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('ATTOM lookup:', parsed);

    // Fetch all three endpoints in parallel
    const [propertyData, assessmentData, saleData] = await Promise.all([
      attomFetch('/property/detail', parsed, ATTOM_API_KEY),
      attomFetch('/assessment/detail', parsed, ATTOM_API_KEY),
      attomFetch('/sale/detail', parsed, ATTOM_API_KEY),
    ]);

    if (!propertyData?.property?.[0]) {
      return new Response(JSON.stringify({ success: false, error: 'No property found at this address in ATTOM' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prop = propertyData.property[0];
    const assessment = assessmentData?.property?.[0]?.assessment || {};
    const saleHistory = saleData?.property || [];

    // Extract data from ATTOM response
    const lot = prop.lot || {};
    const building = prop.building || {};
    const summary = building.summary || {};
    const rooms = building.rooms || {};
    const location = prop.location || {};
    const addr = prop.address || {};
    const owner = prop.assessment?.owner || assessment?.owner || {};

    const yearBuilt = summary.yearBuilt ? parseInt(summary.yearBuilt) : null;
    const buildingSqft = summary.livingSize ? parseInt(summary.livingSize) : (summary.grossSize ? parseInt(summary.grossSize) : null);
    const lotSqft = lot.lotSize1 ? parseInt(lot.lotSize1) : null;
    const stories = summary.storyCount ? parseFloat(summary.storyCount) : null;
    const assessedVal = assessment?.assessed?.assdTtlValue ? parseFloat(assessment.assessed.assdTtlValue) : null;
    const marketVal = assessment?.market?.mktTtlValue ? parseFloat(assessment.market.mktTtlValue) : null;
    const latitude = location.latitude ? parseFloat(location.latitude) : null;
    const longitude = location.longitude ? parseFloat(location.longitude) : null;

    // Determine city/state/zip from ATTOM
    const city = addr.locality || addr.city || location.locality || '';
    const state = addr.countrySubd || location.countrySubd || '';
    const zip = addr.postal1 || '';
    const streetAddress = addr.line1 || addr.oneLine || parsed.address1;
    const propertyType = prop.summary?.propType || prop.summary?.propSubType || null;
    const parcelId = prop.identifier?.apn || null;

    // Check if property already exists
    const { data: existing } = await supabase
      .from('piq_properties')
      .select('id')
      .ilike('address', `%${parsed.address1}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, propertyId: existing.id, source: 'existing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert property
    const { data: newProp, error: propError } = await supabase
      .from('piq_properties')
      .insert({
        address: streetAddress,
        city,
        state,
        zip,
        latitude,
        longitude,
        parcel_id: parcelId,
        property_type: propertyType,
        building_sqft: buildingSqft,
        lot_sqft: lotSqft,
        year_built: yearBuilt,
        stories: stories ? Math.round(stories) : null,
        construction_type: building.construction?.constructionType || null,
        estimated_value: marketVal,
        assessed_value: assessedVal,
        zoning: prop.lot?.siteZoningIdent || null,
        flood_zone: prop.lot?.floodZoneIdent || null,
      })
      .select('id')
      .single();

    if (propError) {
      console.error('Insert property error:', propError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save property data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const propertyId = newProp.id;

    // Insert owner if available
    const ownerName = owner.owner1?.last
      ? `${owner.owner1.first || ''} ${owner.owner1.last}`.trim()
      : (owner.corporateIndicator === 'Y' ? owner.absenteeOwnerStatus || 'Owner' : null);

    if (ownerName) {
      const { data: newOwner } = await supabase
        .from('piq_owners')
        .insert({
          name: ownerName,
          owner_type: owner.corporateIndicator === 'Y' ? 'Corporate' : 'Individual',
          mailing_address: addr.line2 ? `${addr.line1}, ${addr.line2}` : null,
        })
        .select('id')
        .single();

      if (newOwner) {
        await supabase.from('piq_property_ownership').insert({
          property_id: propertyId,
          owner_id: newOwner.id,
          is_current: true,
        });
      }
    }

    // Insert scores
    const roofScore = calculateRoofScore(yearBuilt, buildingSqft);
    const renovationScore = calculateRenovationScore(yearBuilt, assessedVal, marketVal);
    const investmentScore = calculateInvestmentScore(marketVal, assessedVal);

    await supabase.from('piq_property_scores').insert({
      property_id: propertyId,
      roof_replacement_score: roofScore,
      renovation_score: renovationScore,
      investment_score: investmentScore,
      overall_contractor_score: Math.round((roofScore + renovationScore + investmentScore) / 3),
    });

    // Insert sale history
    for (const saleProp of saleHistory) {
      const sale = saleProp.sale || {};
      const amount = sale.amount || {};
      if (amount.saleAmt || sale.saleTransDate) {
        await supabase.from('piq_property_sales').insert({
          property_id: propertyId,
          sale_date: sale.saleTransDate || null,
          sale_price: amount.saleAmt ? parseFloat(amount.saleAmt) : null,
          buyer: sale.buyer1?.last ? `${sale.buyer1.first || ''} ${sale.buyer1.last}`.trim() : null,
          seller: sale.seller1?.last ? `${sale.seller1.first || ''} ${sale.seller1.last}`.trim() : null,
          lender: sale.mortgage?.lender || null,
        });
      }
    }

    // Insert building component for roof if year built is known
    if (yearBuilt) {
      await supabase.from('piq_building_components').insert({
        property_id: propertyId,
        component_type: 'Roof',
        material: building.construction?.roofCover || building.construction?.roofType || null,
        install_year: yearBuilt,
        estimated_life: 25,
        condition: roofScore >= 70 ? 'Poor' : roofScore >= 40 ? 'Fair' : 'Good',
      });
    }

    console.log('ATTOM property saved:', propertyId);

    return new Response(JSON.stringify({ success: true, propertyId, source: 'attom' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('ATTOM lookup error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
