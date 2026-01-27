-- Clean up stuck training books
UPDATE permit_training_books 
SET 
  processing_status = 'failed',
  processing_error = 'Auto-cleanup: Processing timed out. Click Process Now to retry.',
  processed_at = NOW()
WHERE processing_status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Clean up stuck training samples  
UPDATE permit_packet_training
SET 
  processing_status = 'failed',
  admin_notes = COALESCE(admin_notes, '') || ' [Auto-cleanup: Processing timed out]',
  processed_at = NOW()
WHERE processing_status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Reset the specific failed training books to allow retry
UPDATE permit_training_books
SET 
  processing_status = 'pending',
  processing_error = NULL
WHERE processing_status = 'failed'
  AND processing_error LIKE '%404%';

-- Create a function to cleanup stuck training books
CREATE OR REPLACE FUNCTION public.cleanup_stuck_training_books()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected_count integer;
BEGIN
  UPDATE permit_training_books
  SET 
    processing_status = 'failed',
    processing_error = 'Auto-cleanup: Processing timed out after 10 minutes',
    processed_at = NOW()
  WHERE processing_status = 'processing'
    AND created_at < NOW() - INTERVAL '10 minutes';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$function$;