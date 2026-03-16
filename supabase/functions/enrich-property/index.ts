import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Major South Florida storms (hardcoded fallback) ──────────────────
const FLORIDA_STORMS = [
  { event_name: "Hurricane Andrew", event_type: "hurricane", category: "5", wind_speed: 165, event_date: "1992-08-24", affected: ["miami-dade"] },
  { event_name: "Hurricane Frances", event_type: "hurricane", category: "2", wind_speed: 105, event_date: "2004-09-05", affected: ["palm beach", "martin", "st. lucie", "indian river", "brevard", "broward"] },
  { event_name: "Hurricane Jeanne", event_type: "hurricane", category: "3", wind_speed: 120, event_date: "2004-09-26", affected: ["palm beach", "martin", "st. lucie", "indian river", "brevard"] },
  { event_name: "Hurricane Wilma", event_type: "hurricane", category: "3", wind_speed: 120, event_date: "2005-10-24", affected: ["miami-dade", "broward", "palm beach", "collier", "lee", "hendry"] },
  { event_name: "Hurricane Irma", event_type: "hurricane", category: "4", wind_speed: 130, event_date: "2017-09-10", affected: ["miami-dade", "broward", "palm beach", "collier", "lee", "monroe", "martin", "st. lucie", "hendry", "charlotte", "sarasota", "manatee", "hillsborough", "pinellas", "orange", "osceola", "polk"] },
  { event_name: "Hurricane Dorian", event_type: "hurricane", category: "1", wind_speed: 80, event_date: "2019-09-02", affected: ["palm beach", "martin", "st. lucie", "indian river", "brevard", "volusia", "flagler", "st. johns", "duval"] },
  { event_name: "Hurricane Ian", event_type: "hurricane", category: "4", wind_speed: 150, event_date: "2022-09-28", affected: ["lee", "charlotte", "collier", "desoto", "sarasota", "manatee", "hardee", "highlands", "polk", "osceola", "orange", "seminole", "volusia", "brevard"] },
  { event_name: "Hurricane Nicole", event_type: "hurricane", category: "1", wind_speed: 75, event_date: "2022-11-10", affected: ["palm beach", "martin", "st. lucie", "indian river", "brevard", "volusia", "flagler"] },
  { event_name: "Hurricane Milton", event_type: "hurricane", category: "3", wind_speed: 120, event_date: "2024-10-09", affected: ["sarasota", "manatee", "hillsborough", "pinellas", "polk", "hardee", "desoto", "charlotte", "lee", "highlands", "osceola", "orange", "brevard", "indian river", "st. lucie", "volusia"] },
];

