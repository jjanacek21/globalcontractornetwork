-- 1) Table
CREATE TABLE public.permit_form_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_dept_id uuid NOT NULL REFERENCES public.permit_building_departments(id) ON DELETE CASCADE,
  permit_type text NOT NULL CHECK (permit_type IN ('roofing','windows','hvac','electrical','plumbing','general')),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_template_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  priority int NOT NULL DEFAULT 100,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pfr_dept_type ON public.permit_form_requirements(building_dept_id, permit_type);
CREATE INDEX idx_pfr_conditions ON public.permit_form_requirements USING gin (conditions);

-- 2) RLS
ALTER TABLE public.permit_form_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read form requirements"
ON public.permit_form_requirements FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Permit admins can insert form requirements"
ON public.permit_form_requirements FOR INSERT
TO authenticated WITH CHECK (public.is_permit_admin() OR public.is_super_admin());

CREATE POLICY "Permit admins can update form requirements"
ON public.permit_form_requirements FOR UPDATE
TO authenticated USING (public.is_permit_admin() OR public.is_super_admin())
WITH CHECK (public.is_permit_admin() OR public.is_super_admin());

CREATE POLICY "Permit admins can delete form requirements"
ON public.permit_form_requirements FOR DELETE
TO authenticated USING (public.is_permit_admin() OR public.is_super_admin());

-- 3) updated_at trigger
CREATE TRIGGER trg_pfr_updated_at
BEFORE UPDATE ON public.permit_form_requirements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Seed: Palm Beach County (unincorporated) - 6481720e-b013-4343-a9b8-43b4a6742312
-- Post-1994 full reroof: Expedited form only
INSERT INTO public.permit_form_requirements (building_dept_id, permit_type, conditions, required_template_ids, priority, notes) VALUES
('6481720e-b013-4343-a9b8-43b4a6742312','roofing',
 '{"year_built_gte": 1994, "roof_work_type": "reroof_full"}'::jsonb,
 ARRAY['5b6b1384-f18a-4968-85da-c1681590f8f7']::uuid[],
 10, 'PB unincorp post-1994 full reroof: Expedited Reroof Form'),

-- Pre-1994 reroof
('6481720e-b013-4343-a9b8-43b4a6742312','roofing',
 '{"year_built_lte": 1993, "roof_work_type": "reroof_full"}'::jsonb,
 ARRAY['06b2d27b-3750-41fa-824d-6390f65baa84','29720c6d-c5c4-4d0f-adb4-69d28550d1b9','0b65b5ae-39e9-4730-a538-ee6e35c08eef']::uuid[],
 20, 'PB unincorp pre-1994 reroof: Form 100 + Mandated Retrofits RTW + Underlayment Options'),

-- Partial reroof (any year)
('6481720e-b013-4343-a9b8-43b4a6742312','roofing',
 '{"roof_work_type": "reroof_partial"}'::jsonb,
 ARRAY['06b2d27b-3750-41fa-824d-6390f65baa84','29720c6d-c5c4-4d0f-adb4-69d28550d1b9','0b65b5ae-39e9-4730-a538-ee6e35c08eef']::uuid[],
 20, 'PB unincorp partial reroof: Form 100 + Mandated Retrofits RTW + Underlayment Options'),

-- Miami-Dade County unincorporated - 9032f49a-2c87-4fc4-bc86-ae864b79936c
-- HVHZ reroof (post-1994 baseline)
('9032f49a-2c87-4fc4-bc86-ae864b79936c','roofing',
 '{"is_hvhz": true, "year_built_gte": 1994}'::jsonb,
 ARRAY[
   '5219251d-424a-4469-b413-b6a448691e3e',
   '00c476a4-1f22-414b-81b0-a740dcff2205',
   '6661923b-ea8e-44ee-a615-2c7602451952',
   '09b80021-a902-4abb-a66b-941a517cfb98',
   '72ffdd81-3fc4-401f-b01d-46a966c0bc17',
   '1024444a-5886-4e8f-a6a8-06d49f7585ae'
 ]::uuid[],
 10, 'Miami-Dade HVHZ post-1994 reroof full packet'),

-- HVHZ reroof pre-1994 (Section 1524 doc not yet in templates - same packet for now)
('9032f49a-2c87-4fc4-bc86-ae864b79936c','roofing',
 '{"is_hvhz": true, "year_built_lte": 1993}'::jsonb,
 ARRAY[
   '5219251d-424a-4469-b413-b6a448691e3e',
   '00c476a4-1f22-414b-81b0-a740dcff2205',
   '6661923b-ea8e-44ee-a615-2c7602451952',
   '09b80021-a902-4abb-a66b-941a517cfb98',
   '72ffdd81-3fc4-401f-b01d-46a966c0bc17',
   '1024444a-5886-4e8f-a6a8-06d49f7585ae'
 ]::uuid[],
 15, 'Miami-Dade HVHZ pre-1994 reroof - Section 1524 mandated retrofits doc TBD when uploaded'),

-- Broward County unincorporated - f0ed85aa-9abd-4070-97de-ad80d33b7c08
('f0ed85aa-9abd-4070-97de-ad80d33b7c08','roofing',
 '{"roof_work_type": "reroof_full"}'::jsonb,
 ARRAY[
   '7948c562-1c22-40d0-9cb4-790bc360888c',
   '2548343f-0a14-4d2c-b9ce-10e125a405ac',
   '45d45b07-1994-452d-a858-b361b1ee79f1',
   '0b2c6fc0-0f4d-4d68-bec0-e40b2832971d',
   '31516d8b-7e66-4e90-abba-9a14c79ec83d',
   '79790d6c-4c8e-4d7b-ad57-18a39f7a499a'
 ]::uuid[],
 10, 'Broward unincorp full reroof packet'),

-- Broward Owner-Builder add-on
('f0ed85aa-9abd-4070-97de-ad80d33b7c08','roofing',
 '{"owner_builder": true}'::jsonb,
 ARRAY['34d423df-66c5-4d88-ab77-65680b7fe2ea']::uuid[],
 5, 'Broward unincorp owner-builder add-on');

-- Broward cities - same Broward Uniform + HVHZ affidavit packet
INSERT INTO public.permit_form_requirements (building_dept_id, permit_type, conditions, required_template_ids, priority, notes)
SELECT dept_id, 'roofing'::text,
  '{"roof_work_type": "reroof_full"}'::jsonb,
  ARRAY[
    '7948c562-1c22-40d0-9cb4-790bc360888c',
    '2548343f-0a14-4d2c-b9ce-10e125a405ac',
    '45d45b07-1994-452d-a858-b361b1ee79f1',
    '0b2c6fc0-0f4d-4d68-bec0-e40b2832971d',
    '31516d8b-7e66-4e90-abba-9a14c79ec83d',
    '79790d6c-4c8e-4d7b-ad57-18a39f7a499a'
  ]::uuid[],
  10,
  'Broward city full reroof - shared HVHZ packet'
FROM (VALUES
  ('e88e60aa-6998-4feb-ae87-5cf3c15855ff'::uuid),
  ('06b96011-f317-4766-bdef-3a4be27ef42f'::uuid),
  ('895f6f58-3cd8-4ded-b7c7-8b32effd70d6'::uuid),
  ('f5c56fe7-d376-45d3-974a-c8a34274c841'::uuid),
  ('aa4adf4b-12b7-45d9-bf19-0117f01bbaf9'::uuid),
  ('335d7f43-43a8-4c55-a721-740d0f8cccd6'::uuid),
  ('9f33d10f-90c7-4d25-8d9d-6652b98d496a'::uuid)
) AS t(dept_id);