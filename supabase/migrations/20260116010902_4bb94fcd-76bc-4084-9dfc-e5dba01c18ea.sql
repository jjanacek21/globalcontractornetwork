-- Add applicable_trades column to product_approvals
ALTER TABLE product_approvals ADD COLUMN IF NOT EXISTS applicable_trades text[] DEFAULT ARRAY['roofing'];

-- Add UIL number column
ALTER TABLE product_approvals ADD COLUMN IF NOT EXISTS uil_number text;

-- Update existing products with applicable_trades
UPDATE product_approvals SET applicable_trades = ARRAY['roofing'] WHERE product_category IN ('Underlayment', 'Roof Tile', 'Shingles', 'Metal Roofing', 'Fasteners');

-- Add more roofing products with NOA details
INSERT INTO product_approvals (manufacturer, product_name, product_category, product_line, noa_number, fl_product_approval, expiration_date, hvhz_approved, wind_speed_rating, applicable_trades, is_active) VALUES
-- Additional Underlayments
('GAF', 'FeltBuster Synthetic Underlayment', 'Underlayment', 'FeltBuster', 'NOA 20-0456.03', 'FL28429', '2027-06-15', true, 180, ARRAY['roofing'], true),
('CertainTeed', 'DiamondDeck Synthetic Underlayment', 'Underlayment', 'DiamondDeck', 'NOA 22-0789.01', 'FL31245', '2027-09-20', true, 175, ARRAY['roofing'], true),
('Owens Corning', 'ProArmor Synthetic Underlayment', 'Underlayment', 'ProArmor', 'NOA 23-0567.04', 'FL32156', '2028-03-10', true, 180, ARRAY['roofing'], true),
('Boral', 'TileSeal Underlayment', 'Underlayment', 'TileSeal', 'NOA 21-0234.02', 'FL29876', '2026-12-01', true, 170, ARRAY['roofing'], true),

-- Additional Roof Tiles
('Boral', 'Barcelona 900 Concrete Tile', 'Roof Tile', 'Barcelona', 'NOA 23-0891.05', 'FL30567', '2028-01-15', true, 180, ARRAY['roofing'], true),
('Boral', 'Saxony 900 Slate Tile', 'Roof Tile', 'Saxony', 'NOA 22-0678.03', 'FL29234', '2027-08-20', true, 175, ARRAY['roofing'], true),
('Westlake', 'Cedarlite Concrete Tile', 'Roof Tile', 'Cedarlite', 'NOA 24-0123.01', 'FL33456', '2029-02-28', true, 180, ARRAY['roofing'], true),
('Westlake', 'Duralite Concrete Tile', 'Roof Tile', 'Duralite', 'NOA 23-0567.08', 'FL32789', '2028-06-15', true, 175, ARRAY['roofing'], true),

-- Additional Shingles
('Owens Corning', 'Duration STORM Impact Shingle', 'Shingles', 'Duration STORM', 'NOA 24-0234.02', 'FL34123', '2029-04-10', true, 180, ARRAY['roofing'], true),
('Owens Corning', 'TruDefinition Duration FLEX', 'Shingles', 'Duration FLEX', 'NOA 23-0789.06', 'FL32567', '2028-09-25', true, 170, ARRAY['roofing'], true),
('Tamko', 'Titan XT Impact Resistant', 'Shingles', 'Titan XT', 'NOA 22-0456.04', 'FL30234', '2027-11-30', true, 175, ARRAY['roofing'], true),
('IKO', 'Dynasty Performance Shingle', 'Shingles', 'Dynasty', 'NOA 23-0345.07', 'FL31890', '2028-05-15', true, 170, ARRAY['roofing'], true),

-- Fasteners
('Grip-Rite', 'Coil Roofing Nails Stainless', 'Fasteners', 'ProPak', 'FL-9245-R4', 'FL25678', '2028-12-31', true, 185, ARRAY['roofing'], true),
('Maze Nails', 'Storm Guard Roofing Nails', 'Fasteners', 'Storm Guard', 'FL-8734-R3', 'FL26789', '2027-10-15', true, 180, ARRAY['roofing'], true),
('Hillman', 'HVHZ Roofing Screws', 'Fasteners', 'Hurricane', 'FL-9567-R2', 'FL28123', '2028-08-20', true, 185, ARRAY['roofing'], true),

-- HVAC Products
('Carrier', 'Infinity 26 AC Unit 4 Ton', 'AC Unit', 'Infinity', 'NOA 24-1234.01', 'FL35001', '2029-06-30', true, 180, ARRAY['hvac'], true),
('Carrier', 'Infinity 24 AC Unit 3 Ton', 'AC Unit', 'Infinity', 'NOA 24-1234.02', 'FL35002', '2029-06-30', true, 180, ARRAY['hvac'], true),
('Trane', 'XR17 Heat Pump 3.5 Ton', 'Heat Pump', 'XR Series', 'NOA 23-5678.03', 'FL34567', '2028-12-15', true, 175, ARRAY['hvac'], true),
('Trane', 'XV20i Variable Speed 4 Ton', 'AC Unit', 'XV Series', 'NOA 24-5679.01', 'FL35123', '2029-08-20', true, 180, ARRAY['hvac'], true),
('Lennox', 'XC25 AC Unit 3 Ton', 'AC Unit', 'XC Series', 'NOA 23-8901.02', 'FL33890', '2028-10-30', true, 175, ARRAY['hvac'], true),
('Rheem', 'Prestige RA20 4 Ton', 'AC Unit', 'Prestige', 'NOA 24-2345.01', 'FL35234', '2029-05-15', true, 180, ARRAY['hvac'], true),
('Goodman', 'GSXC18 2-Stage 3 Ton', 'AC Unit', 'GSXC', 'NOA 23-3456.04', 'FL34012', '2028-11-25', true, 170, ARRAY['hvac'], true),

