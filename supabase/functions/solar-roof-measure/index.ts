import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MeasurementRequest {
  latitude: number;
  longitude: number;
  address?: string;
  roof_type_override?: "flat" | "low_slope" | "pitched";
}

const M2_TO_SQFT = 10.7639;

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { latitude, longitude, address = "", roof_type_override } = (await req.json()) as MeasurementRequest;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid coordinates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(JSON.stringify({ success: false, error: "Coordinates out of range" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "Measurement service is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Google Solar API ---
    const callBuildingInsights = async (requiredQuality: "HIGH" | "MEDIUM") => {
      const endpoint = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
      endpoint.searchParams.set("location.latitude", latitude.toString());
      endpoint.searchParams.set("location.longitude", longitude.toString());
      endpoint.searchParams.set("requiredQuality", requiredQuality);
      endpoint.searchParams.set("key", apiKey);

      const response = await fetch(endpoint.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      return { payload, requiredQuality };
    };

    const highQuality = await callBuildingInsights("HIGH");
    const mediumQuality = highQuality ? null : await callBuildingInsights("MEDIUM");
    const solarResponse = highQuality ?? mediumQuality;

    if (!solarResponse) {
      return new Response(JSON.stringify({ success: false, error: "No solar roof data found for this address" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const solarPotential = solarResponse.payload?.solarPotential;
    const segmentStats = Array.isArray(solarPotential?.roofSegmentStats)
      ? solarPotential.roofSegmentStats
      : [];

    const segments = segmentStats
      .map((segment: any, idx: number) => {
        const areaM2 = toNumber(segment?.stats?.areaMeters2 ?? segment?.areaMeters2);
        const pitchDegrees = toNumber(segment?.pitchDegrees);
        const azimuthDegrees = toNumber(segment?.azimuthDegrees);

        return {
          id: segment?.planeIndex ?? `${idx}`,
          area_m2: areaM2,
          area_sqft: +(areaM2 * M2_TO_SQFT).toFixed(2),
          pitch_degrees: +pitchDegrees.toFixed(2),
          azimuth_degrees: +azimuthDegrees.toFixed(2),
        };
      })
      .filter((segment: { area_m2: number }) => segment.area_m2 > 0)
      .sort((a: { area_m2: number }, b: { area_m2: number }) => b.area_m2 - a.area_m2);

    // Filter segments by roof_type_override — no fallback to all segments
    let useSegments = segments;
    if (roof_type_override === "flat") {
      useSegments = segments.filter((s: { pitch_degrees: number }) => s.pitch_degrees <= 5);
    } else if (roof_type_override === "low_slope") {
      useSegments = segments.filter((s: { pitch_degrees: number }) => s.pitch_degrees <= 10);
    } else if (roof_type_override === "pitched") {
      useSegments = segments.filter((s: { pitch_degrees: number }) => s.pitch_degrees > 5);
    }

    const segmentCount = segments.length;
    const filteredSegmentsCount = useSegments.length;

    const weightedPitchSum = useSegments.reduce(
      (acc: number, segment: { area_m2: number; pitch_degrees: number }) => acc + segment.area_m2 * segment.pitch_degrees,
      0,
    );

    const segmentAreaM2 = useSegments.reduce(
      (acc: number, segment: { area_m2: number }) => acc + segment.area_m2,
      0,
    );

    const wholeRoofAreaM2 = toNumber(solarPotential?.wholeRoofStats?.areaMeters2);
    const totalFlatAreaM2 = (segmentAreaM2 > 0 || roof_type_override) ? segmentAreaM2 : wholeRoofAreaM2;
    const averagePitchDegrees = totalFlatAreaM2 > 0 ? weightedPitchSum / totalFlatAreaM2 : 0;

    const pitchRadians = (averagePitchDegrees * Math.PI) / 180;
    const rawPitchMultiplier = averagePitchDegrees > 0 ? 1 / Math.cos(pitchRadians) : 1;

    // Apply roof type override if provided
    const pitchMultiplier = roof_type_override === "flat" ? 1.0
      : roof_type_override === "low_slope" ? 1.02
      : rawPitchMultiplier;

    const totalFlatSqFt = totalFlatAreaM2 * M2_TO_SQFT;
    const totalPitchedSqFt = totalFlatSqFt * pitchMultiplier;

    const defaultWaste =
      segmentCount <= 2 ? 10 : segmentCount <= 6 ? 13 : segmentCount <= 12 ? 15 : 17;

    const wastePercent = (roof_type_override === "flat" || roof_type_override === "low_slope") ? 5 : defaultWaste;

    const totalWithWasteSqFt = totalPitchedSqFt * (1 + wastePercent / 100);
    const totalSquares = totalWithWasteSqFt / 100;

    const complexity =
      segmentCount <= 2
        ? "Simple"
        : segmentCount <= 6
          ? "Moderate"
          : segmentCount <= 12
            ? "Complex"
            : "Very Complex";

    // --- Mapbox Satellite Image (replaces Google Static Maps) ---
    const centerLat = toNumber(solarResponse.payload?.center?.latitude ?? latitude);
    const centerLng = toNumber(solarResponse.payload?.center?.longitude ?? longitude);

    const mapboxToken = Deno.env.get("VITE_MAPBOX_TOKEN");
    let satellite_image = "";

    if (mapboxToken) {
      try {
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/pin-s+ff0000(${centerLng},${centerLat})/${centerLng},${centerLat},19,0/600x400@2x?access_token=${mapboxToken}`;
        const imgRes = await fetch(mapboxUrl);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          let binary = "";
          for (let i = 0; i < buf.length; i++) {
            binary += String.fromCharCode(buf[i]);
          }
          satellite_image = `data:image/png;base64,${btoa(binary)}`;
        } else {
          await imgRes.text(); // consume body
        }
      } catch {
        // non-critical
      }
    }

    // --- AI Roof Type Verification via Lovable AI Gateway (Gemini) ---
    let ai_roof_type_suggestion: string | null = null;
    let ai_roof_type_warning: string | null = null;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey && satellite_image) {
      try {
        const aiPrompt = `Analyze this satellite image of a roof. Based on what you see, classify the roof type as exactly one of: "flat", "low_slope", or "pitched".

Rules:
- "flat" = no visible slope, commercial-style flat roof
- "low_slope" = slight slope, barely visible pitch (typically under 5 degrees)
- "pitched" = clearly visible slope/angles on the roof

The Google Solar API reports an average pitch of ${averagePitchDegrees.toFixed(1)} degrees for this roof.

Respond with ONLY a JSON object: {"roof_type": "flat"|"low_slope"|"pitched", "confidence": "high"|"medium"|"low"}`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: aiPrompt },
                  { type: "image_url", image_url: { url: satellite_image } },
                ],
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawContent = aiData?.choices?.[0]?.message?.content ?? "";
          // Extract JSON from response
          const jsonMatch = rawContent.match(/\{[^}]+\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            ai_roof_type_suggestion = parsed.roof_type ?? null;

            // Generate warning if AI disagrees with Solar API
            if (ai_roof_type_suggestion) {
              const solarClassification = averagePitchDegrees < 2 ? "flat" : averagePitchDegrees < 5 ? "low_slope" : "pitched";
              if (ai_roof_type_suggestion !== solarClassification) {
                const labels: Record<string, string> = { flat: "Flat Roof", low_slope: "Low Slope", pitched: "Pitched" };
                ai_roof_type_warning = `AI analysis suggests this is a ${labels[ai_roof_type_suggestion] ?? ai_roof_type_suggestion}. The Solar API reported ${averagePitchDegrees.toFixed(1)}° avg pitch (${labels[solarClassification]}). Consider selecting "${labels[ai_roof_type_suggestion]}" above.`;
              }
            }
          }
        } else {
          await aiRes.text(); // consume body
        }
      } catch {
        // non-critical — AI verification is optional
      }
    }

    const responseData = {
      address,
      quality: solarResponse.requiredQuality,
      complexity,
      roof_segments_count: segmentCount,
      average_pitch_degrees: +averagePitchDegrees.toFixed(2),
      pitch_multiplier: +pitchMultiplier.toFixed(4),
      waste_percent: wastePercent,
      total_flat_area_sqft: +totalFlatSqFt.toFixed(2),
      total_pitched_area_sqft: +totalPitchedSqFt.toFixed(2),
      total_with_waste_sqft: +totalWithWasteSqFt.toFixed(2),
      total_squares: +totalSquares.toFixed(2),
      max_panels_count: toNumber(solarPotential?.maxArrayPanelsCount),
      carbon_offset_factor_kg_per_mwh: toNumber(solarPotential?.carbonOffsetFactorKgPerMwh),
      satellite_image,
      center: { latitude: centerLat, longitude: centerLng },
      segments,
      filtered_segments_count: filteredSegmentsCount,
      ai_roof_type_suggestion,
      ai_roof_type_warning,
    };

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
