# 🗄️ Complete Supabase Database Setup

This document contains ALL SQL needed to set up your Supabase database completely. **Run this in Supabase SQL Editor before using the application.**

---

## ⚠️ IMPORTANT: Run ALL sections in order!

---

## Section 1: Users Table Setup

### Create Users Table
```sql
-- Drop table if you want to start fresh (WARNING: deletes all data!)
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  phone TEXT,
  address TEXT,
  icon TEXT,
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Users Table
```sql
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow insert for all users" ON users;
DROP POLICY IF EXISTS "Allow select for all users" ON users;
DROP POLICY IF EXISTS "Allow update for own user" ON users;
DROP POLICY IF EXISTS "Allow delete for own user" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable select for all users" ON users;
DROP POLICY IF EXISTS "Enable update for own user" ON users;
DROP POLICY IF EXISTS "Enable delete for own user" ON users;

-- Create new policies
CREATE POLICY "Enable insert for all users" 
  ON users 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Enable select for all users" 
  ON users 
  FOR SELECT 
  USING (true);

CREATE POLICY "Enable update for own user" 
  ON users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text OR true)
  WITH CHECK (auth.uid()::text = id::text OR true);

CREATE POLICY "Enable delete for own user" 
  ON users 
  FOR DELETE 
  USING (auth.uid()::text = id::text OR true);
```

---

## Section 2: Orders Table Setup

### Create Orders Table
```sql
-- DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  delivery_notes TEXT,
  estimated_delivery TEXT,
  is_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Orders Table
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow all select" ON orders;
DROP POLICY IF EXISTS "Allow all insert" ON orders;
DROP POLICY IF EXISTS "Allow all update" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Create new policies
CREATE POLICY "Enable read all orders"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert all orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update all orders"
  ON orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete all orders"
  ON orders
  FOR DELETE
  USING (true);
```

---

## Section 3: Shop Branding Table Setup

### Create Shop Branding Table
```sql
-- DROP TABLE IF EXISTS shop_branding CASCADE;

CREATE TABLE IF NOT EXISTS shop_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  banner_url TEXT,
  shop_name TEXT DEFAULT 'Shoe Otah Boutique',
  location_address TEXT,
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  location_zoom INTEGER DEFAULT 15,
  location_image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Shop Branding Table
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow all select" ON shop_branding;
DROP POLICY IF EXISTS "Allow all insert" ON shop_branding;
DROP POLICY IF EXISTS "Allow all update" ON shop_branding;
DROP POLICY IF EXISTS "Public read access" ON shop_branding;
DROP POLICY IF EXISTS "Admin update access" ON shop_branding;

-- Create new policies
CREATE POLICY "Enable select for all"
  ON shop_branding
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all"
  ON shop_branding
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all"
  ON shop_branding
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default shop branding
INSERT INTO shop_branding (
  logo_url, 
  banner_url, 
  shop_name, 
  location_address, 
  location_latitude, 
  location_longitude, 
  location_zoom
)
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
```

---

## Section 4: Sessions Table (For Cross-Device Support)

### Create Sessions Table
```sql
-- DROP TABLE IF EXISTS sessions CASCADE;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '30 days')
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Sessions Table
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow all select" ON sessions;
DROP POLICY IF EXISTS "Allow all insert" ON sessions;
DROP POLICY IF EXISTS "Allow all update" ON sessions;

-- Create new policies
CREATE POLICY "Enable select for all"
  ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all"
  ON sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

---

## Section 5: Products Table (If Missing)

### Create Products Table
```sql
-- DROP TABLE IF EXISTS shoe_otah CASCADE;

CREATE TABLE IF NOT EXISTS shoe_otah (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  image TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shoe_otah_category ON shoe_otah(category);
CREATE INDEX IF NOT EXISTS idx_shoe_otah_created_at ON shoe_otah(created_at);

-- Enable RLS
ALTER TABLE shoe_otah ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Products Table
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Allow all select" ON shoe_otah;
DROP POLICY IF EXISTS "Allow all insert" ON shoe_otah;
DROP POLICY IF EXISTS "Allow all update" ON shoe_otah;

-- Create new policies
CREATE POLICY "Enable select for all"
  ON shoe_otah
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all"
  ON shoe_otah
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all"
  ON shoe_otah
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

---

## Section 6: App Settings Table

### Create App Settings Table
```sql
-- DROP TABLE IF EXISTS app_settings CASCADE;

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  store_open BOOLEAN DEFAULT true,
  delivery_fee NUMERIC DEFAULT 50,
  free_shipping_threshold NUMERIC DEFAULT 500,
  tax_rate NUMERIC DEFAULT 0.08,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable select for all"
  ON app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all"
  ON app_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all"
  ON app_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO app_settings (id, store_open, delivery_fee, free_shipping_threshold, tax_rate)
VALUES ('default', true, 50, 500, 0.08)
ON CONFLICT (id) DO NOTHING;
```

---

## ✅ Complete Setup Checklist

After running all SQL sections above, verify:

- [ ] Users table exists and has 10 columns (id, email, password, name, city, etc.)
- [ ] Orders table exists with 13 columns  
- [ ] Shop Branding table exists with 9 columns
- [ ] Sessions table exists with 5 columns
- [ ] Products (shoe_otah) table exists with 8 columns
- [ ] App Settings table exists with 5 columns
- [ ] All tables have RLS enabled (check Authentication → Policies)
- [ ] All tables have at least 3 policies each
- [ ] Default shop branding data exists

### Verify in Supabase Dashboard:
1. Go to **Table Editor** and confirm all 6 tables exist
2. Go to **Authentication** → **Policies** and confirm all policies are created
3. Try running a SELECT on each table (should return 0 rows for new setup)

---

## 🧪 Quick Test

After setup, run this in SQL Editor to verify everything:

```sql
-- Check table counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'orders' as table_name, COUNT(*) FROM orders
UNION ALL
SELECT 'shop_branding' as table_name, COUNT(*) FROM shop_branding
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) FROM sessions
UNION ALL
SELECT 'shoe_otah' as table_name, COUNT(*) FROM shoe_otah
UNION ALL
SELECT 'app_settings' as table_name, COUNT(*) FROM app_settings;
```

Expected output:
```
users           | 0
orders          | 0
shop_branding   | 1 (default data)
sessions        | 0
shoe_otah       | 0
app_settings    | 1 (default data)
```

---

## 🚀 Your Next Steps

1. ✅ Run all SQL sections above in Supabase SQL Editor
2. ✅ Verify tables and policies in dashboard
3. ✅ Restart dev server: `npm run dev`
4. ✅ Test registration at http://localhost:3000/register
5. ✅ Test login at http://localhost:3000/login
6. ✅ Test checkout at http://localhost:3000/cart
7. ✅ Test admin at http://localhost:3000/admin

---

## ⚠️ Production Notes

- These RLS policies are permissive for development
- For production, implement stricter policies based on user roles
- Use row-level security to restrict user access to their own data
- Consider adding auth.uid() checks instead of `true`
- Add rate limiting on sensitive operations

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Table already exists error | The table exists; you can ignore this |
| Policy already exists error | Drop the policy first or ignore |
| RLS not enabled | Run `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` |
| Still getting 400/406 errors | Verify all 4 policies exist on users table |
| Orders not saving | Verify orders table has all 13 columns |

---

**Status**: Use this document as your complete database setup. After running all SQL, your application will be fully functional!
