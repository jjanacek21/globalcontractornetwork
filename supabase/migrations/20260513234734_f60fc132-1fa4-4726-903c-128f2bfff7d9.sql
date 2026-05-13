
-- Public read access to the 5 seeded demo properties (id prefix a0000001-)
CREATE POLICY "Public can read demo piq_properties"
  ON public.piq_properties FOR SELECT
  TO anon, authenticated
  USING (id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_property_scores"
  ON public.piq_property_scores FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_storm_events"
  ON public.piq_storm_events FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_permits"
  ON public.piq_permits FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_property_ownership"
  ON public.piq_property_ownership FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_property_sales"
  ON public.piq_property_sales FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_building_components"
  ON public.piq_building_components FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

CREATE POLICY "Public can read demo piq_contractor_opportunities"
  ON public.piq_contractor_opportunities FOR SELECT
  TO anon, authenticated
  USING (property_id::text LIKE 'a0000001-%');

-- Owners linked to demo properties
CREATE POLICY "Public can read demo piq_owners"
  ON public.piq_owners FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.piq_property_ownership po
      WHERE po.owner_id = piq_owners.id
        AND po.property_id::text LIKE 'a0000001-%'
    )
  );
