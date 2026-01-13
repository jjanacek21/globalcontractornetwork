import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainingSessionData {
  sessionId: string;
  address: string;
  normalizedAddress: string;
  latitude: number;
  longitude: number;
  propertyType?: string;
  serviceType: string;
  satelliteImageUrl?: string;
  zoomLevel?: number;
  aiRequestTimestamp?: string;
  aiModelVersion?: string;
  aiEstimatedSqft?: number;
  aiEstimatedSqftLow?: number;
  aiEstimatedSqftHigh?: number;
  aiConfidence?: string;
  aiBuildingType?: string;
  aiRoofShape?: string;
  aiRoofComplexity?: string;
  aiMethodology?: string;
  aiSegmentBreakdown?: string;
  aiPixelEstimate?: string;
  aiReferenceObjects?: string;
  aiResponseTimeMs?: number;
  aiRawResponse?: any;
  userSelectedPitch?: string;
  userSelectedComplexity?: string;
  calculatedTrueSqft?: number;
  calculatedTotalWithWaste?: number;
  calculatedSquares?: number;
  userAdjustedSqft?: number;
  userAdjustedSquares?: number;
  userUsedManualDrawing?: boolean;
  manualDrawingSqft?: number;
  finalAcceptedSqft?: number;
  finalAcceptedSquares?: number;
  measurementMethod?: string;
  sessionDurationSeconds?: number;
  userAgent?: string;
  sourceComponent?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: TrainingSessionData = await req.json();

    // Validate required fields
    if (!data.sessionId || !data.address || !data.latitude || !data.longitude || !data.serviceType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize address for consistent matching
    const normalizedAddress = data.normalizedAddress || data.address.toLowerCase().trim();

    // Insert training session data
    const { data: insertedData, error } = await supabase
      .from('ai_training_sessions')
      .insert({
        session_id: data.sessionId,
        address: data.address,
        normalized_address: normalizedAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        property_type: data.propertyType,
        service_type: data.serviceType,
        satellite_image_url: data.satelliteImageUrl,
        zoom_level: data.zoomLevel || 19,
        ai_request_timestamp: data.aiRequestTimestamp,
        ai_model_version: data.aiModelVersion || 'gemini-2.5-flash',
        ai_estimated_sqft: data.aiEstimatedSqft,
        ai_estimated_sqft_low: data.aiEstimatedSqftLow,
        ai_estimated_sqft_high: data.aiEstimatedSqftHigh,
        ai_confidence: data.aiConfidence,
        ai_building_type: data.aiBuildingType,
        ai_roof_shape: data.aiRoofShape,
        ai_roof_complexity: data.aiRoofComplexity,
        ai_methodology: data.aiMethodology,
        ai_segment_breakdown: data.aiSegmentBreakdown,
        ai_pixel_estimate: data.aiPixelEstimate,
        ai_reference_objects: data.aiReferenceObjects,
        ai_response_time_ms: data.aiResponseTimeMs,
        ai_raw_response: data.aiRawResponse,
        user_selected_pitch: data.userSelectedPitch,
        user_selected_complexity: data.userSelectedComplexity,
        calculated_true_sqft: data.calculatedTrueSqft,
        calculated_total_with_waste: data.calculatedTotalWithWaste,
        calculated_squares: data.calculatedSquares,
        user_adjusted_sqft: data.userAdjustedSqft,
        user_adjusted_squares: data.userAdjustedSquares,
        user_used_manual_drawing: data.userUsedManualDrawing || false,
        manual_drawing_sqft: data.manualDrawingSqft,
        final_accepted_sqft: data.finalAcceptedSqft,
        final_accepted_squares: data.finalAcceptedSquares,
        measurement_method: data.measurementMethod,
        session_duration_seconds: data.sessionDurationSeconds,
        user_agent: data.userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting training session:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Training session logged:', insertedData?.id);

    return new Response(
      JSON.stringify({ success: true, id: insertedData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in log-training-session:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
