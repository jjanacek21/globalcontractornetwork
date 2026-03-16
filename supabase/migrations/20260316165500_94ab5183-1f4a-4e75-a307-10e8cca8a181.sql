
CREATE TABLE public.piq_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_name TEXT NOT NULL,
  api_description TEXT,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.piq_api_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API configs"
ON public.piq_api_configs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_piq_api_configs_updated_at
  BEFORE UPDATE ON public.piq_api_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
