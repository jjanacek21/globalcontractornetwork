-- Add tracking columns to permit_training_books for processing
ALTER TABLE permit_training_books 
ADD COLUMN IF NOT EXISTS knowledge_items_extracted INTEGER DEFAULT 0;

ALTER TABLE permit_training_books 
ADD COLUMN IF NOT EXISTS processing_error TEXT;

ALTER TABLE permit_training_books 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;