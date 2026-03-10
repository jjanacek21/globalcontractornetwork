-- Fix RLS policies for roof_measurements to allow access by created_by = auth.uid()
DROP POLICY IF EXISTS "Company members can insert measurements" ON public.roof_measurements;
DROP POLICY IF EXISTS "Company members can view measurements" ON public.roof_measurements;
DROP POLICY IF EXISTS "Company members can update measurements" ON public.roof_measurements;
DROP POLICY IF EXISTS "Company members can delete measurements" ON public.roof_measurements;

-- INSERT: user can insert if created_by = auth.uid()
CREATE POLICY "Users can insert measurements" ON public.roof_measurements
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- SELECT: user can view if created_by = auth.uid() OR company member
CREATE POLICY "Users can view measurements" ON public.roof_measurements
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid() AND cm.is_active = true
    )
  );

-- UPDATE: user can update if created_by = auth.uid() OR company member
CREATE POLICY "Users can update measurements" ON public.roof_measurements
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid() AND cm.is_active = true
    )
  );

-- DELETE: user can delete if created_by = auth.uid() OR company member
CREATE POLICY "Users can delete measurements" ON public.roof_measurements
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid() AND cm.is_active = true
    )
  );