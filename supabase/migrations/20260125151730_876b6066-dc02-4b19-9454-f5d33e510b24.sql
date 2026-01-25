-- Create batch processing table
CREATE TABLE IF NOT EXISTS public.permit_training_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.permit_training_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for batch processing (admin-only access)
CREATE POLICY "Admins can manage batches" ON public.permit_training_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add new columns to permit_packet_training if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permit_packet_training' AND column_name = 'batch_id') THEN
    ALTER TABLE public.permit_packet_training ADD COLUMN batch_id UUID REFERENCES public.permit_training_batches(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permit_packet_training' AND column_name = 'detection_confidence') THEN
    ALTER TABLE public.permit_packet_training ADD COLUMN detection_confidence JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permit_packet_training' AND column_name = 'auto_detected') THEN
    ALTER TABLE public.permit_packet_training ADD COLUMN auto_detected BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permit_packet_training' AND column_name = 'detected_from') THEN
    ALTER TABLE public.permit_packet_training ADD COLUMN detected_from TEXT[];
  END IF;
END $$;

-- Create index on batch_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_permit_packet_training_batch_id ON public.permit_packet_training(batch_id);

-- Create helper function to increment batch processed count
CREATE OR REPLACE FUNCTION public.increment_batch_processed(batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE permit_training_batches
  SET processed_files = processed_files + 1
  WHERE id = batch_id;
END;
$$;