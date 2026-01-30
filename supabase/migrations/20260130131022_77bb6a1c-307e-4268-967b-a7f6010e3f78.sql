-- Add unique constraint on noa_number for upsert support
ALTER TABLE public.product_approvals 
ADD CONSTRAINT product_approvals_noa_number_unique UNIQUE (noa_number);