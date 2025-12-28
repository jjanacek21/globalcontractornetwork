-- Enhance contractor_profiles with social fields
ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bio_short TEXT,
ADD COLUMN IF NOT EXISTS bio_long TEXT,
ADD COLUMN IF NOT EXISTS secondary_trades TEXT[],
ADD COLUMN IF NOT EXISTS service_areas JSONB,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_state TEXT,
ADD COLUMN IF NOT EXISTS license_expiration DATE,
ADD COLUMN IF NOT EXISTS insurance_info JSONB,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS social_access_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS social_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS social_approved_by UUID;

-- Create social_posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  visibility TEXT DEFAULT 'public_to_contractors' CHECK (visibility IN ('public_to_contractors', 'trade_only', 'followers_only')),
  trade_tags TEXT[],
  location_tags TEXT[],
  reply_to_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  is_repost BOOLEAN DEFAULT false,
  original_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_post_media table
CREATE TABLE public.social_post_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'file')),
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_post_likes table
CREATE TABLE public.social_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create social_post_comments table
CREATE TABLE public.social_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  reply_to_comment_id UUID REFERENCES public.social_post_comments(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_follows table
CREATE TABLE public.social_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create social_conversations table
CREATE TABLE public.social_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group BOOLEAN DEFAULT false,
  name TEXT,
  created_by UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_conversation_members table
CREATE TABLE public.social_conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.social_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create social_messages table
CREATE TABLE public.social_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.social_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  content_text TEXT,
  is_deleted BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

-- Create social_message_attachments table
CREATE TABLE public.social_message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.social_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_notifications table
CREATE TABLE public.social_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_follower', 'post_like', 'post_comment', 'post_repost', 'new_message', 'mention')),
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create social_reports table
CREATE TABLE public.social_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  reported_comment_id UUID REFERENCES public.social_post_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_social_posts_author ON public.social_posts(author_id);
CREATE INDEX idx_social_posts_created ON public.social_posts(created_at DESC);
CREATE INDEX idx_social_posts_trade_tags ON public.social_posts USING GIN(trade_tags);
CREATE INDEX idx_social_post_likes_post ON public.social_post_likes(post_id);
CREATE INDEX idx_social_post_likes_user ON public.social_post_likes(user_id);
CREATE INDEX idx_social_post_comments_post ON public.social_post_comments(post_id);
CREATE INDEX idx_social_follows_follower ON public.social_follows(follower_id);
CREATE INDEX idx_social_follows_following ON public.social_follows(following_id);
CREATE INDEX idx_social_messages_conversation ON public.social_messages(conversation_id);
CREATE INDEX idx_social_notifications_user ON public.social_notifications(user_id);
CREATE INDEX idx_social_notifications_unread ON public.social_notifications(user_id) WHERE is_read = false;

-- Enable RLS on all tables
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

-- Function to check if user has social access
CREATE OR REPLACE FUNCTION public.has_social_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contractor_profiles
    WHERE user_id = auth.uid()
    AND verification_status = 'approved'
    AND social_access_approved = true
  )
$$;

-- Function to get current contractor profile id
CREATE OR REPLACE FUNCTION public.get_contractor_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.contractor_profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- RLS Policies for social_posts
CREATE POLICY "Approved contractors can view posts" ON public.social_posts
FOR SELECT USING (has_social_access() OR is_super_admin());

CREATE POLICY "Approved contractors can create posts" ON public.social_posts
FOR INSERT WITH CHECK (has_social_access() AND author_id = get_contractor_profile_id());

CREATE POLICY "Authors can update their posts" ON public.social_posts
FOR UPDATE USING (author_id = get_contractor_profile_id());

CREATE POLICY "Authors can delete their posts" ON public.social_posts
FOR DELETE USING (author_id = get_contractor_profile_id() OR is_super_admin());

-- RLS Policies for social_post_media
CREATE POLICY "Approved contractors can view post media" ON public.social_post_media
FOR SELECT USING (has_social_access() OR is_super_admin());

CREATE POLICY "Approved contractors can add post media" ON public.social_post_media
FOR INSERT WITH CHECK (has_social_access());

CREATE POLICY "Super admins can delete post media" ON public.social_post_media
FOR DELETE USING (is_super_admin());

-- RLS Policies for social_post_likes
CREATE POLICY "Approved contractors can view likes" ON public.social_post_likes
FOR SELECT USING (has_social_access() OR is_super_admin());

CREATE POLICY "Approved contractors can like posts" ON public.social_post_likes
FOR INSERT WITH CHECK (has_social_access() AND user_id = get_contractor_profile_id());

CREATE POLICY "Users can unlike their likes" ON public.social_post_likes
FOR DELETE USING (user_id = get_contractor_profile_id());

-- RLS Policies for social_post_comments
CREATE POLICY "Approved contractors can view comments" ON public.social_post_comments
FOR SELECT USING (has_social_access() OR is_super_admin());

