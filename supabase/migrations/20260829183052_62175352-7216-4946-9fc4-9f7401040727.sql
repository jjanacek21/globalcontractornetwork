ALTER TABLE public.equipment_orders
  ADD COLUMN IF NOT EXISTS is_member_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_discount_cents integer NOT NULL DEFAULT 0;