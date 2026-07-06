
-- Add media + category fields to equipment_products
ALTER TABLE public.equipment_products
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS long_description text;

-- Equipment-specific categories (separate from generic public.product_categories)
CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.equipment_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_categories TO authenticated;
GRANT ALL ON public.equipment_categories TO service_role;

ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment categories viewable by everyone"
  ON public.equipment_categories FOR SELECT USING (true);

CREATE POLICY "Admins manage equipment categories"
  ON public.equipment_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER equipment_categories_updated_at
  BEFORE UPDATE ON public.equipment_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.equipment_products
  ADD CONSTRAINT equipment_products_category_fkey
  FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id) ON DELETE SET NULL;

-- Storage RLS: admins can manage equipment-media, everyone can read
CREATE POLICY "Equipment media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-media');

CREATE POLICY "Equipment media admin write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'equipment-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Equipment media admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'equipment-media' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Equipment media admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'equipment-media' AND public.has_role(auth.uid(), 'admin'::app_role));
