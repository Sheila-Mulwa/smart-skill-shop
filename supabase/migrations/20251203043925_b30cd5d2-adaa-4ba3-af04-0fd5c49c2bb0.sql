-- Add price_usd column to products table for dual pricing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_usd numeric;

-- Create a comment to document the pricing system
COMMENT ON COLUMN public.products.price IS 'Price in KES (Kenyan Shillings)';
COMMENT ON COLUMN public.products.price_usd IS 'Price in USD (auto-calculated from KES)';