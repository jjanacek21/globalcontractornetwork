-- Add AI confidence tracking to permit_projects
ALTER TABLE permit_projects 
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_risk_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_suggested_actions JSONB DEFAULT '[]'::jsonb;

-- Create permit_ai_knowledge table for learned patterns
CREATE TABLE IF NOT EXISTS permit_ai_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_type TEXT NOT NULL,
  jurisdiction_county TEXT NOT NULL,
  city TEXT,
  trade_type TEXT,
  pattern_description TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  source TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permit_rejections table for tracking and learning
CREATE TABLE IF NOT EXISTS permit_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES permit_projects(id) ON DELETE CASCADE,
  jurisdiction_county TEXT NOT NULL,
  city TEXT,
  trade_type TEXT,
  rejection_reason TEXT NOT NULL,
  rejection_category TEXT,
  building_department_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permit_chat_sessions table for conversation history
CREATE TABLE IF NOT EXISTS permit_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_project_id UUID REFERENCES permit_projects(id) ON DELETE CASCADE,
  user_id UUID,
  messages JSONB DEFAULT '[]'::jsonb,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_permit_ai_knowledge_county ON permit_ai_knowledge(jurisdiction_county);
CREATE INDEX IF NOT EXISTS idx_permit_ai_knowledge_type ON permit_ai_knowledge(knowledge_type);
CREATE INDEX IF NOT EXISTS idx_permit_rejections_county ON permit_rejections(jurisdiction_county);
CREATE INDEX IF NOT EXISTS idx_permit_chat_sessions_project ON permit_chat_sessions(permit_project_id);

-- Enable RLS
ALTER TABLE permit_ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for permit_ai_knowledge (read by all, write by super admins)
CREATE POLICY "Anyone can read AI knowledge" ON permit_ai_knowledge
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage AI knowledge" ON permit_ai_knowledge
  FOR ALL USING (public.is_super_admin());

-- Policies for permit_rejections
CREATE POLICY "Users can view their permit rejections" ON permit_rejections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM permit_projects pp 
      WHERE pp.id = permit_project_id 
      AND pp.user_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "Super admins can manage rejections" ON permit_rejections
  FOR ALL USING (public.is_super_admin());

-- Policies for permit_chat_sessions
CREATE POLICY "Users can manage their chat sessions" ON permit_chat_sessions
  FOR ALL USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM permit_projects pp 
      WHERE pp.id = permit_project_id 
      AND pp.user_id = auth.uid()
    )
    OR public.is_super_admin()
  );