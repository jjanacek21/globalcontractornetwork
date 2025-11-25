-- Add waste_factor_percent column to measurements table
ALTER TABLE measurements 
ADD COLUMN waste_factor_percent NUMERIC DEFAULT 10;