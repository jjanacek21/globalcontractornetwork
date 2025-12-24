-- =============================================
-- FIX 1: Notes Table RLS - Restrict Access Based on Parent Entity
-- =============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.notes;

-- Create secure policy that verifies access to parent entity
CREATE POLICY "Users can view notes for authorized entities"
ON public.notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Super admins can view all notes
    is_super_admin()
    -- Authors can always see their own notes
    OR author_user_id = auth.uid()
    -- Contact notes: check company membership
    OR (
      entity_type = 'contact' AND EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.id = notes.entity_id
        AND (is_company_member(c.company_id) OR is_super_admin())
      )
    )
    -- Lead notes: check company membership
    OR (
      entity_type = 'lead' AND EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = notes.entity_id
        AND (is_company_member(l.company_id) OR is_super_admin())
      )
    )
    -- Property notes: check company membership
    OR (
      entity_type = 'property' AND EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = notes.entity_id
        AND (is_company_member(p.company_id) OR is_super_admin())
      )
    )
    -- Customer notes: check company membership or assignment
    OR (
      entity_type = 'customer' AND EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = notes.entity_id
        AND (is_company_member(c.company_id) OR c.assigned_rep_id = auth.uid() OR is_super_admin())
      )
    )
  )
);

-- =============================================
-- FIX 2: Customer Documents Storage - Verify Customer Access Before Upload
-- =============================================

-- Drop the insecure upload policy
DROP POLICY IF EXISTS "Users can upload documents for accessible customers" ON storage.objects;

-- Create secure policy that verifies customer access
-- File path format must be: {customer_id}/{filename}
CREATE POLICY "Users can upload documents for accessible customers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-documents' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR c.assigned_rep_id = auth.uid()
      OR public.is_company_member(c.company_id)
      OR public.is_super_admin()
    )
  )
);