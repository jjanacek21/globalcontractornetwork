import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  query: string;
  limit?: number;
  types?: string;
  country?: string;
  proximity?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, types = 'address', country = 'us', proximity } = await req.json() as GeocodeRequest;

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query must be at least 3 characters', features: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('VITE_MAPBOX_TOKEN');
    if (!mapboxToken) {
      console.error('VITE_MAPBOX_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Geocoding service not configured', features: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build the Mapbox geocoding URL
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=${limit}&types=${types}&country=${country}`;
    
    if (proximity) {
      url += `&proximity=${proximity}`;
    }

    console.log(`Geocoding request for: "${query}"`);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Geocoding request failed', features: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the response to only include what we need
    const features = (data.features || []).map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      context: feature.context?.map((ctx: any) => ({
        id: ctx.id,
        text: ctx.text,
        short_code: ctx.short_code,
      })),
    }));

    console.log(`Found ${features.length} results for "${query}"`);

    return new Response(
      JSON.stringify({ success: true, features }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geocode error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', features: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
