-- Add tracking columns to permit_packet_training for learning metrics
ALTER TABLE permit_packet_training
  ADD COLUMN IF NOT EXISTS products_extracted integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mappings_learned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rules_discovered integer DEFAULT 0;

-- Reset any stuck processing records to failed
UPDATE permit_packet_training
SET 
  processing_status = 'failed',
  admin_notes = COALESCE(admin_notes, '') || ' [Cleanup: stuck in processing - reset for retry with fixed analyzer]',
  processed_at = NOW()
WHERE processing_status = 'processing'
  AND created_at < NOW() - INTERVAL '5 minutes';

-- Also reset "analyzed" status to "completed" for consistency
UPDATE permit_packet_training
SET processing_status = 'completed'
WHERE processing_status = 'analyzed';