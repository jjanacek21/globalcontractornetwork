-- Create cleanup function for stuck training records
CREATE OR REPLACE FUNCTION public.cleanup_stuck_training_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE permit_packet_training
  SET 
    processing_status = 'failed',
    admin_notes = COALESCE(admin_notes, '') || ' [Auto-cleanup: timeout after 5 min]',
    processed_at = NOW()
  WHERE processing_status = 'processing'
    AND created_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

-- Fix currently stuck records (one-time cleanup)
UPDATE permit_packet_training
SET processing_status = 'failed',
    admin_notes = 'Manual cleanup: Marked as failed after processing timeout',
    processed_at = NOW()
WHERE processing_status = 'processing'
  AND processed_at IS NULL
  AND created_at < NOW() - INTERVAL '5 minutes';

-- Also mark very old pending records as needing retry
UPDATE permit_packet_training
SET admin_notes = COALESCE(admin_notes, '') || ' [Needs retry]'
WHERE processing_status = 'pending'
  AND created_at < NOW() - INTERVAL '30 minutes'
  AND (admin_notes IS NULL OR admin_notes NOT LIKE '%Needs retry%');