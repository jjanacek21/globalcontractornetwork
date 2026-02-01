-- Create door_to_door_disposition enum type
CREATE TYPE public.door_to_door_disposition AS ENUM (
  'not_home',
  'not_interested',
  'go_back',
  'interested',
  'needs_inspection',
  'appointment_set',
  'contract_signed'
);

-- Create field_sessions table
CREATE TABLE public.field_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_doors INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  route_geojson JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create door_knocks table
CREATE TABLE public.door_knocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  address TEXT,
  disposition public.door_to_door_disposition NOT NULL,
  dwell_time_seconds INTEGER NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  appointment_date TIMESTAMPTZ,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create video_verifications table
CREATE TABLE public.video_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create door_to_door_stats table
CREATE TABLE public.door_to_door_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_doors INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  total_contracts INTEGER NOT NULL DEFAULT 0,
  total_verifications INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_locations table for GPS tracking
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  accuracy NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.field_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_knocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_to_door_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for field_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.field_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.field_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.field_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for door_knocks
CREATE POLICY "Users can view their own door knocks"
  ON public.door_knocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own door knocks"
  ON public.door_knocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own door knocks"
  ON public.door_knocks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for video_verifications
CREATE POLICY "Users can view their own video verifications"
  ON public.video_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video verifications"
  ON public.video_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for door_to_door_stats
CREATE POLICY "Users can view their own stats"
  ON public.door_to_door_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON public.door_to_door_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.door_to_door_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_locations
CREATE POLICY "Users can view their own locations"
  ON public.user_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations"
  ON public.user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_field_sessions_user_id ON public.field_sessions(user_id);
CREATE INDEX idx_field_sessions_is_active ON public.field_sessions(is_active);
CREATE INDEX idx_door_knocks_session_id ON public.door_knocks(session_id);
CREATE INDEX idx_door_knocks_user_id ON public.door_knocks(user_id);
CREATE INDEX idx_video_verifications_session_id ON public.video_verifications(session_id);
CREATE INDEX idx_user_locations_session_id ON public.user_locations(session_id);
CREATE INDEX idx_user_locations_created_at ON public.user_locations(created_at);

-- Create storage bucket for video verifications
INSERT INTO storage.buckets (id, name, public) 
VALUES ('door-to-door-videos', 'door-to-door-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for door-to-door-videos bucket
CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'door-to-door-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'door-to-door-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger function to update door_to_door_stats on new knock
CREATE OR REPLACE FUNCTION public.update_door_to_door_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.door_to_door_stats (user_id, total_doors, total_points)
  VALUES (NEW.user_id, 1, NEW.points_awarded)
  ON CONFLICT (user_id) DO UPDATE SET
    total_doors = door_to_door_stats.total_doors + 1,
    total_points = door_to_door_stats.total_points + NEW.points_awarded,
    total_appointments = CASE 
      WHEN NEW.disposition = 'appointment_set' THEN door_to_door_stats.total_appointments + 1 
      ELSE door_to_door_stats.total_appointments 
    END,
    total_contracts = CASE 
      WHEN NEW.disposition = 'contract_signed' THEN door_to_door_stats.total_contracts + 1 
      ELSE door_to_door_stats.total_contracts 
    END,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_door_to_door_stats
  AFTER INSERT ON public.door_knocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_door_to_door_stats();

-- Trigger function to update session totals
CREATE OR REPLACE FUNCTION public.update_session_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.field_sessions 
  SET 
    total_doors = total_doors + 1,
    total_points = total_points + NEW.points_awarded
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_session_totals
  AFTER INSERT ON public.door_knocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_totals();

-- Trigger to update stats on video verification
CREATE OR REPLACE FUNCTION public.update_stats_on_video()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.door_to_door_stats (user_id, total_verifications, total_points)
  VALUES (NEW.user_id, 1, NEW.points_awarded)
  ON CONFLICT (user_id) DO UPDATE SET
    total_verifications = door_to_door_stats.total_verifications + 1,
    total_points = door_to_door_stats.total_points + NEW.points_awarded,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_stats_on_video
  AFTER INSERT ON public.video_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stats_on_video();

-- Trigger to update session count on new session start
CREATE OR REPLACE FUNCTION public.update_stats_on_session_start()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.door_to_door_stats (user_id, total_sessions)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = door_to_door_stats.total_sessions + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_stats_on_session_start
  AFTER INSERT ON public.field_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stats_on_session_start();