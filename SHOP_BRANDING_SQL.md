# Shop Branding SQL Setup

Run this in your Supabase SQL Editor to create the shop_branding table with RLS policies and enable real-time updates.

```sql
-- Create shop_branding table for real-time logo/banner sync
CREATE TABLE shop_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  banner_url TEXT,
  shop_name TEXT DEFAULT 'Shoe Otah Boutique',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;

-- Public read policy (everyone can read shop branding)
CREATE POLICY "read shop branding"
ON shop_branding
FOR SELECT
USING (true);

-- Admin update policy (authenticated users can update)
CREATE POLICY "admin update shop branding"
ON shop_branding
FOR ALL
USING (auth.role() = 'authenticated');

-- Enable Realtime for shop_branding
BEGIN;
  -- Drop the table from the publication if it exists
  ALTER publication supabase_realtime DROP TABLE IF EXISTS shop_branding;
  -- Add the table to the publication
  ALTER publication supabase_realtime ADD TABLE shop_branding;
COMMIT;

-- Insert default row (single row pattern)
INSERT INTO shop_branding (logo_url, banner_url, shop_name)
VALUES (
  '/shoe-otah-logo.png',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop',
  'Shoe Otah Boutique'
)
ON CONFLICT DO NOTHING;
```

## Important: Enable Realtime in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to Database > Replication
3. Under "Source", make sure `shop_branding` is checked for INSERT, UPDATE, DELETE
4. Under "Realtime", make sure `shop_branding` is added to the publication

## Storage Bucket Setup

1. Go to Supabase Dashboard > Storage
2. Create a new public bucket called `shop-images`
3. Set bucket policy to allow public read access
4. Set upload policy to allow authenticated uploads

## Features Implemented

- Persistent shop branding stored in Supabase
- Real-time sync across all users via Supabase Realtime
- Admin dashboard controls for logo and banner upload
- Dynamic logo in site header
- Dynamic banner in shop card
- Image cache-busting with timestamp parameter

