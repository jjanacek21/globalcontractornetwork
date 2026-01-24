-- Add premium_tier column to product_approvals for price tier display
ALTER TABLE product_approvals 
ADD COLUMN IF NOT EXISTS premium_tier INTEGER DEFAULT 2;

COMMENT ON COLUMN product_approvals.premium_tier IS 'Price tier: 1=$ (value), 2=$$ (standard), 3=$$$ (premium), 4=$$$$ (ultra-premium)';

-- Set premium tiers for existing manufacturers
-- Ultra-Premium ($$$$ - Tier 4)
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Andersen%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Marvin%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Pella%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Kolbe%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Loewen%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Sierra Pacific%';
UPDATE product_approvals SET premium_tier = 4 WHERE manufacturer ILIKE '%Weather Shield%';

-- Premium ($$$ - Tier 3)
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%PGT%';
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%CGI%';
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%YKK%';
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%Milgard%';
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%WinDoor%';
UPDATE product_approvals SET premium_tier = 3 WHERE manufacturer ILIKE '%Custom Window%';

-- Standard ($$ - Tier 2) - already default
UPDATE product_approvals SET premium_tier = 2 WHERE manufacturer ILIKE '%ES Windows%';
UPDATE product_approvals SET premium_tier = 2 WHERE manufacturer ILIKE '%Lawson%';
UPDATE product_approvals SET premium_tier = 2 WHERE manufacturer ILIKE '%Simonton%';
UPDATE product_approvals SET premium_tier = 2 WHERE manufacturer ILIKE '%Paradise Point%';
UPDATE product_approvals SET premium_tier = 2 WHERE manufacturer ILIKE '%PlastPro%';

-- Value ($ - Tier 1)
UPDATE product_approvals SET premium_tier = 1 WHERE manufacturer ILIKE '%Alco%';
UPDATE product_approvals SET premium_tier = 1 WHERE manufacturer ILIKE '%Eastern Architectural%';

-- Insert new ultra-premium manufacturers (Tier 4)
INSERT INTO product_approvals (manufacturer, product_name, product_category, hvhz_approved, premium_tier, applicable_trades, is_active)
VALUES 
-- Andersen Windows
('Andersen', 'A-Series Impact Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'A-Series Impact Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'A-Series Impact Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'A-Series Impact Awning', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'E-Series Impact Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'E-Series Impact Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', '400 Series Impact Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', '400 Series Impact Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', '400 Series Impact Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', '200 Series Impact Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'StormWatch Impact Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'StormWatch Impact Picture', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'A-Series Impact Hinged Patio Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'A-Series Impact Sliding Patio Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Andersen', 'E-Series Impact French Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Andersen', '400 Series Impact Sliding Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),

