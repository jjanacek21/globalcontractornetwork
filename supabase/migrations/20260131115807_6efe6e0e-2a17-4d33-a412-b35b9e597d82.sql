
-- Add premium_tier column to prioritize important manufacturers
ALTER TABLE product_approvals 
ADD COLUMN IF NOT EXISTS premium_tier integer DEFAULT 0;

-- Add index for sorting by premium tier
CREATE INDEX IF NOT EXISTS idx_product_approvals_premium_tier ON product_approvals(premium_tier DESC, manufacturer);

COMMENT ON COLUMN product_approvals.premium_tier IS 'Priority tier: 3=top (GAF, Polyglass, CertainTeed), 2=major brands, 1=verified, 0=bulk imports';