// Map common Florida cities → counties for storm matching
const CITY_COUNTY_MAP: Record<string, string> = {
  miami: "miami-dade", "miami beach": "miami-dade", hialeah: "miami-dade", homestead: "miami-dade", "coral gables": "miami-dade", doral: "miami-dade", "miami gardens": "miami-dade", "north miami": "miami-dade", "miami lakes": "miami-dade", aventura: "miami-dade", kendall: "miami-dade", "cutler bay": "miami-dade",
  "fort lauderdale": "broward", hollywood: "broward", "pompano beach": "broward", davie: "broward", "coral springs": "broward", plantation: "broward", "pembroke pines": "broward", miramar: "broward", sunrise: "broward", weston: "broward", deerfield: "broward", "deerfield beach": "broward",
  "west palm beach": "palm beach", "boca raton": "palm beach", boynton: "palm beach", "boynton beach": "palm beach", delray: "palm beach", "delray beach": "palm beach", jupiter: "palm beach", "palm beach gardens": "palm beach", "lake worth": "palm beach", wellington: "palm beach", "royal palm beach": "palm beach",
  "port st. lucie": "st. lucie", "port saint lucie": "st. lucie", "fort pierce": "st. lucie",
  stuart: "martin", "jensen beach": "martin",
  "vero beach": "indian river", sebastian: "indian river",
  melbourne: "brevard", "palm bay": "brevard", titusville: "brevard", "cocoa beach": "brevard", cocoa: "brevard",
  naples: "collier", "marco island": "collier", "immokalee": "collier",
  "fort myers": "lee", "cape coral": "lee", bonita: "lee", "bonita springs": "lee", lehigh: "lee", "lehigh acres": "lee",
  "key west": "monroe", "key largo": "monroe", marathon: "monroe", islamorada: "monroe",
  tampa: "hillsborough", brandon: "hillsborough",
  "st. petersburg": "pinellas", "saint petersburg": "pinellas", clearwater: "pinellas",
  sarasota: "sarasota", "north port": "sarasota", venice: "sarasota",
  bradenton: "manatee", "palmetto": "manatee",
  orlando: "orange", "winter park": "orange",
  kissimmee: "osceola", "st. cloud": "osceola",
  lakeland: "polk", "winter haven": "polk",
  daytona: "volusia", "daytona beach": "volusia", "port orange": "volusia", "deland": "volusia",
  jacksonville: "duval",
  "st. augustine": "st. johns", "saint augustine": "st. johns",
  "palm coast": "flagler",
  "punta gorda": "charlotte", "port charlotte": "charlotte",
  "arcadia": "desoto",
  "sebring": "highlands", "avon park": "highlands",
  "clewiston": "hendry", "labelle": "hendry",
  "wauchula": "hardee",
  gainesville: "alachua",
  tallahassee: "leon",
  pensacola: "escambia",
  "panama city": "bay",
  ocala: "marion",
};

function cityToCounty(city: string): string | null {
  const normalized = city.toLowerCase().trim();
  return CITY_COUNTY_MAP[normalized] || null;
}

