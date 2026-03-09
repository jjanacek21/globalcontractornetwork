import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MeasurementRequest {
  latitude: number;
  longitude: number;
  address?: string;
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
    const { latitude, longitude, address = "" } = (await req.json()) as MeasurementRequest;

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

    const segmentCount = segments.length;
    const weightedPitchSum = segments.reduce(
      (acc: number, segment: { area_m2: number; pitch_degrees: number }) => acc + segment.area_m2 * segment.pitch_degrees,
      0,
    );

    const segmentAreaM2 = segments.reduce(
      (acc: number, segment: { area_m2: number }) => acc + segment.area_m2,
      0,
    );

    const wholeRoofAreaM2 = toNumber(solarPotential?.wholeRoofStats?.areaMeters2);
    const totalFlatAreaM2 = segmentAreaM2 > 0 ? segmentAreaM2 : wholeRoofAreaM2;
    const averagePitchDegrees = totalFlatAreaM2 > 0 ? weightedPitchSum / totalFlatAreaM2 : 0;

    const pitchRadians = (averagePitchDegrees * Math.PI) / 180;
    const pitchMultiplier = averagePitchDegrees > 0 ? 1 / Math.cos(pitchRadians) : 1;

    const totalFlatSqFt = totalFlatAreaM2 * M2_TO_SQFT;
    const totalPitchedSqFt = totalFlatSqFt * pitchMultiplier;

    const wastePercent =
      segmentCount <= 2 ? 10 : segmentCount <= 6 ? 13 : segmentCount <= 12 ? 15 : 17;

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

    // Build satellite verification image URL
    const centerLat = toNumber(solarResponse.payload?.center?.latitude ?? latitude);
    const centerLng = toNumber(solarResponse.payload?.center?.longitude ?? longitude);
    const satelliteImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=20&size=600x400&maptype=satellite&markers=color:red%7C${centerLat},${centerLng}&key=${apiKey}`;

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
      satellite_image_url: satelliteImageUrl,
      center: { latitude: centerLat, longitude: centerLng },
      segments,
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
