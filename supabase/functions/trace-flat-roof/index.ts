// AI-assisted flat-roof section tracing.
// Given a pin (lat/lng), pulls a high-zoom Mapbox satellite tile centered on the pin,
// asks Gemini to outline the flat roof section, and returns a polygon + estimated sqft.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Req {
  latitude: number;
  longitude: number;
}

const M2_TO_SQFT = 10.7639;
const EARTH_RADIUS_M = 6378137;

// Convert (dx_meters, dy_meters) offsets relative to a center lat/lng into lat/lng
function offsetToLatLng(centerLat: number, centerLng: number, dxMeters: number, dyMeters: number) {
  const dLat = (dyMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLng = (dxMeters / (EARTH_RADIUS_M * Math.cos((centerLat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: centerLat + dLat, lng: centerLng + dLng };
}

// Shoelace area in m² for polygon of {x, y} meter offsets
function polygonAreaM2(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { latitude, longitude } = (await req.json()) as Req;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapboxToken = Deno.env.get("VITE_MAPBOX_TOKEN");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!mapboxToken || !lovableApiKey) {
      return new Response(JSON.stringify({ success: false, error: "Service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapbox static tile, zoom 20 for max detail. 600x600 image.
    const zoom = 20;
    const imgWidth = 600;
    const imgHeight = 600;
    const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${longitude},${latitude},${zoom},0/${imgWidth}x${imgHeight}@2x?access_token=${mapboxToken}`;

    const imgRes = await fetch(mapboxUrl);
    if (!imgRes.ok) {
      await imgRes.text();
      return new Response(JSON.stringify({ success: false, error: "Could not load satellite image" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const dataUrl = `data:image/png;base64,${btoa(binary)}`;

    // Meters per pixel at this latitude/zoom (Web Mercator)
    const metersPerPixel = (Math.cos((latitude * Math.PI) / 180) * 2 * Math.PI * EARTH_RADIUS_M) / (256 * Math.pow(2, zoom));

    const prompt = `You are looking at a satellite image of a residential property. The PIN is at the center of the image.

The user clicked the pin on what they believe is a FLAT or LOW-SLOPE roof section (often a rear addition, lanai, carport, or porch — looks like a flat gray/tan rectangle attached to the main house).

Trace the outline of that flat roof section. Return up to 8 polygon corner points as PIXEL coordinates in this image (origin top-left, x right, y down, image is ${imgWidth}x${imgHeight}).

Respond with ONLY JSON:
{"polygon_pixels":[{"x":123,"y":234}, ...], "confidence":"high"|"medium"|"low", "notes":"short reason"}

If you cannot identify a clearly bounded flat roof at the pin, return:
{"polygon_pixels":[], "confidence":"low", "notes":"could not identify"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        }],
      }),
    });

    let polygonPixels: { x: number; y: number }[] = [];
    let confidence: "high" | "medium" | "low" = "low";
    let notes = "";

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const raw = aiData?.choices?.[0]?.message?.content ?? "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (Array.isArray(parsed.polygon_pixels)) {
            polygonPixels = parsed.polygon_pixels
              .filter((p: any) => Number.isFinite(p?.x) && Number.isFinite(p?.y))
              .map((p: any) => ({ x: +p.x, y: +p.y }));
          }
          confidence = parsed.confidence ?? "low";
          notes = parsed.notes ?? "";
        } catch { /* ignore */ }
      }
    } else {
      await aiRes.text();
    }

    // Convert pixel polygon -> meter offsets relative to image center -> lat/lng polygon
    let polygonLngLat: { lat: number; lng: number }[] = [];
    let areaSqft = 0;

    if (polygonPixels.length >= 3) {
      // Note: Mapbox @2x returns 1200x1200 actual pixels but our coords are normalized to 600x600.
      // metersPerPixel above is for the 1x scale (256 tile size used in formula).
      // Since static image is at zoom=20 and reported as 600x600 logical, we use mppx as-is per logical px.
      const cx = imgWidth / 2;
      const cy = imgHeight / 2;
      const meterOffsets = polygonPixels.map((p) => ({
        x: (p.x - cx) * metersPerPixel,
        y: -(p.y - cy) * metersPerPixel, // flip y
      }));
      const areaM2Footprint = polygonAreaM2(meterOffsets);
      // Flat roofs: surface ≈ footprint (pitch ~2°, multiplier ~1.0006)
      areaSqft = +(areaM2Footprint * M2_TO_SQFT).toFixed(2);

      polygonLngLat = meterOffsets.map((p) => offsetToLatLng(latitude, longitude, p.x, p.y));
    }

    // Fallback: if AI couldn't trace, return a default 30ft x 30ft (~900 sqft) square the user can resize
    if (polygonLngLat.length < 3) {
      const halfM = 4.572; // 15 ft in meters
      const corners = [
        { x: -halfM, y: -halfM },
        { x: halfM, y: -halfM },
        { x: halfM, y: halfM },
        { x: -halfM, y: halfM },
      ];
      polygonLngLat = corners.map((c) => offsetToLatLng(latitude, longitude, c.x, c.y));
      areaSqft = 900;
      confidence = "low";
      notes = notes || "AI could not auto-trace; default rectangle provided. Please drag the corners to fit.";
    }

    console.log("[trace-flat-roof]", { latitude, longitude, areaSqft, confidence, points: polygonLngLat.length });

    return new Response(JSON.stringify({
      success: true,
      data: {
        polygon: polygonLngLat,
        area_sqft: areaSqft,
        confidence,
        notes,
        center: { lat: latitude, lng: longitude },
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[trace-flat-roof] error", err);
    return new Response(JSON.stringify({ success: false, error: "Failed to trace flat section" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
