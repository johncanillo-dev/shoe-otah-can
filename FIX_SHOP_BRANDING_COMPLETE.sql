-- ============================================================================
-- COMPLETE SHOP BRANDING FIX
-- Run this ENTIRE script in your Supabase Dashboard > SQL Editor
-- This fixes: missing table, missing columns, RLS policies, and default data
-- ============================================================================

-- Step 1: Create the shop_branding table if it doesn't exist
CREATE TABLE IF NOT EXISTS shop_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  banner_url TEXT,
  shop_name TEXT DEFAULT 'Shoe Otah Boutique',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Add missing location columns (safe to re-run if they don't exist)
ALTER TABLE shop_branding
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS location_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS location_zoom INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS location_image_url TEXT;

-- Step 3: Drop ALL old policies (clean slate)
DROP POLICY IF EXISTS "read shop branding" ON shop_branding;
DROP POLICY IF EXISTS "admin update shop branding" ON shop_branding;
DROP POLICY IF EXISTS "Allow public read access" ON shop_branding;
DROP POLICY IF EXISTS "Allow authenticated insert" ON shop_branding;
DROP POLICY IF EXISTS "Allow authenticated update" ON shop_branding;
DROP POLICY IF EXISTS "Allow all select" ON shop_branding;
DROP POLICY IF EXISTS "Allow all insert" ON shop_branding;
DROP POLICY IF EXISTS "Allow all update" ON shop_branding;
DROP POLICY IF EXISTS "Enable read for all" ON shop_branding;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Public shop branding read" ON shop_branding;
DROP POLICY IF EXISTS "Admin shop branding update" ON shop_branding;

-- Step 4: Enable Row Level Security
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive RLS policies
-- These allow the authenticated Next.js API route to read/write

CREATE POLICY "Allow all select"
  ON shop_branding
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert"
  ON shop_branding
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update"
  ON shop_branding
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Step 6: Insert a default row if none exists
INSERT INTO shop_branding (logo_url, banner_url, shop_name, location_address, location_latitude, location_longitude, location_zoom)
VALUES (
  '/shoe-otah-logo.png',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop',
  'Shoe Otah Boutique',
  'Purok 4, Poblacion, Sibagat, 8503 Agusan del Sur, Philippines',
  8.632396,
  126.315832,
  18
)
ON CONFLICT DO NOTHING;

-- Step 7: Verify everything worked
SELECT 
  'Table exists' as check_item,
  COUNT(*) as result
FROM information_schema.tables 
WHERE table_name = 'shop_branding'
UNION ALL
SELECT 
  'Column count',
  COUNT(*)
FROM information_schema.columns 
WHERE table_name = 'shop_branding'
UNION ALL
SELECT 
  'Row count',
  COUNT(*)
FROM shop_branding;