-- Air Handlers
('Carrier', 'FX4D Air Handler', 'Air Handler', 'FX Series', 'NOA 24-4567.01', 'FL35345', '2029-07-10', true, 175, ARRAY['hvac'], true),
('Trane', 'GAM5 Air Handler', 'Air Handler', 'GAM Series', 'NOA 23-7890.02', 'FL34678', '2028-09-30', true, 170, ARRAY['hvac'], true),

-- Windows & Doors
('PGT', 'WinGuard Aluminum Impact Window', 'Impact Window', 'WinGuard', 'NOA 23-0567.02', 'FL32890', '2028-07-15', true, 185, ARRAY['windows_doors'], true),
('PGT', 'WinGuard Vinyl Impact Window', 'Impact Window', 'WinGuard Vinyl', 'NOA 23-0567.03', 'FL32891', '2028-07-15', true, 185, ARRAY['windows_doors'], true),
('CGI', 'Estate Collection Impact Window', 'Impact Window', 'Estate', 'NOA 22-0891.04', 'FL31567', '2027-12-20', true, 180, ARRAY['windows_doors'], true),
('CGI', 'Sentinel Impact Window', 'Impact Window', 'Sentinel', 'NOA 23-1234.05', 'FL33012', '2028-08-10', true, 180, ARRAY['windows_doors'], true),
('Lawson', 'Hurricane Guard Impact Window', 'Impact Window', 'Hurricane Guard', 'NOA 24-0456.01', 'FL34890', '2029-03-25', true, 185, ARRAY['windows_doors'], true),
('Paradise Point', 'Stormbreaker Impact Window', 'Impact Window', 'Stormbreaker', 'NOA 23-0789.06', 'FL33567', '2028-10-15', true, 180, ARRAY['windows_doors'], true),

-- Impact Doors
('Therma-Tru', 'Impact Fiberglass Entry Door', 'Impact Door', 'Therma-Tru Impact', 'NOA 21-0234.06', 'FL29567', '2026-11-30', true, 175, ARRAY['windows_doors'], true),
('PGT', 'WinGuard Sliding Glass Door', 'Impact Door', 'WinGuard SGD', 'NOA 23-0567.07', 'FL32892', '2028-07-15', true, 185, ARRAY['windows_doors'], true),
('CGI', 'Estate Sliding Glass Door', 'Impact Door', 'Estate SGD', 'NOA 22-0891.08', 'FL31568', '2027-12-20', true, 180, ARRAY['windows_doors'], true),
('PlastPro', 'Impact Entry Door System', 'Impact Door', 'PlastPro Impact', 'NOA 24-0123.04', 'FL34234', '2029-01-15', true, 175, ARRAY['windows_doors'], true),

-- Electrical Products
('Square D', 'Homeline 200A Main Panel', 'Electrical Panel', 'Homeline', 'NOA 23-6789.01', 'FL33901', '2028-08-30', true, 180, ARRAY['electrical'], true),
('Square D', 'QO 200A Main Panel', 'Electrical Panel', 'QO Series', 'NOA 24-6790.01', 'FL35012', '2029-06-15', true, 185, ARRAY['electrical'], true),
('Eaton', 'BR 200A Panel', 'Electrical Panel', 'BR Series', 'NOA 23-7891.02', 'FL34123', '2028-11-20', true, 175, ARRAY['electrical'], true),
('Siemens', 'ES 200A Panel', 'Electrical Panel', 'ES Series', 'NOA 24-8901.01', 'FL35234', '2029-07-25', true, 180, ARRAY['electrical'], true),
('GE', 'PowerMark Gold 200A', 'Electrical Panel', 'PowerMark', 'NOA 23-9012.03', 'FL34345', '2028-12-10', true, 175, ARRAY['electrical'], true),

-- Plumbing Products
('Rheem', 'Performance Plus 50 Gal Water Heater', 'Water Heater', 'Performance Plus', 'NOA 24-1011.01', 'FL35456', '2029-04-20', true, 175, ARRAY['plumbing'], true),
('A.O. Smith', 'Signature 50 Gal Electric', 'Water Heater', 'Signature', 'NOA 23-1112.02', 'FL34567', '2028-09-15', true, 170, ARRAY['plumbing'], true),
('Bradford White', 'Defender 50 Gal Gas', 'Water Heater', 'Defender', 'NOA 24-1213.01', 'FL35567', '2029-05-30', true, 175, ARRAY['plumbing'], true),
('Navien', 'NPE-240A Tankless', 'Water Heater', 'NPE Series', 'NOA 23-1314.03', 'FL34678', '2028-10-25', true, 180, ARRAY['plumbing'], true),
('Rinnai', 'RU199iN Tankless', 'Water Heater', 'RU Series', 'NOA 24-1415.01', 'FL35678', '2029-06-10', true, 180, ARRAY['plumbing'], true)

ON CONFLICT (id) DO NOTHING;