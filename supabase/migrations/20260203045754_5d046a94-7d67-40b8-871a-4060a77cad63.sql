-- Add missing columns to field_sessions table for fallback session support
ALTER TABLE public.field_sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS goals_doors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goals_leads INTEGER DEFAULT 0;