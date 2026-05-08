
-- IQ_TRADES
CREATE TABLE public.iq_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  icon_name text NOT NULL DEFAULT 'wrench',
  description text,
  measurement_method text NOT NULL CHECK (measurement_method IN ('satellite','photo_ai','manual_input','count_based','room_based')),
  property_types text[] NOT NULL DEFAULT ARRAY['residential']::text[],
  licensed_entity_name text,
  licensed_entity_number text,
  requires_followup_call boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.iq_trade_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.iq_trades(id) ON DELETE CASCADE,
  step_number int NOT NULL DEFAULT 1,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('single_select','multi_select','number','text','photo_upload')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT true,
  help_text text,
  conditional_logic jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_iq_trade_questions_trade ON public.iq_trade_questions(trade_id, step_number);

CREATE TABLE public.iq_trade_pricing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.iq_trades(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  tier_order int NOT NULL DEFAULT 0,
  base_price_per_unit numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'sqft',
  inclusions text[] NOT NULL DEFAULT ARRAY[]::text[],
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_iq_trade_pricing_trade ON public.iq_trade_pricing_options(trade_id, tier_order);

CREATE TABLE public.iq_trade_ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.iq_trades(id) ON DELETE CASCADE,
  prompt_type text NOT NULL CHECK (prompt_type IN ('condition_analysis','measurement_extraction','scope_generation')),
  system_prompt text NOT NULL,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trade_id, prompt_type)
);

CREATE TABLE public.iq_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trade_id uuid NOT NULL REFERENCES public.iq_trades(id),
  property_address text,
  property_lat numeric,
  property_lng numeric,
  property_type text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  ai_analysis jsonb,
  measurements jsonb,
  estimate_low numeric,
  estimate_mid numeric,
  estimate_high numeric,
  selected_tier text,
  selected_upgrades jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','contacted','won','lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_iq_quote_requests_user ON public.iq_quote_requests(user_id);
CREATE INDEX idx_iq_quote_requests_trade ON public.iq_quote_requests(trade_id);

CREATE TRIGGER trg_iq_trades_updated_at BEFORE UPDATE ON public.iq_trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iq_trade_questions_updated_at BEFORE UPDATE ON public.iq_trade_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iq_trade_pricing_updated_at BEFORE UPDATE ON public.iq_trade_pricing_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iq_trade_ai_prompts_updated_at BEFORE UPDATE ON public.iq_trade_ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iq_quote_requests_updated_at BEFORE UPDATE ON public.iq_quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.iq_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iq_trade_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iq_trade_pricing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iq_trade_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iq_quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iq_trades public read" ON public.iq_trades FOR SELECT USING (true);
CREATE POLICY "iq_trades admin write" ON public.iq_trades FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "iq_trade_questions public read" ON public.iq_trade_questions FOR SELECT USING (true);
CREATE POLICY "iq_trade_questions admin write" ON public.iq_trade_questions FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "iq_trade_pricing public read" ON public.iq_trade_pricing_options FOR SELECT USING (true);
CREATE POLICY "iq_trade_pricing admin write" ON public.iq_trade_pricing_options FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "iq_trade_ai_prompts public read" ON public.iq_trade_ai_prompts FOR SELECT USING (true);
CREATE POLICY "iq_trade_ai_prompts admin write" ON public.iq_trade_ai_prompts FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "iq_quote_requests owner select" ON public.iq_quote_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "iq_quote_requests owner insert" ON public.iq_quote_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "iq_quote_requests owner update" ON public.iq_quote_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "iq_quote_requests owner delete" ON public.iq_quote_requests FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "iq_quote_requests admin read" ON public.iq_quote_requests FOR SELECT USING (public.is_super_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos','quote-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "quote-photos auth read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'quote-photos');
CREATE POLICY "quote-photos owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "quote-photos owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "quote-photos owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
