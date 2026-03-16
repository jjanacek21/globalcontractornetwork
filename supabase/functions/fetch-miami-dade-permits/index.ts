import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Miami-Dade Open Data Socrata API for building permits
const SOCRATA_ENDPOINT = "https://datahub-miamidade.opendata.arcgis.com/api/v2/sql";
const SOCRATA_PERMITS_URL = "https://opendata.miamidade.gov/resource/f2ey-bfrn.json";

async function fetchPermitsByFolio(folioNumber: string): Promise<any[]> {
  try {
    // Try Miami-Dade Open Data Socrata API
    const url = `${SOCRATA_PERMITS_URL}?$where=folio_number='${folioNumber}'&$limit=50&$order=process_number DESC`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.log("Socrata folio lookup failed, trying address fallback:", e);
  }
  return [];
}

async function fetchPermitsByAddress(address: string): Promise<any[]> {
  try {
    const encoded = encodeURIComponent(address.toUpperCase().trim());
    const url = `${SOCRATA_PERMITS_URL}?$where=job_address like '%25${encoded}%25'&$limit=50&$order=process_number DESC`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.log("Socrata address lookup failed:", e);
  }
  return [];
}

function mapPermit(raw: any, propertyId: string) {
  return {
    property_id: propertyId,
    permit_number: raw.process_number || raw.permit_number || raw.permit_num || null,
    permit_type: raw.permit_type || raw.permit_category || raw.type || null,
    description: raw.scope_of_work || raw.description || raw.comments || null,
    contractor: raw.contractor_name || raw.contractor || null,
    estimated_cost: raw.total_job_value ? Number(raw.total_job_value) : (raw.estimated_value ? Number(raw.estimated_value) : null),
    issue_date: raw.issued_date || raw.issue_date || raw.application_date || null,
    status: raw.status_current || raw.status || raw.permit_status || null,
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

    // Get property
    const { data: property, error: propErr } = await supabase
      .from("piq_properties")
      .select("id, address, city, state, parcel_id")
      .eq("id", property_id)
      .single();

    if (propErr || !property) {
      return new Response(JSON.stringify({ success: false, error: "Property not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if Miami-Dade
    const city = (property.city || "").toLowerCase();
    const isMiamiDade = ["miami", "miami beach", "hialeah", "homestead", "coral gables", "doral",
      "miami gardens", "north miami", "miami lakes", "aventura", "kendall", "cutler bay",
      "miami shores", "south miami", "key biscayne", "sweetwater", "medley", "opa-locka",
      "north miami beach", "sunny isles", "sunny isles beach", "bal harbour", "surfside",
      "pinecrest", "palmetto bay"].some(c => city.includes(c)) ||
      (property.state || "").toUpperCase() === "FL";

    let rawPermits: any[] = [];

    // Try folio first, then address
    if (property.parcel_id) {
      rawPermits = await fetchPermitsByFolio(property.parcel_id);
    }
    if (rawPermits.length === 0) {
      rawPermits = await fetchPermitsByAddress(property.address);
    }

    if (rawPermits.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No permits found in Miami-Dade Open Data",
        inserted: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Map and insert
    const permitRows = rawPermits.map((r) => mapPermit(r, property_id));

    // Deduplicate by permit_number
    const existingPermits = await supabase
      .from("piq_permits")
      .select("permit_number")
      .eq("property_id", property_id);

    const existingNumbers = new Set((existingPermits.data || []).map((p: any) => p.permit_number));
    const newPermits = permitRows.filter((p) => p.permit_number && !existingNumbers.has(p.permit_number));

    if (newPermits.length > 0) {
      const { error: insertErr } = await supabase.from("piq_permits").insert(newPermits);
      if (insertErr) {
        return new Response(JSON.stringify({ success: false, error: insertErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: newPermits.length,
      total_found: rawPermits.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("fetch-miami-dade-permits error:", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
