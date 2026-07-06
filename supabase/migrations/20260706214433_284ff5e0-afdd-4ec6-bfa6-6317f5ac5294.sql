
DROP VIEW IF EXISTS public.equipment_products_public;
CREATE VIEW public.equipment_products_public AS
SELECT id, slug, name, type, bto, cross_ref, specs, blurb,
       price_cents, compare_cents, active, sort_order,
       created_at, updated_at,
       category_id, image_url, gallery, video_url, long_description
FROM public.equipment_products
WHERE active = true;
GRANT SELECT ON public.equipment_products_public TO anon, authenticated;
