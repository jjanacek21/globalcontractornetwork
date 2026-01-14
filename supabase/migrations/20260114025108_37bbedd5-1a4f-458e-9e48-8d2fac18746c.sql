
-- =============================================
-- GAMIFICATION SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. BADGES TABLE (Badge Definitions)
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('referral', 'quality', 'team', 'hidden', 'special', 'streak', 'training')),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('count', 'percentage', 'manual', 'special')),
  criteria_value INTEGER DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USER GAMIFICATION TABLE (User-level gamification state)
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  current_level TEXT DEFAULT 'new_contractor' CHECK (current_level IN ('new_contractor', 'rising_star', 'network_pro', 'master_referrer', 'legend')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  last_streak_action_at TIMESTAMPTZ,
  monthly_points INTEGER DEFAULT 0,
  monthly_referrals INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. USER BADGES TABLE (Earned badges)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  displayed BOOLEAN DEFAULT true,
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

-- 4. COMPANY GAMIFICATION TABLE
CREATE TABLE public.company_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_referrals INTEGER DEFAULT 0,
  monthly_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  rank_overall INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TEAM GAMIFICATION TABLE
CREATE TABLE public.team_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  monthly_referrals INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  rank_in_company INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CHALLENGES TABLE
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'team', 'company')),
  target_metric TEXT NOT NULL CHECK (target_metric IN ('referrals', 'conversions', 'photos', 'verifications', 'logins', 'points')),
  target_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_reward_id UUID REFERENCES public.badges(id),
  bonus_payout_percent NUMERIC(5,2) DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CHALLENGE PARTICIPANTS TABLE
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- 8. REWARDS CATALOG TABLE
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('visibility_boost', 'bonus_payout', 'premium_feature', 'merch', 'marketing_credit', 'priority_support')),
  reward_value TEXT, -- JSON or details about the reward
  quantity_available INTEGER, -- NULL means unlimited
  is_available BOOLEAN DEFAULT true,
  valid_days INTEGER DEFAULT 30, -- How long the reward is valid after redemption
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. REWARD REDEMPTIONS TABLE
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards_catalog(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled'))
);

-- 10. ENHANCE EXISTING POINTS_TRANSACTIONS TABLE
ALTER TABLE public.points_transactions 
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS reference_id UUID,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redeemed BOOLEAN DEFAULT false;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Badges: Everyone can view active badges
CREATE POLICY "Anyone can view active badges"
ON public.badges FOR SELECT
USING (is_active = true AND (is_hidden = false OR EXISTS (
  SELECT 1 FROM public.user_badges ub WHERE ub.badge_id = badges.id AND ub.user_id = auth.uid()
)));

-- Super admins can manage badges (using super_admins table)
CREATE POLICY "Super admins can manage badges"
ON public.badges FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- User Gamification: Users can view and update their own stats
CREATE POLICY "Users can view their own gamification stats"
ON public.user_gamification FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view other users gamification for leaderboards"
ON public.user_gamification FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert user gamification"
ON public.user_gamification FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update user gamification"
ON public.user_gamification FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- User Badges: Users can view all badges, manage display of their own
CREATE POLICY "Anyone can view user badges"
ON public.user_badges FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own badge display"
ON public.user_badges FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert user badges"
ON public.user_badges FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- Company Gamification: Company members can view
CREATE POLICY "Company members can view company gamification"
ON public.company_gamification FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.company_admins ca WHERE ca.company_id = company_gamification.company_id AND ca.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.company_members cm WHERE cm.company_id = company_gamification.company_id AND cm.user_id = auth.uid()
));

CREATE POLICY "Anyone can view company gamification for rankings"
ON public.company_gamification FOR SELECT
TO authenticated
USING (true);

-- Team Gamification: Team members can view
CREATE POLICY "Anyone can view team gamification"
ON public.team_gamification FOR SELECT
TO authenticated
USING (true);

-- Challenges: Everyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
ON public.challenges FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Super admins can manage challenges"
ON public.challenges FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- Challenge Participants: Users can view and manage their participation
CREATE POLICY "Users can view their challenge participation"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR true); -- Allow viewing for leaderboards

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update challenge progress"
ON public.challenge_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- Rewards Catalog: Everyone can view available rewards
CREATE POLICY "Anyone can view available rewards"
ON public.rewards_catalog FOR SELECT
TO authenticated
USING (is_available = true);

CREATE POLICY "Super admins can manage rewards"
ON public.rewards_catalog FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- Reward Redemptions: Users can view and create their own
CREATE POLICY "Users can view their redemptions"
ON public.reward_redemptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can redeem rewards"
ON public.reward_redemptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get user's current level based on points
CREATE OR REPLACE FUNCTION public.calculate_user_level(points INTEGER)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN points >= 15000 THEN 'legend'
    WHEN points >= 5000 THEN 'master_referrer'
    WHEN points >= 2000 THEN 'network_pro'
    WHEN points >= 500 THEN 'rising_star'
    ELSE 'new_contractor'
  END;
$$;

-- Function to get company tier based on referrals
CREATE OR REPLACE FUNCTION public.calculate_company_tier(referrals INTEGER)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN referrals >= 500 THEN 'platinum'
    WHEN referrals >= 200 THEN 'gold'
    WHEN referrals >= 50 THEN 'silver'
    ELSE 'bronze'
  END;
$$;

-- Function to initialize user gamification record
CREATE OR REPLACE FUNCTION public.initialize_user_gamification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create gamification record for new users
DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON auth.users;
CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_gamification();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_gamification_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_company_gamification_updated_at
  BEFORE UPDATE ON public.company_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_team_gamification_updated_at
  BEFORE UPDATE ON public.team_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON public.badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

