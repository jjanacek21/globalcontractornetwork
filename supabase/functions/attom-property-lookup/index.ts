const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface AttomRequest {
  address1: string;
  address2: string;
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
  const cleaned = fullAddress.replace(/, United States$/i, '').trim();
  const firstComma = cleaned.indexOf(',');
  if (firstComma < 0) return null;

  const address1 = cleaned.substring(0, firstComma).trim();
  const address2 = cleaned.substring(firstComma + 1).trim();
  return { address1, address2 };
}

// Map ATTOM property type codes to readable labels
const PROPERTY_TYPE_MAP: Record<string, string> = {
  SFR: 'Single Family',
  CONDO: 'Condominium',
  TOWNHOUSE: 'Townhouse',
  DUPLEX: 'Duplex',
  TRIPLEX: 'Triplex',
  QUADRUPLEX: 'Quadruplex',
  APARTMENT: 'Apartment',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  VACANT: 'Vacant Land',
  MOBILE: 'Mobile Home',
  COOP: 'Co-op',
  RESIDENTIAL: 'Residential',
  RSFR: 'Single Family',
};

function mapPropertyType(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  return PROPERTY_TYPE_MAP[upper] || code;
}

function safeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function calculateRoofScore(yearBuilt: number | null, buildingSqft: number | null): number {
  if (!yearBuilt) return 50;
  const age = new Date().getFullYear() - yearBuilt;
  let score = Math.min(100, Math.max(0, age * 4));
  if (buildingSqft && buildingSqft > 3000) score = Math.min(100, score + 10);
  return Math.round(score);
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
    const assessmentProp = assessmentData?.property?.[0] || {};
    const assessment = assessmentProp.assessment || {};
    const saleHistory = saleData?.property || [];

    // Log full ATTOM response structure for debugging
    console.log('ATTOM property keys:', JSON.stringify(Object.keys(prop)));
    console.log('ATTOM prop.summary:', JSON.stringify(prop.summary || null));
    console.log('ATTOM prop.building:', JSON.stringify(prop.building || null));
    console.log('ATTOM prop.lot:', JSON.stringify(prop.lot || null));
    console.log('ATTOM prop.address:', JSON.stringify(prop.address || null));
    console.log('ATTOM prop.location:', JSON.stringify(prop.location || null));
    console.log('ATTOM assessment:', JSON.stringify(assessment));

    // Extract data — ATTOM has summary at ROOT level of property, not under building
    const summary = prop.summary || {};
    const building = prop.building || {};
    const buildingSize = building.size || {};
    const buildingRooms = building.rooms || {};
    const buildingConstruction = building.construction || {};
    const lot = prop.lot || {};
    const location = prop.location || {};
    const addr = prop.address || {};

    // Owner: can be at prop.assessment.owner OR assessmentProp.assessment.owner
    const owner = prop.assessment?.owner || assessment?.owner || {};

    // Parse numeric fields robustly
    const yearBuilt = safeNum(summary.yearbuilt);
    const buildingSqft = safeNum(buildingSize.livingsize) || safeNum(buildingSize.bldgsize) || safeNum(buildingSize.grosssize) || safeNum(summary.livingsize);
    const lotSqft = safeNum(lot.lotsize1) || safeNum(lot.lotsize2);
    const stories = safeNum(buildingRooms.stories) || safeNum(summary.stories) || safeNum(building.summary?.levels);
    const assessedVal = safeNum(assessment.assessed?.assdttlvalue);
    const marketVal = safeNum(assessment.market?.mktttlvalue);
    const latitude = safeNum(location.latitude) || safeNum(prop.location?.latitude);
    const longitude = safeNum(location.longitude) || safeNum(prop.location?.longitude);

    // City/state/zip
    const city = addr.locality || addr.city || location.locality || '';
    const state = addr.countrySubd || location.countrySubd || '';
    const zip = addr.postal1 || '';
    const streetAddress = addr.line1 || addr.oneLine || parsed.address1;

    // Property type with readable mapping
    const rawPropType = summary.proptype || summary.propsubtype || prop.summary?.proptype || null;
    const propertyType = mapPropertyType(rawPropType);

    const parcelId = prop.identifier?.apn || null;
    const constructionType = buildingConstruction.constructiontype || building.construction?.constructiontype || null;
    const zoning = lot.sitezoningident || lot.zoningtype || null;
    const floodZone = summary.floodzone || lot.floodzoneident || null;

    console.log('Parsed values:', JSON.stringify({
      yearBuilt, buildingSqft, lotSqft, stories, assessedVal, marketVal,
      propertyType, constructionType, zoning, floodZone, city, state, zip,
    }));

    // Extract owner name early so it's available for both existing and new property paths
    const ownerName = (owner.owner1?.last || owner.owner1?.lastname)
      ? `${owner.owner1.first || owner.owner1.firstname || ''} ${owner.owner1.last || owner.owner1.lastname}`.trim()
      : (owner.corporateindicator === 'Y' || owner.corporateIndicator === 'Y' ? owner.absenteeownerstatus || owner.absenteeOwnerStatus || 'Owner' : null);

    // Check if property already exists
    const { data: existing } = await supabase
      .from('piq_properties')
      .select('id')
      .ilike('address', `%${parsed.address1}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update existing property with any missing data
      const updates: Record<string, unknown> = {};
      if (!existing.building_sqft && buildingSqft) updates.building_sqft = buildingSqft;
      if (!existing.lot_sqft && lotSqft) updates.lot_sqft = lotSqft;
      if (!existing.year_built && yearBuilt) updates.year_built = yearBuilt;
      if (!existing.property_type && propertyType) updates.property_type = propertyType;
      if (!existing.assessed_value && assessedVal) updates.assessed_value = assessedVal;
      if (!existing.estimated_value && marketVal) updates.estimated_value = marketVal;
      if (!existing.construction_type && constructionType) updates.construction_type = constructionType;
      if (!existing.stories && stories) updates.stories = Math.round(stories);
      if (!existing.zoning && zoning) updates.zoning = zoning;
      if (!existing.flood_zone && floodZone) updates.flood_zone = floodZone;

      if (Object.keys(updates).length > 0) {
        await supabase.from('piq_properties').update(updates).eq('id', existing.id);
        console.log('Updated existing property with missing fields:', Object.keys(updates));
      }

      // Backfill owner if none exists
      const { count: ownerCount } = await supabase
        .from('piq_property_ownership')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', existing.id);

      if ((ownerCount ?? 0) === 0 && ownerName) {
        const { data: newOwner } = await supabase
          .from('piq_owners')
          .insert({
            name: ownerName,
            owner_type: (owner.corporateindicator === 'Y' || owner.corporateIndicator === 'Y') ? 'Corporate' : 'Individual',
            mailing_address: (addr.line2 || addr.line2) ? `${addr.line1 || addr.oneline || ''}, ${addr.line2 || ''}` : null,
          })
          .select('id')
          .single();

        if (newOwner) {
          await supabase.from('piq_property_ownership').insert({
            property_id: existing.id,
            owner_id: newOwner.id,
            is_current: true,
          });
          console.log('Backfilled owner for existing property:', ownerName);
        }
      }

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
        construction_type: constructionType,
        estimated_value: marketVal,
        assessed_value: assessedVal,
        zoning,
        flood_zone: floodZone,
      })
      .select('id')
      .single();

    if (propError) {
      console.error('Insert property error:', propError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save property data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const propertyId = newProp.id;

    // Insert owner if available (ownerName computed earlier)

    if (ownerName) {
      const { data: newOwner } = await supabase
        .from('piq_owners')
        .insert({
          name: ownerName,
          owner_type: (owner.corporateindicator === 'Y' || owner.corporateIndicator === 'Y') ? 'Corporate' : 'Individual',
          mailing_address: (addr.line2 || addr.line2) ? `${addr.line1 || addr.oneline || ''}, ${addr.line2 || ''}` : null,
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
      const saleAmt = amount.saleamt || amount.saleAmt;
      const saleDate = sale.saletransdate || sale.saleTransDate;
      if (saleAmt || saleDate) {
        await supabase.from('piq_property_sales').insert({
          property_id: propertyId,
          sale_date: saleDate || null,
          sale_price: saleAmt ? parseFloat(saleAmt) : null,
          buyer: (sale.buyer1?.last || sale.buyer1?.lastname) ? `${sale.buyer1.first || sale.buyer1.firstname || ''} ${sale.buyer1.last || sale.buyer1.lastname}`.trim() : null,
          seller: (sale.seller1?.last || sale.seller1?.lastname) ? `${sale.seller1.first || sale.seller1.firstname || ''} ${sale.seller1.last || sale.seller1.lastname}`.trim() : null,
          lender: sale.mortgage?.lender || null,
        });
      }
    }

    // Insert building component for roof if year built is known
    if (yearBuilt) {
      await supabase.from('piq_building_components').insert({
        property_id: propertyId,
        component_type: 'Roof',
        material: buildingConstruction.roofcover || buildingConstruction.rooftype || null,
        install_year: yearBuilt,
        estimated_life: 25,
        condition: roofScore >= 70 ? 'Poor' : roofScore >= 40 ? 'Fair' : 'Good',
      });
    }

    console.log('ATTOM property saved:', propertyId, { yearBuilt, buildingSqft, lotSqft, assessedVal, marketVal, propertyType });

    return new Response(JSON.stringify({ success: true, propertyId, source: 'attom' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('ATTOM lookup error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
