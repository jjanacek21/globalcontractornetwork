-- Add source_notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'product_approvals' 
                 AND column_name = 'source_notes') THEN
    ALTER TABLE public.product_approvals ADD COLUMN source_notes TEXT;
  END IF;
END $$;

-- Add last_source_attempt column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'product_approvals' 
                 AND column_name = 'last_source_attempt') THEN
    ALTER TABLE public.product_approvals ADD COLUMN last_source_attempt TIMESTAMPTZ;
  END IF;
END $$;

-- Clean up stuck training books
UPDATE public.permit_training_books
SET 
  processing_status = 'failed',
  processing_error = 'Auto-cleanup: Processing timed out. Please try again.',
  processed_at = NOW()
WHERE processing_status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Clean up stuck permit packet training samples
UPDATE public.permit_packet_training
SET 
  processing_status = 'failed',
  admin_notes = COALESCE(admin_notes, '') || ' [Auto-cleanup: timeout]',
  processed_at = NOW()
WHERE processing_status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Update any 'not_found' status to 'needs_manual_upload' for clarity
UPDATE public.product_approvals
SET 
  source_status = 'needs_manual_upload',
  source_notes = COALESCE(source_notes, 'PDF not found via auto-sourcing. Please upload manually.')
WHERE source_status = 'not_found'
  AND file_url IS NULL;