CREATE TRIGGER update_rewards_catalog_updated_at
  BEFORE UPDATE ON public.rewards_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_updated_at();

-- =============================================
-- SEED INITIAL BADGES
-- =============================================

INSERT INTO public.badges (code, name, description, icon, category, tier, criteria_type, criteria_value, points_awarded, is_hidden) VALUES
-- Referral Milestone Badges
('referral_rookie', 'Referral Rookie', 'Completed your first 5 referrals', '🌟', 'referral', 'bronze', 'count', 5, 100, false),
('network_builder', 'Network Builder', 'Completed 25 referrals - building momentum!', '🔗', 'referral', 'silver', 'count', 25, 250, false),
('network_pro', 'Network Pro', 'Completed 50 referrals - a true professional', '💼', 'referral', 'gold', 'count', 50, 500, false),
('referral_master', 'Referral Master', 'Completed 100 referrals - mastery achieved', '👑', 'referral', 'gold', 'count', 100, 1000, false),
('legend', 'Legend', 'Completed 200+ referrals - legendary status', '🏆', 'referral', 'platinum', 'count', 200, 2000, false),

-- Quality Badges
('verified_elite', 'Verified Elite', 'Full documentation and high rating achieved', '✅', 'quality', 'gold', 'special', 0, 300, false),
('photo_master', 'Photo Master', 'Uploaded 10+ high-quality job photos', '📸', 'quality', 'silver', 'count', 10, 150, false),
('high_converter', 'High Converter', 'Achieved 80%+ referral close rate', '🎯', 'quality', 'gold', 'percentage', 80, 400, false),
('five_star', 'Five Star Pro', 'Maintained 5-star average rating', '⭐', 'quality', 'gold', 'special', 0, 350, false),

-- Streak Badges
('hot_streak_5', 'Hot Streak', '5 consecutive successful referrals', '🔥', 'streak', 'bronze', 'count', 5, 100, false),
('hot_streak_10', 'On Fire', '10 consecutive successful referrals', '🔥', 'streak', 'silver', 'count', 10, 250, false),
('streak_master', 'Streak Master', '25 consecutive successful referrals', '💥', 'streak', 'gold', 'count', 25, 500, false),
('daily_warrior_7', 'Daily Warrior', '7 consecutive days active', '📅', 'streak', 'bronze', 'count', 7, 75, false),
('daily_warrior_30', 'Monthly Devotee', '30 consecutive days active', '📆', 'streak', 'silver', 'count', 30, 200, false),

-- Training Badges
('first_lesson', 'First Lesson', 'Completed your first training module', '📚', 'training', 'bronze', 'count', 1, 50, false),
('scholar', 'Scholar', 'Completed 5 training modules', '🎓', 'training', 'silver', 'count', 5, 150, false),
('academy_graduate', 'Academy Graduate', 'Completed all available training', '🏅', 'training', 'gold', 'special', 0, 500, false),

-- Team Badges
('team_player', 'Team Player', 'Part of a top 3 performing team', '🤝', 'team', 'silver', 'special', 0, 200, false),
('team_champion', 'Team Champion', 'Part of the #1 performing team', '🥇', 'team', 'gold', 'special', 0, 400, false),
('recruiter', 'Recruiter', 'Successfully recruited 3 contractors to your team', '👥', 'team', 'silver', 'count', 3, 300, false),

-- Hidden/Special Badges
('storm_hero', 'Storm Hero', '5+ referrals within 7 days of a major weather event', '⛈️', 'hidden', 'platinum', 'special', 5, 500, true),
('early_bird', 'Early Bird', 'Submitted a referral before 7am', '🌅', 'hidden', 'bronze', 'special', 0, 50, true),
('night_owl', 'Night Owl', 'Submitted a referral after 10pm', '🦉', 'hidden', 'bronze', 'special', 0, 50, true),
('fast_starter', 'Fast Starter', 'First referral within 7 days of joining', '🚀', 'special', 'silver', 'special', 0, 150, false),
('comeback_king', 'Comeback King', 'Returned after 30+ days inactive with a successful referral', '👊', 'hidden', 'silver', 'special', 0, 200, true);

-- =============================================
-- SEED INITIAL REWARDS
-- =============================================

INSERT INTO public.rewards_catalog (name, description, points_cost, reward_type, reward_value, is_available) VALUES
('Profile Visibility Boost', '7 days of featured placement in contractor directory', 500, 'visibility_boost', '{"days": 7, "placement": "featured"}', true),
('Premium Visibility Boost', '30 days of premium placement + homepage feature', 1500, 'visibility_boost', '{"days": 30, "placement": "premium", "homepage": true}', true),
('5% Bonus Payout', 'Extra 5% on your next referral payout', 750, 'bonus_payout', '{"percent": 5, "uses": 1}', true),
('10% Bonus Payout', 'Extra 10% on your next referral payout', 1200, 'bonus_payout', '{"percent": 10, "uses": 1}', true),
('Priority Support', '30 days of priority customer support', 300, 'priority_support', '{"days": 30}', true),
('Marketing Credit $25', '$25 credit toward GCN marketing services', 1000, 'marketing_credit', '{"amount": 25}', true),
('Marketing Credit $100', '$100 credit toward GCN marketing services', 3500, 'marketing_credit', '{"amount": 100}', true),
('CRM Pro Features', '30 days access to premium CRM features', 800, 'premium_feature', '{"feature": "crm_pro", "days": 30}', true),
('Advanced Analytics', '30 days access to advanced analytics dashboard', 600, 'premium_feature', '{"feature": "analytics", "days": 30}', true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_points ON public.user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_monthly_points ON public.user_gamification(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_company_gamification_tier ON public.company_gamification(tier);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
