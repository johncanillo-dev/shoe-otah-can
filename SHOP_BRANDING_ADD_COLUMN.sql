-- ============================================================================
-- ADD MISSING COLUMN TO SHOP_BRANDING TABLE
-- Run this in Supabase > SQL Editor
-- ============================================================================

-- Add missing location_image_url column if it doesn't exist
ALTER TABLE shop_branding
ADD COLUMN IF NOT EXISTS location_image_url TEXT;

-- Verify the column was created
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'shop_branding' ORDER BY ordinal_position;
