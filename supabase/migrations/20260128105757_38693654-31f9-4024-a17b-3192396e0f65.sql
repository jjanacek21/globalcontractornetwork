-- Part 4: Create cleanup function for stuck training books
CREATE OR REPLACE FUNCTION public.cleanup_stuck_training_books()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE permit_training_books 
  SET 
    processing_status = 'pending',
    processing_error = 'Auto-cleanup: Processing timed out. Click Process Now to retry.',
    updated_at = NOW()
  WHERE processing_status IN ('processing', 'failed')
  AND (updated_at < NOW() - INTERVAL '10 minutes' OR processing_error IS NOT NULL);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_training_books() TO authenticated;

-- Also create similar cleanup for stuck form templates
CREATE OR REPLACE FUNCTION public.cleanup_stuck_form_templates()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE permit_form_templates 
  SET 
    analysis_status = 'pending',
    updated_at = NOW()
  WHERE analysis_status = 'analyzing'
  AND (updated_at < NOW() - INTERVAL '10 minutes');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_stuck_form_templates() TO authenticated;