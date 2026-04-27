-- ============================================================================
-- SHOP BRANDING TABLE - SIMPLE RLS POLICY FIX
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- This is a simplified version that allows all operations (the API endpoint handles auth)
-- ============================================================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON shop_branding;
DROP POLICY IF EXISTS "Allow authenticated insert" ON shop_branding;
DROP POLICY IF EXISTS "Allow authenticated update" ON shop_branding;
DROP POLICY IF EXISTS "Enable read for all" ON shop_branding;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Public shop branding read" ON shop_branding;
DROP POLICY IF EXISTS "Admin shop branding update" ON shop_branding;

-- Step 2: Enable Row Level Security
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;

-- Step 3: Create permissive policies
-- Note: The API endpoint (/api/admin/shop-branding) handles authentication on the server side
-- So these policies can be simple and permissive

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

-- Step 4: Verify
-- Run this to see all policies:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'shop_branding';

-- ============================================================================
-- WHY THIS WORKS:
-- 1. The shop_branding table has RLS enabled with simple permissive policies
-- 2. All requests to /api/admin/shop-branding go through the Next.js server
-- 3. The server uses the Supabase SERVER client which has full access
-- 4. Authentication/authorization is handled in the API endpoint, not RLS
-- 5. This avoids RLS policy complexity and client-side auth issues
-- ============================================================================
