const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { address } = await req.json();
    if (!address) throw new Error("address required");

    const MAPBOX = Deno.env.get("VITE_MAPBOX_TOKEN") || Deno.env.get("MAPBOX_TOKEN");
    let lat: number | null = null, lng: number | null = null, place: string = address;

    if (MAPBOX) {
      const geo = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX}&limit=1`
      );
      const gd = await geo.json();
      const f = gd?.features?.[0];
      if (f) {
        lng = f.center[0];
        lat = f.center[1];
        place = f.place_name;
      }
    }

    let satellite_url: string | null = null;
    if (lat && lng && MAPBOX) {
      satellite_url = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},19,0/800x500@2x?access_token=${MAPBOX}`;
    }

    return new Response(
      JSON.stringify({ lat, lng, place_name: place, satellite_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
