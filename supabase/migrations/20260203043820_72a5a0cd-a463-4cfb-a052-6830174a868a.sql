-- Add image_url and post_type to session_feed_posts for text/photo/video posts
ALTER TABLE public.session_feed_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'video' CHECK (post_type IN ('text', 'photo', 'video'));

-- Create comments table for feed posts
CREATE TABLE public.session_feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.session_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.session_feed_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_feed_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.session_feed_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.session_feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.session_feed_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.session_feed_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster comment lookups
CREATE INDEX idx_session_feed_comments_post_id ON public.session_feed_comments(post_id);
CREATE INDEX idx_session_feed_comments_parent_id ON public.session_feed_comments(parent_id);

-- Create storage bucket for feed media (photos/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for feed media
CREATE POLICY "Anyone can view feed media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-media');

CREATE POLICY "Authenticated users can upload feed media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feed-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feed media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'feed-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own feed media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feed-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_feed_comments;