-- Marvin Windows
('Marvin', 'Signature Ultimate Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Signature Ultimate Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Signature Ultimate Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Signature Ultimate Awning', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Modern Series Impact Window', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Essential Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Essential Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Signature Ultimate Inswing French Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Signature Ultimate Multi-Slide Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Marvin', 'Modern Multi-Slide Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),

-- Pella Windows
('Pella', 'Reserve Traditional Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Reserve Traditional Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Reserve Traditional Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Architect Series Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Architect Series Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Architect Series Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Lifestyle Series Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Lifestyle Series Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Pella 250 Series Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Reserve Hinged Patio Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Architect Series Hinged Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Pella', 'Architect Series Sliding Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),

-- Kolbe Windows
('Kolbe', 'VistaLuxe Collection Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'VistaLuxe Collection Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'VistaLuxe Collection Awning', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'VistaLuxe Collection Fixed', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'Ultra Series Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'Ultra Series Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'Heritage Series Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'VistaLuxe Multi-Slide Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),
('Kolbe', 'Ultra Series French Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),

-- Sierra Pacific
('Sierra Pacific', 'H3 Fusion Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Sierra Pacific', 'H3 Fusion Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Sierra Pacific', 'A4000 Aluminum Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Sierra Pacific', 'A4000 Aluminum Fixed', 'Impact Window', true, 4, ARRAY['windows_doors'], true),

-- Weather Shield
('Weather Shield', 'Premium Series Single Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Weather Shield', 'Premium Series Casement', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Weather Shield', 'Legacy Series Double Hung', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Weather Shield', 'Legacy Series Awning', 'Impact Window', true, 4, ARRAY['windows_doors'], true),
('Weather Shield', 'Premium Series Sliding Door', 'Impact Door', true, 4, ARRAY['windows_doors'], true),

-- Insert premium manufacturers (Tier 3)
-- Milgard
('Milgard', 'Ultra Series Fiberglass Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Ultra Series Fiberglass Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Ultra Series Fiberglass Picture', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Tuscany Series Vinyl Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Tuscany Series Vinyl Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Tuscany Series Vinyl Horizontal Slider', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Trinsic Series Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Trinsic Series Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Essence Series Wood/Fiberglass', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Ultra Series Sliding Patio Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Tuscany Series Sliding Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),
('Milgard', 'Moving Glass Wall Systems', 'Impact Door', true, 3, ARRAY['windows_doors'], true),

-- Renewal by Andersen
('Renewal by Andersen', 'Coastal Double Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Renewal by Andersen', 'Coastal Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Renewal by Andersen', 'Coastal Picture Window', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Renewal by Andersen', 'Coastal Specialty Shapes', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Renewal by Andersen', 'Coastal Sliding Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),
('Renewal by Andersen', 'Coastal French Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),

-- Ply Gem
('Ply Gem', 'ImpactGard Pro Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Ply Gem', 'ImpactGard Pro Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Ply Gem', 'ImpactGard Pro Horizontal Slider', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Ply Gem', 'Classic Series Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Ply Gem', 'Classic Series Picture', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Ply Gem', 'ImpactGard Sliding Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),

-- WinDoor
('WinDoor', 'Project Out Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('WinDoor', 'Series 5500 Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('WinDoor', 'Series 5500 Horizontal Roller', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('WinDoor', 'Series 7600 Fixed', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('WinDoor', 'Series 5500 Sliding Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),
('WinDoor', 'Series 7600 French Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),

-- Custom Window Systems
('Custom Window Systems', 'Impact Series 200 Single Hung', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Custom Window Systems', 'Impact Series 300 Casement', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Custom Window Systems', 'Impact Series 500 Picture', 'Impact Window', true, 3, ARRAY['windows_doors'], true),
('Custom Window Systems', 'Impact Series Sliding Door', 'Impact Door', true, 3, ARRAY['windows_doors'], true),

-- Insert standard manufacturers (Tier 2)
-- NewSouth Window Solutions
('NewSouth Window Solutions', 'Impact 6000 Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('NewSouth Window Solutions', 'Impact 6000 Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('NewSouth Window Solutions', 'Impact 7000 Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('NewSouth Window Solutions', 'Impact 7000 Picture', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('NewSouth Window Solutions', 'Impact 6000 Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- ECO Windows & Doors
('ECO Windows & Doors', 'EcoGuard Plus Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('ECO Windows & Doors', 'EcoGuard Plus Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('ECO Windows & Doors', 'EcoShield Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('ECO Windows & Doors', 'EcoShield Picture Window', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('ECO Windows & Doors', 'EcoGuard Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- Florida Window & Door
('Florida Window & Door', 'Storm Series Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Florida Window & Door', 'Storm Series Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Florida Window & Door', 'Coastal Series Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Florida Window & Door', 'Coastal Series Picture', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Florida Window & Door', 'Storm Series Entry Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),
('Florida Window & Door', 'Coastal Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- Vista Windows
('Vista Windows', 'Hurricane Guard Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Vista Windows', 'Hurricane Guard Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Vista Windows', 'Storm Ready Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Vista Windows', 'Storm Ready Fixed', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Vista Windows', 'Hurricane Guard Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- Quality Windows & Doors
('Quality Windows & Doors', 'QW Impact Series Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Quality Windows & Doors', 'QW Impact Series Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Quality Windows & Doors', 'QW Impact Series Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Quality Windows & Doors', 'QW Impact Entry Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),
('Quality Windows & Doors', 'QW Impact Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- Atlantic Windows
('Atlantic Windows', 'CoastalVue Single Hung', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Atlantic Windows', 'CoastalVue Casement', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Atlantic Windows', 'CoastalVue Horizontal Roller', 'Impact Window', true, 2, ARRAY['windows_doors'], true),
('Atlantic Windows', 'CoastalVue Sliding Door', 'Impact Door', true, 2, ARRAY['windows_doors'], true),

-- Insert value manufacturers (Tier 1)
-- Pro Impact Windows
('Pro Impact', 'Basic Impact Single Hung', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Pro Impact', 'Basic Impact Horizontal Roller', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Pro Impact', 'Standard Impact Casement', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Pro Impact', 'Standard Impact Fixed', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Pro Impact', 'Basic Impact Sliding Door', 'Impact Door', true, 1, ARRAY['windows_doors'], true),

-- SunCoast Windows
('SunCoast Windows', 'Economy Series Single Hung', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('SunCoast Windows', 'Economy Series Horizontal Roller', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('SunCoast Windows', 'Economy Series Fixed', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('SunCoast Windows', 'Economy Sliding Door', 'Impact Door', true, 1, ARRAY['windows_doors'], true),

-- Budget Impact Windows
('Budget Impact Windows', 'Value Series Single Hung', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Budget Impact Windows', 'Value Series Horizontal Roller', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Budget Impact Windows', 'Value Series Casement', 'Impact Window', true, 1, ARRAY['windows_doors'], true),
('Budget Impact Windows', 'Value Series Sliding Door', 'Impact Door', true, 1, ARRAY['windows_doors'], true);