CREATE POLICY "Approved contractors can create comments" ON public.social_post_comments
FOR INSERT WITH CHECK (has_social_access() AND author_id = get_contractor_profile_id());

CREATE POLICY "Authors can update their comments" ON public.social_post_comments
FOR UPDATE USING (author_id = get_contractor_profile_id());

CREATE POLICY "Authors can delete their comments" ON public.social_post_comments
FOR DELETE USING (author_id = get_contractor_profile_id() OR is_super_admin());

-- RLS Policies for social_follows
CREATE POLICY "Approved contractors can view follows" ON public.social_follows
FOR SELECT USING (has_social_access() OR is_super_admin());

CREATE POLICY "Approved contractors can follow" ON public.social_follows
FOR INSERT WITH CHECK (has_social_access() AND follower_id = get_contractor_profile_id());

CREATE POLICY "Users can unfollow" ON public.social_follows
FOR DELETE USING (follower_id = get_contractor_profile_id());

-- RLS Policies for social_conversations
CREATE POLICY "Members can view their conversations" ON public.social_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_conversation_members
    WHERE conversation_id = social_conversations.id
    AND user_id = get_contractor_profile_id()
  ) OR is_super_admin()
);

CREATE POLICY "Approved contractors can create conversations" ON public.social_conversations
FOR INSERT WITH CHECK (has_social_access() AND created_by = get_contractor_profile_id());

CREATE POLICY "Conversation creators can update" ON public.social_conversations
FOR UPDATE USING (created_by = get_contractor_profile_id());

-- RLS Policies for social_conversation_members
CREATE POLICY "Members can view conversation members" ON public.social_conversation_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_conversation_members scm
    WHERE scm.conversation_id = social_conversation_members.conversation_id
    AND scm.user_id = get_contractor_profile_id()
  ) OR is_super_admin()
);

CREATE POLICY "Approved contractors can add members" ON public.social_conversation_members
FOR INSERT WITH CHECK (has_social_access());

CREATE POLICY "Members can leave conversations" ON public.social_conversation_members
FOR DELETE USING (user_id = get_contractor_profile_id());

-- RLS Policies for social_messages
CREATE POLICY "Members can view conversation messages" ON public.social_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_conversation_members
    WHERE conversation_id = social_messages.conversation_id
    AND user_id = get_contractor_profile_id()
  ) OR is_super_admin()
);

CREATE POLICY "Members can send messages" ON public.social_messages
FOR INSERT WITH CHECK (
  has_social_access() 
  AND sender_id = get_contractor_profile_id()
  AND EXISTS (
    SELECT 1 FROM public.social_conversation_members
    WHERE conversation_id = social_messages.conversation_id
    AND user_id = get_contractor_profile_id()
  )
);

CREATE POLICY "Senders can edit their messages" ON public.social_messages
FOR UPDATE USING (sender_id = get_contractor_profile_id());

-- RLS Policies for social_message_attachments
CREATE POLICY "Members can view message attachments" ON public.social_message_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.social_messages m
    JOIN public.social_conversation_members cm ON m.conversation_id = cm.conversation_id
    WHERE m.id = social_message_attachments.message_id
    AND cm.user_id = get_contractor_profile_id()
  ) OR is_super_admin()
);

CREATE POLICY "Members can add attachments" ON public.social_message_attachments
FOR INSERT WITH CHECK (has_social_access());

-- RLS Policies for social_notifications
CREATE POLICY "Users can view their notifications" ON public.social_notifications
FOR SELECT USING (user_id = get_contractor_profile_id() OR is_super_admin());

CREATE POLICY "System can create notifications" ON public.social_notifications
FOR INSERT WITH CHECK (has_social_access());

CREATE POLICY "Users can update their notifications" ON public.social_notifications
FOR UPDATE USING (user_id = get_contractor_profile_id());

CREATE POLICY "Users can delete their notifications" ON public.social_notifications
FOR DELETE USING (user_id = get_contractor_profile_id() OR is_super_admin());

-- RLS Policies for social_reports
CREATE POLICY "Super admins can view all reports" ON public.social_reports
FOR SELECT USING (is_super_admin());

CREATE POLICY "Approved contractors can create reports" ON public.social_reports
FOR INSERT WITH CHECK (has_social_access() AND reporter_id = get_contractor_profile_id());

CREATE POLICY "Super admins can update reports" ON public.social_reports
FOR UPDATE USING (is_super_admin());

-- Create storage bucket for social media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media', 
  'social-media', 
  true, 
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for social-media bucket
CREATE POLICY "Approved contractors can upload social media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'social-media' AND has_social_access());

CREATE POLICY "Anyone can view social media" ON storage.objects
FOR SELECT USING (bucket_id = 'social-media');

CREATE POLICY "Users can delete their uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'social-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;

-- Trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.social_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.social_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Trigger to update post like_count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.social_post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_like_count();

-- Trigger to update post comment_count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.social_post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comment_count();