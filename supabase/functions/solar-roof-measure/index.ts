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

const toPitchOver12 = (deg: number): number =>
  Math.round(Math.tan((deg * Math.PI) / 180) * 12);

const toNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

Deno.serve(async (req) => {
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

      if (!response.ok) return null;
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

    // IMPORTANT: Google Solar's roofSegmentStats[].stats.areaMeters2 is already
    // the ACTUAL/SLANTED roof surface area (what you shingle), not footprint.
    // Do NOT multiply by 1/cos(pitch) — that double-counts the slope.
    const segments = segmentStats
      .map((segment: any, idx: number) => {
        const surfaceM2 = toNumber(segment?.stats?.areaMeters2 ?? segment?.areaMeters2);
        const pitchDegrees = toNumber(segment?.pitchDegrees);
        const azimuthDegrees = toNumber(segment?.azimuthDegrees);
        const bbox = segment?.boundingBox ?? null;

        // Footprint = surface * cos(pitch). Used to compare against building footprint.
        const footprintM2 = surfaceM2 * Math.cos((pitchDegrees * Math.PI) / 180);

        return {
          id: segment?.planeIndex ?? `${idx}`,
          surface_area_m2: surfaceM2,
          surface_area_sqft: +(surfaceM2 * M2_TO_SQFT).toFixed(2),
          footprint_area_m2: footprintM2,
          footprint_area_sqft: +(footprintM2 * M2_TO_SQFT).toFixed(2),
          pitch_degrees: +pitchDegrees.toFixed(2),
          pitch_over_12: toPitchOver12(pitchDegrees),
          azimuth_degrees: +azimuthDegrees.toFixed(2),
          bounding_box: bbox,
        };
      })
      .filter((s) => s.surface_area_m2 > 0)
      .sort((a, b) => b.surface_area_m2 - a.surface_area_m2);

    // Apply optional override filter
    let useSegments = segments;
    if (roof_type_override === "flat") {
      useSegments = segments.filter((s) => s.pitch_degrees <= 5);
    } else if (roof_type_override === "low_slope") {
      useSegments = segments.filter((s) => s.pitch_degrees <= 10);
    } else if (roof_type_override === "pitched") {
      useSegments = segments.filter((s) => s.pitch_degrees > 5);
    }

    const segmentCount = segments.length;

    // Surface (slanted) totals — what gets shingled
    const totalSurfaceM2 = useSegments.reduce((acc, s) => acc + s.surface_area_m2, 0);
    const totalSurfaceSqft = totalSurfaceM2 * M2_TO_SQFT;

    // Footprint totals — for comparison vs building footprint
    const totalSegmentFootprintM2 = useSegments.reduce((acc, s) => acc + s.footprint_area_m2, 0);
    const totalSegmentFootprintSqft = totalSegmentFootprintM2 * M2_TO_SQFT;

    // Weighted average pitch (by surface area)
    const weightedPitchSum = useSegments.reduce(
      (acc, s) => acc + s.surface_area_m2 * s.pitch_degrees,
      0,
    );
    const averagePitchDegrees = totalSurfaceM2 > 0 ? weightedPitchSum / totalSurfaceM2 : 0;
    const pitchMultiplier = averagePitchDegrees > 0
      ? 1 / Math.cos((averagePitchDegrees * Math.PI) / 180)
      : 1;

    // Building footprint (from Google Solar). Used to detect missing flat sections.
    const buildingFootprintM2 = toNumber(
      solarPotential?.buildingStats?.areaMeters2 ?? solarPotential?.wholeRoofStats?.areaMeters2,
    );
    const buildingFootprintSqft = buildingFootprintM2 * M2_TO_SQFT;

    // If measured footprint is significantly less than building footprint,
    // Solar likely missed a flat/low-slope section.
    let likelyMissingFlatSection = false;
    let missingFootprintSqft = 0;
    if (buildingFootprintM2 > 0 && totalSegmentFootprintM2 > 0) {
      const ratio = totalSegmentFootprintM2 / buildingFootprintM2;
      if (ratio < 0.7) {
        likelyMissingFlatSection = true;
        missingFootprintSqft = +((buildingFootprintM2 - totalSegmentFootprintM2) * M2_TO_SQFT).toFixed(2);
      }
    }

    const complexity =
      segmentCount <= 2 ? "Simple"
        : segmentCount <= 6 ? "Moderate"
          : segmentCount <= 12 ? "Complex"
            : "Very Complex";

    // Mapbox satellite snapshot
    const centerLat = toNumber(solarResponse.payload?.center?.latitude ?? latitude);
    const centerLng = toNumber(solarResponse.payload?.center?.longitude ?? longitude);
    const buildingBoundingBox = solarResponse.payload?.boundingBox ?? null;

    const mapboxToken = Deno.env.get("VITE_MAPBOX_TOKEN");
    let satellite_image = "";
    if (mapboxToken) {
      try {
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/pin-s+ff0000(${centerLng},${centerLat})/${centerLng},${centerLat},19,0/600x400@2x?access_token=${mapboxToken}`;
        const imgRes = await fetch(mapboxUrl);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          let binary = "";
          for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
          satellite_image = `data:image/png;base64,${btoa(binary)}`;
        } else {
          await imgRes.text();
        }
      } catch { /* non-critical */ }
    }

    // AI roof type cross-check
    let ai_roof_type_suggestion: string | null = null;
    let ai_roof_type_warning: string | null = null;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey && satellite_image) {
      try {
        const aiPrompt = `Analyze this satellite image of a roof. Classify as exactly one of: "flat", "low_slope", "pitched", or "mixed".

Rules:
- "flat" = no visible slope (commercial-style flat)
- "low_slope" = slight slope (under ~5°)
- "pitched" = clearly visible angles
- "mixed" = home has BOTH a pitched section AND a flat/low-slope section (very common in Florida)

Google Solar reports avg pitch ${averagePitchDegrees.toFixed(1)}° across ${segmentCount} segment(s).

Respond with ONLY a JSON object: {"roof_type":"flat"|"low_slope"|"pitched"|"mixed","has_flat_section":true|false,"confidence":"high"|"medium"|"low"}`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: aiPrompt },
                { type: "image_url", image_url: { url: satellite_image } },
              ],
            }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawContent = aiData?.choices?.[0]?.message?.content ?? "";
          const jsonMatch = rawContent.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            ai_roof_type_suggestion = parsed.roof_type ?? null;
            // If AI sees a flat section but we didn't measure one, flag it
            if (parsed.has_flat_section === true || parsed.roof_type === "mixed") {
              if (!segments.some((s) => s.pitch_degrees <= 5)) {
                likelyMissingFlatSection = true;
                ai_roof_type_warning = "AI detected a flat section that Google Solar did not measure. Drop a blue pin on the flat area to add it.";
              }
            }
          }
        } else {
          await aiRes.text();
        }
      } catch { /* non-critical */ }
    }

    // Sanity logging
    console.log("[solar-roof-measure]", {
      address,
      latitude, longitude,
      segmentCount,
      totalSurfaceSqft: +totalSurfaceSqft.toFixed(0),
      totalSegmentFootprintSqft: +totalSegmentFootprintSqft.toFixed(0),
      buildingFootprintSqft: +buildingFootprintSqft.toFixed(0),
      averagePitchDegrees: +averagePitchDegrees.toFixed(1),
      likelyMissingFlatSection,
      missingFootprintSqft,
    });

    const responseData = {
      address,
      quality: solarResponse.requiredQuality,
      complexity,
      roof_segments_count: segmentCount,
      average_pitch_degrees: +averagePitchDegrees.toFixed(2),
      average_pitch_over_12: toPitchOver12(averagePitchDegrees),
      pitch_multiplier: +pitchMultiplier.toFixed(4),

      // Primary: actual roof surface area (this is what gets shingled)
      total_roof_area_sqft: +totalSurfaceSqft.toFixed(2),
      // Footprint sums for diagnostics
      total_segment_footprint_sqft: +totalSegmentFootprintSqft.toFixed(2),
      building_footprint_sqft: +buildingFootprintSqft.toFixed(2),

      // Backwards-compat aliases (frontend may still read these)
      total_pitched_area_sqft: +totalSurfaceSqft.toFixed(2),
      total_flat_area_sqft: +totalSurfaceSqft.toFixed(2),

      max_panels_count: toNumber(solarPotential?.maxArrayPanelsCount),
      satellite_image,
      center: { latitude: centerLat, longitude: centerLng },
      building_bounding_box: buildingBoundingBox,
      segments,

      likely_missing_flat_section: likelyMissingFlatSection,
      missing_footprint_sqft: missingFootprintSqft,

      ai_roof_type_suggestion,
      ai_roof_type_warning,
    };

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[solar-roof-measure] error", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
