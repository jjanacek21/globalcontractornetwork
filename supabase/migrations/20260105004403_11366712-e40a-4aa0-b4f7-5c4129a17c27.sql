-- =============================================
-- HOMEOWNER-CONTRACTOR MESSAGING SYSTEM
-- =============================================

-- Conversations between homeowners and contractors
CREATE TABLE public.homeowner_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL,
  contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  homeowner_unread_count INTEGER DEFAULT 0,
  contractor_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(homeowner_id, contractor_id)
);

-- Individual messages in conversations
CREATE TABLE public.homeowner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.homeowner_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('homeowner', 'contractor')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAVORITE CONTRACTORS
-- =============================================

CREATE TABLE public.favorite_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contractor_id)
);

-- =============================================
-- HOMEOWNER REFERRAL INVITATIONS
-- =============================================

CREATE TABLE public.homeowner_referral_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID,
  homeowner_email TEXT,
  referring_contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE NOT NULL,
  recommended_contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL,
  property_address TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  project_id UUID REFERENCES public.homeowner_projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENHANCE CONTRACTOR REVIEWS FOR HOMEOWNER LINKING
-- =============================================

ALTER TABLE public.contractor_reviews 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.homeowner_projects(id);

-- =============================================
-- ENABLE REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_referral_invitations;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.homeowner_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowner_referral_invitations ENABLE ROW LEVEL SECURITY;

-- Homeowner Conversations Policies
CREATE POLICY "Users can view their own conversations"
ON public.homeowner_conversations FOR SELECT
USING (auth.uid() = homeowner_id OR auth.uid() IN (
  SELECT user_id FROM public.contractor_profiles WHERE id = contractor_id
));

CREATE POLICY "Users can create conversations"
ON public.homeowner_conversations FOR INSERT
WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Users can update their conversations"
ON public.homeowner_conversations FOR UPDATE
USING (auth.uid() = homeowner_id OR auth.uid() IN (
  SELECT user_id FROM public.contractor_profiles WHERE id = contractor_id
));

-- Homeowner Messages Policies
CREATE POLICY "Users can view messages in their conversations"
ON public.homeowner_messages FOR SELECT
USING (conversation_id IN (
  SELECT id FROM public.homeowner_conversations 
  WHERE homeowner_id = auth.uid() OR contractor_id IN (
    SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can send messages in their conversations"
ON public.homeowner_messages FOR INSERT
WITH CHECK (conversation_id IN (
  SELECT id FROM public.homeowner_conversations 
  WHERE homeowner_id = auth.uid() OR contractor_id IN (
    SELECT id FROM public.contractor_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can update their own messages"
ON public.homeowner_messages FOR UPDATE
USING (sender_id = auth.uid());

-- Favorite Contractors Policies
CREATE POLICY "Users can view their own favorites"
ON public.favorite_contractors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorite_contractors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
ON public.favorite_contractors FOR DELETE
USING (auth.uid() = user_id);

-- Homeowner Referral Invitations Policies
CREATE POLICY "Homeowners can view their invitations"
ON public.homeowner_referral_invitations FOR SELECT
USING (auth.uid() = homeowner_id OR auth.uid() IN (
  SELECT user_id FROM public.contractor_profiles 
  WHERE id = referring_contractor_id OR id = recommended_contractor_id
));

CREATE POLICY "Contractors can create invitations"
ON public.homeowner_referral_invitations FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.contractor_profiles WHERE id = referring_contractor_id
));

CREATE POLICY "Homeowners can update their invitations"
ON public.homeowner_referral_invitations FOR UPDATE
USING (auth.uid() = homeowner_id);

-- Update contractor_reviews policy for authenticated users
CREATE POLICY "Authenticated users can insert reviews"
ON public.contractor_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_homeowner_conversations_homeowner ON public.homeowner_conversations(homeowner_id);
CREATE INDEX idx_homeowner_conversations_contractor ON public.homeowner_conversations(contractor_id);
CREATE INDEX idx_homeowner_messages_conversation ON public.homeowner_messages(conversation_id);
CREATE INDEX idx_homeowner_messages_created ON public.homeowner_messages(created_at DESC);
CREATE INDEX idx_favorite_contractors_user ON public.favorite_contractors(user_id);
CREATE INDEX idx_referral_invitations_homeowner ON public.homeowner_referral_invitations(homeowner_id);
CREATE INDEX idx_referral_invitations_status ON public.homeowner_referral_invitations(status);