// ── Score calculation ────────────────────────────────────────────────
function clamp(min: number, max: number, val: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

interface ScoreInputs {
  roofAge: number;
  expectedLife: number;
  stormCount: number;
  yearsSinceRoofPermit: number;
  buildingSqft: number;
  hasCodeViolations: boolean;
  buildingAge: number;
  yearsSinceAnyPermit: number;
  componentAvgLifeUsed: number;
  salePriceGrowthPct: number;
  yearsSinceLastSale: number;
  assessedVsMarketGapPct: number;
  portfolioSize: number;
  occupancyStatus: string | null;
  renovationScore?: number;
}

function calculateScores(s: ScoreInputs) {
  const roofScore = clamp(0, 100,
    (s.roofAge / Math.max(s.expectedLife, 1)) * 40 +
    Math.min(s.stormCount * 8, 24) +
    (s.yearsSinceRoofPermit > 15 ? 20 : 0) +
    (s.buildingSqft > 20000 ? 10 : 0) +
    (s.hasCodeViolations ? 6 : 0)
  );

  const renovationScore = clamp(0, 100,
    (s.buildingAge / 50) * 30 +
    (s.yearsSinceAnyPermit > 10 ? 25 : 0) +
    s.componentAvgLifeUsed * 30 +
    (s.hasCodeViolations ? 15 : 0)
  );

  const investmentScore = clamp(0, 100,
    s.salePriceGrowthPct * 20 +
    (s.yearsSinceLastSale > 7 ? 20 : 0) +
    s.assessedVsMarketGapPct * 20 +
    (s.portfolioSize > 5 ? 15 : 0) +
    (s.occupancyStatus === "tenant" ? 10 : 0) +
    (renovationScore < 30 ? 15 : 0)
  );

  return {
    roof_replacement_score: roofScore,
    renovation_score: renovationScore,
    investment_score: investmentScore,
    overall_contractor_score: clamp(0, 100, Math.round((roofScore + renovationScore) / 2)),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return new Response(JSON.stringify({ success: false, error: "property_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const enrichmentLog: string[] = [];

    // ── 1. Fetch property ────────────────────────────────────────────
    const { data: property, error: propErr } = await supabase
      .from("piq_properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propErr || !property) {
      return new Response(JSON.stringify({ success: false, error: "Property not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Fetch owner ──────────────────────────────────────────────
    const { data: ownership } = await supabase
      .from("piq_property_ownership")
      .select("owner_id, piq_owners(*)")
      .eq("property_id", property_id);

    const owners = (ownership || []).map((o: any) => o.piq_owners).filter(Boolean);

    // ── 3a. Storm data enrichment ────────────────────────────────────
    const { count: stormCount } = await supabase
      .from("piq_storm_events")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property_id);

    if ((stormCount ?? 0) === 0) {
      const county = cityToCounty(property.city || "");
      if (county) {
        const matchedStorms = FLORIDA_STORMS.filter((s) =>
          s.affected.includes(county)
        );

        if (matchedStorms.length > 0) {
          const stormRows = matchedStorms.map((s) => ({
            property_id,
            event_name: s.event_name,
            event_type: s.event_type,
            category: s.category,
            wind_speed: s.wind_speed,
            event_date: s.event_date,
            damage_reported: s.wind_speed >= 100,
            insurance_claims: s.wind_speed >= 110 ? 1 : 0,
          }));

          const { error: stormErr } = await supabase
            .from("piq_storm_events")
            .insert(stormRows);

          if (!stormErr) {
            enrichmentLog.push(`Storms: inserted ${stormRows.length} historical storm events`);
          } else {
            enrichmentLog.push(`Storms: insert failed - ${stormErr.message}`);
          }
        } else {
          enrichmentLog.push("Storms: no matching storms for county " + county);
        }
      } else {
        enrichmentLog.push("Storms: could not map city to county for " + (property.city || "unknown"));
      }
    } else {
      enrichmentLog.push(`Storms: already has ${stormCount} events`);
    }

    // ── 3b. Owner contacts placeholder ──────────────────────────────
    const ownersMissingEmail = owners.filter((o: any) => !o.email);
    if (ownersMissingEmail.length > 0) {
      enrichmentLog.push(`Owner contacts: ${ownersMissingEmail.length} owner(s) missing email — enrich-owner-contacts not yet implemented`);
    }

    // ── 3c. Company data placeholder ────────────────────────────────
    for (const owner of owners) {
      const { count: companyCount } = await supabase
        .from("piq_companies")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", (owner as any).id);

      if ((companyCount ?? 0) === 0) {
        enrichmentLog.push(`Company data: no company for owner "${(owner as any).name}" — fetch-company-data not yet implemented`);
      }
    }

    // ── 3d. Permits check ───────────────────────────────────────────
    const { count: permitCount } = await supabase
      .from("piq_permits")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property_id);

    if ((permitCount ?? 0) === 0) {
      enrichmentLog.push("Permits: not yet available");
    }

    // ── 4. Calculate scores ─────────────────────────────────────────
    // Gather inputs
    const currentYear = new Date().getFullYear();
    const buildingAge = currentYear - (property.year_built || 2000);

    // Roof info
    const { data: roofComp } = await supabase
      .from("piq_building_components")
      .select("*")
      .eq("property_id", property_id)
      .eq("component_type", "Roof")
      .limit(1)
      .maybeSingle();

    const roofAge = currentYear - (roofComp?.install_year || property.year_built || 2000);
    const expectedLife = roofComp?.estimated_life || 25;

    // Re-count storms after potential insert
    const { count: finalStormCount } = await supabase
      .from("piq_storm_events")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property_id);

    // Most recent roof permit
    const { data: roofPermits } = await supabase
      .from("piq_permits")
      .select("issue_date")
      .eq("property_id", property_id)
      .ilike("permit_type", "%roof%")
      .order("issue_date", { ascending: false })
      .limit(1);

    const lastRoofPermitYear = roofPermits?.[0]?.issue_date
      ? new Date(roofPermits[0].issue_date).getFullYear()
      : property.year_built || 2000;
    const yearsSinceRoofPermit = currentYear - lastRoofPermitYear;

    // Most recent any permit
    const { data: anyPermits } = await supabase
      .from("piq_permits")
      .select("issue_date")
      .eq("property_id", property_id)
      .order("issue_date", { ascending: false })
      .limit(1);

    const lastAnyPermitYear = anyPermits?.[0]?.issue_date
      ? new Date(anyPermits[0].issue_date).getFullYear()
      : property.year_built || 2000;
    const yearsSinceAnyPermit = currentYear - lastAnyPermitYear;

    // Code violations
    const { count: violationCount } = await supabase
      .from("piq_code_violations")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property_id);

    // Component avg life used
    const { data: allComponents } = await supabase
      .from("piq_building_components")
      .select("install_year, estimated_life")
      .eq("property_id", property_id);

    let componentAvgLifeUsed = 0;
    if (allComponents && allComponents.length > 0) {
      const lifePcts = allComponents.map((c: any) => {
        const age = currentYear - (c.install_year || 2000);
        const life = c.estimated_life || 25;
        return Math.min(1, age / life);
      });
      componentAvgLifeUsed = lifePcts.reduce((a: number, b: number) => a + b, 0) / lifePcts.length;
    }

    // Sales data
    const { data: sales } = await supabase
      .from("piq_property_sales")
      .select("sale_date, sale_price")
      .eq("property_id", property_id)
      .order("sale_date", { ascending: false });

    let salePriceGrowthPct = 0;
    let yearsSinceLastSale = 20;
    if (sales && sales.length > 0) {
      yearsSinceLastSale = sales[0].sale_date
        ? currentYear - new Date(sales[0].sale_date).getFullYear()
        : 20;
      if (sales.length >= 2 && sales[0].sale_price && sales[1].sale_price) {
        salePriceGrowthPct = Math.min(1, (Number(sales[0].sale_price) - Number(sales[1].sale_price)) / Number(sales[1].sale_price));
      }
    }

    // Assessed vs market gap
    const assessed = Number(property.assessed_value || 0);
    const market = Number(property.estimated_value || 0);
    const assessedVsMarketGapPct = market > 0
      ? Math.min(1, Math.abs(market - assessed) / market)
      : 0;

    // Portfolio size (how many properties this owner has)
    let portfolioSize = 1;
    if (ownership && ownership.length > 0) {
      const { count: ownerProps } = await supabase
        .from("piq_property_ownership")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", ownership[0].owner_id);
      portfolioSize = ownerProps || 1;
    }

    const scores = calculateScores({
      roofAge,
      expectedLife,
      stormCount: finalStormCount ?? 0,
      yearsSinceRoofPermit,
      buildingSqft: property.building_sqft || 0,
      hasCodeViolations: (violationCount ?? 0) > 0,
      buildingAge,
      yearsSinceAnyPermit,
      componentAvgLifeUsed,
      salePriceGrowthPct,
      yearsSinceLastSale,
      assessedVsMarketGapPct,
      portfolioSize,
      occupancyStatus: property.occupancy_status,
    });

    // Upsert scores
    const { data: existingScores } = await supabase
      .from("piq_property_scores")
      .select("id")
      .eq("property_id", property_id)
      .maybeSingle();

    if (existingScores) {
      await supabase
        .from("piq_property_scores")
        .update(scores)
        .eq("id", existingScores.id);
    } else {
      await supabase
        .from("piq_property_scores")
        .insert({ property_id, ...scores });
    }

    enrichmentLog.push(
      `Scores: roof=${scores.roof_replacement_score}, renovation=${scores.renovation_score}, investment=${scores.investment_score}`
    );

    return new Response(
      JSON.stringify({ success: true, enriched: enrichmentLog }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enrich-property error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
