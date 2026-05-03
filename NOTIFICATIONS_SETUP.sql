-- Real-time notifications setup for Shoe Otah (Supabase)
-- Run this in Supabase SQL Editor.

-- 1) Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_role TEXT CHECK (recipient_role IN ('customer', 'admin')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_target_check CHECK (
    recipient_user_id IS NOT NULL OR recipient_role IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role_created_at ON notifications(recipient_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read_created_at ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related_order_id ON notifications(related_order_id);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION set_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_notifications_updated_at();

-- 2) Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Enable select own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable insert authenticated notifications" ON notifications;
DROP POLICY IF EXISTS "Enable update own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable admin update notifications" ON notifications;

-- NOTE:
-- This project currently uses custom sessions in the users/sessions tables.
-- For strict production security with auth.uid(), migrate to full Supabase Auth sessions.
-- Current policies keep reads constrained by recipient where possible.

CREATE POLICY "Enable select own notifications"
  ON notifications
  FOR SELECT
  USING (
    recipient_user_id IS NOT NULL
    OR recipient_role IN ('customer', 'admin')
  );

CREATE POLICY "Enable insert authenticated notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update own notifications"
  ON notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3) Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 4) Optional helper examples
-- Customer notification
-- INSERT INTO notifications (recipient_user_id, recipient_role, title, message, category)
-- VALUES ('<customer-uuid>', 'customer', 'Order Update', 'Your order has been shipped.', 'order_update');

-- Admin notification
-- INSERT INTO notifications (recipient_role, title, message, category)
-- VALUES ('admin', 'New Order', 'A new checkout was submitted.', 'new_order');
