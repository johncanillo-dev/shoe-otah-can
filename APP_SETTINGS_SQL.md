# App Settings SQL Setup

Run this in your Supabase SQL Editor to create the app_settings table with RLS policies.

```sql
-- Create app_settings table for real-time feature control
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on key for fast lookups
CREATE UNIQUE INDEX idx_app_settings_key ON app_settings(key);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public read policy (everyone can read settings)
CREATE POLICY "read settings"
ON app_settings
FOR SELECT
USING (true);

-- Admin update policy (authenticated users can update)
CREATE POLICY "admin update settings"
ON app_settings
FOR ALL
USING (auth.role() = 'authenticated');

-- Enable Realtime for app_settings
BEGIN;
  -- Drop the table from the publication if it exists
  ALTER publication supabase_realtime DROP TABLE IF EXISTS app_settings;
  -- Add the table to the publication
  ALTER publication supabase_realtime ADD TABLE app_settings;
COMMIT;

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('store_open', 'true'),
  ('delivery_fee', '50'),
  ('free_shipping_threshold', '500'),
  ('enable_cod', 'true'),
  ('enable_gcash', 'true'),
  ('enable_paymaya', 'true'),
  ('enable_bank_transfer', 'true'),
  ('discount_percentage', '0'),
  ('announcement_banner', '""'),
  ('maintenance_mode', 'false'),
  ('enable_notifications', 'true'),
  ('enable_email_alerts', 'true')
ON CONFLICT (key) DO NOTHING;
```

## Important: Enable Realtime in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to Database > Replication
3. Under "Source", make sure `app_settings` is checked for INSERT, UPDATE, DELETE
4. Under "Realtime", make sure `app_settings` is added to the publication

## Features Implemented

- Persistent settings stored in Supabase
- Real-time sync across all users via Supabase Realtime
- Admin dashboard controls for all settings
- Store open/closed toggle
- Delivery fee configuration
- Free shipping threshold
- Payment method toggles (COD, GCash, PayMaya, Bank Transfer)
- Announcement banner
- Maintenance mode
- Discount percentage
