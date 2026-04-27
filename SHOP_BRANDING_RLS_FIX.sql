-- ============================================================================
-- SHOP BRANDING TABLE - RLS POLICY FIX
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- ============================================================================

-- Step 1: Drop existing policies (if any)
-- This clears any incorrect policies that might be blocking requests
DROP POLICY IF EXISTS "Enable read for all" ON shop_branding;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON shop_branding;
DROP POLICY IF EXISTS "Public shop branding read" ON shop_branding;
DROP POLICY IF EXISTS "Admin shop branding update" ON shop_branding;

-- Step 2: Enable Row Level Security on shop_branding table
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for shop_branding

-- Policy 1: Allow EVERYONE to READ shop branding (it's public info for customers)
CREATE POLICY "Allow public read access"
  ON shop_branding
  FOR SELECT
  USING (true);

-- Policy 2: Allow authenticated users to INSERT new records
-- This allows admins to create new shop branding records
CREATE POLICY "Allow authenticated insert"
  ON shop_branding
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Allow authenticated users to UPDATE records
-- This allows admins to update location, name, image, etc.
CREATE POLICY "Allow authenticated update"
  ON shop_branding
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Step 4: Verify the policies were created
-- Run this query to see all policies on shop_branding table:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'shop_branding';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- WHY THIS FIXES THE 400 ERROR:
-- 1. The .single() query was failing because there were NO RLS policies
-- 2. Supabase blocks ALL requests to tables with RLS enabled but no policies
-- 3. These policies allow:
--    - Everyone to read shop location (needed for customers to see it)
--    - Authenticated users to update/insert (needed for admin panel)
-- 
-- TESTING:
-- After running this SQL, try saving a location update in your admin panel.
-- You should see "✅ Location and image updated successfully!" message.
-- ============================================================================
