ALTER TABLE public.permit_packets ADD COLUMN IF NOT EXISTS source_hash text;
CREATE INDEX IF NOT EXISTS idx_permit_packets_source_hash ON public.permit_packets(permit_request_id, source_hash);