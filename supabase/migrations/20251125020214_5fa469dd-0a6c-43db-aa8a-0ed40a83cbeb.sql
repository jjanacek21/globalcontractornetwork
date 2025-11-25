-- Add polygon_data column to store GeoJSON coordinates for roof measurements
ALTER TABLE measurements ADD COLUMN polygon_data jsonb;