-- Create AI training sessions table for comprehensive measurement data collection
CREATE TABLE ai_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session identification
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Property context
  address TEXT NOT NULL,
  normalized_address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  property_type TEXT,
  service_type TEXT NOT NULL,
  
  -- Satellite image context
  satellite_image_url TEXT,
  zoom_level INTEGER DEFAULT 19,
  
  -- AI Analysis Inputs
  ai_request_timestamp TIMESTAMPTZ,
  ai_model_version TEXT DEFAULT 'gemini-2.5-flash',
  
  -- AI Analysis Outputs (raw from model)
  ai_estimated_sqft NUMERIC,
  ai_estimated_sqft_low NUMERIC,
  ai_estimated_sqft_high NUMERIC,
  ai_confidence TEXT,
  ai_building_type TEXT,
  ai_roof_shape TEXT,
  ai_roof_complexity TEXT,
  ai_methodology TEXT,
  ai_segment_breakdown TEXT,
  ai_pixel_estimate TEXT,
  ai_reference_objects TEXT,
  ai_response_time_ms INTEGER,
  ai_raw_response JSONB,
  
  -- User Selections
  user_selected_pitch TEXT,
  user_selected_complexity TEXT,
  
  -- Calculated Values (after user selections)
  calculated_true_sqft NUMERIC,
  calculated_total_with_waste NUMERIC,
  calculated_squares NUMERIC,
  
  -- User Adjustments (if any)
  user_adjusted_sqft NUMERIC,
  user_adjusted_squares NUMERIC,
  user_used_manual_drawing BOOLEAN DEFAULT FALSE,
  manual_drawing_sqft NUMERIC,
  
  -- Final Accepted Values
  final_accepted_sqft NUMERIC,
  final_accepted_squares NUMERIC,
  
  -- Ground Truth (filled later by contractors)
  ground_truth_sqft NUMERIC,
  ground_truth_squares NUMERIC,
  ground_truth_source TEXT,
  ground_truth_date TIMESTAMPTZ,
  ground_truth_notes TEXT,
  
  -- Error Metrics (calculated when ground truth is added)
  ai_error_percent NUMERIC,
  accepted_error_percent NUMERIC,
  
  -- Session metadata
  measurement_method TEXT,
  session_duration_seconds INTEGER,
  user_agent TEXT,
  
  -- Data quality flags
  is_usable_for_training BOOLEAN DEFAULT TRUE,
  quality_notes TEXT
);

-- Indexes for efficient querying
CREATE INDEX idx_training_sessions_address ON ai_training_sessions(normalized_address);
CREATE INDEX idx_training_sessions_service_type ON ai_training_sessions(service_type);
CREATE INDEX idx_training_sessions_confidence ON ai_training_sessions(ai_confidence);
CREATE INDEX idx_training_sessions_has_ground_truth ON ai_training_sessions(ground_truth_sqft) WHERE ground_truth_sqft IS NOT NULL;
CREATE INDEX idx_training_sessions_property_type ON ai_training_sessions(property_type);
CREATE INDEX idx_training_sessions_session_id ON ai_training_sessions(session_id);

-- Enable RLS
ALTER TABLE ai_training_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (measurement sessions from public users)
CREATE POLICY "Allow anonymous insert" ON ai_training_sessions
  FOR INSERT WITH CHECK (true);

-- Super admins can view all
CREATE POLICY "Super admins full access" ON ai_training_sessions
  FOR ALL USING (public.is_super_admin());