-- Create door session goals table for pre-session video goals
CREATE TABLE public.door_session_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  goals_doors INTEGER NOT NULL DEFAULT 50,
  goals_leads INTEGER NOT NULL DEFAULT 5,
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session progress videos table for hourly check-ins
CREATE TABLE public.session_progress_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER NOT NULL DEFAULT 0,
  update_number INTEGER NOT NULL DEFAULT 1,
  video_type TEXT NOT NULL DEFAULT 'progress' CHECK (video_type IN ('goal', 'progress', 'roof', 'homeowner')),
  points_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  points_awarded INTEGER NOT NULL DEFAULT 100,
  challenges_mentioned TEXT,
  updated_goals_doors INTEGER,
  updated_goals_leads INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session feed posts table for global feed
CREATE TABLE public.session_feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.field_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_url TEXT,
  video_type TEXT NOT NULL DEFAULT 'progress' CHECK (video_type IN ('goal', 'progress', 'roof', 'homeowner')),
  content TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  doors_knocked INTEGER NOT NULL DEFAULT 0,
  leads_gotten INTEGER NOT NULL DEFAULT 0,
  goals_doors INTEGER,
  goals_leads INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session feed reactions table
CREATE TABLE public.session_feed_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.session_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT '👏' CHECK (reaction_type IN ('👏', '🔥', '💪', '🎯', '⭐', '🚀')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.door_session_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_progress_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feed_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for door_session_goals
CREATE POLICY "Users can view all session goals" 
ON public.door_session_goals FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own session goals" 
ON public.door_session_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for session_progress_videos
CREATE POLICY "Users can view all progress videos" 
ON public.session_progress_videos FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own progress videos" 
ON public.session_progress_videos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for session_feed_posts
CREATE POLICY "Anyone can view feed posts" 
ON public.session_feed_posts FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own feed posts" 
ON public.session_feed_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed posts" 
ON public.session_feed_posts FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for session_feed_reactions
CREATE POLICY "Anyone can view reactions" 
ON public.session_feed_reactions FOR SELECT 
USING (true);

CREATE POLICY "Users can add their own reactions" 
ON public.session_feed_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" 
ON public.session_feed_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_door_session_goals_session ON public.door_session_goals(session_id);
CREATE INDEX idx_door_session_goals_user ON public.door_session_goals(user_id);
CREATE INDEX idx_session_progress_videos_session ON public.session_progress_videos(session_id);
CREATE INDEX idx_session_progress_videos_user ON public.session_progress_videos(user_id);
CREATE INDEX idx_session_feed_posts_created ON public.session_feed_posts(created_at DESC);
CREATE INDEX idx_session_feed_posts_user ON public.session_feed_posts(user_id);
CREATE INDEX idx_session_feed_reactions_post ON public.session_feed_reactions(post_id);

-- Enable realtime for feed posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_feed_reactions;