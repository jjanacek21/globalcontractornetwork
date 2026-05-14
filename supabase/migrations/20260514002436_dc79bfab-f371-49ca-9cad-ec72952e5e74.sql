
ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS landing_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS landing_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_headline text,
  ADD COLUMN IF NOT EXISTS landing_subheadline text,
  ADD COLUMN IF NOT EXISTS landing_about text,
  ADD COLUMN IF NOT EXISTS landing_cta_label text DEFAULT 'Request a Quote',
  ADD COLUMN IF NOT EXISTS landing_theme text DEFAULT 'forest',
  ADD COLUMN IF NOT EXISTS landing_hero_image_url text,
  ADD COLUMN IF NOT EXISTS landing_published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_landing_slug
  ON public.contractor_profiles (landing_slug)
  WHERE landing_enabled = true;

-- Public read of published landing pages (only the columns are exposed; full row is OK because contractor profiles are already public-ish)
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.contractor_profiles;
CREATE POLICY "Public can view published landing pages"
  ON public.contractor_profiles
  FOR SELECT
  USING (landing_enabled = true);

-- Owner can update their own row (idempotent)
DROP POLICY IF EXISTS "Contractor can update own landing page" ON public.contractor_profiles;
CREATE POLICY "Contractor can update own landing page"
  ON public.contractor_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
