# Supabase 400 Error Fix - Shop Branding Table

## 🔴 The Problem

Your app is throwing this error when trying to save location settings:
```
Failed to load resource: the server responded with a status of 400 ()
Update error: Object
```

**URL showing the error:**
```
quczdzckbbbgzcdguqxo.supabase.co/rest/v1/shop_branding?id=eq.5e51a15c-053e-4528-bb79-77cbe35ab708
```

## ✅ Root Cause

The `shop_branding` table has Row Level Security (RLS) **enabled but NO policies defined**. This causes Supabase to **block ALL requests** with a 400 error.

## 🔧 The Solution - 5 Easy Steps

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### Step 2: Select Your Project
Click on your project: `shoe-otah-can`

### Step 3: Go to SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **+ New Query**

### Step 4: Copy & Paste the SQL
Copy all the SQL from `SHOP_BRANDING_RLS_FIX.sql` (in your project root)

### Step 5: Run the Query
1. Paste the SQL into the editor
2. Click **Run** (or press `Ctrl+Enter`)
3. You should see: `Success. No rows returned.`

---

## 🧪 Test It Works

After running the SQL:

1. Go to your app's admin dashboard
2. Click on **Shop Location Editor** or **Settings**
3. Try to update the shop location
4. You should see: ✅ "Location and image updated successfully!"

---

## 📋 What the SQL Does

| Action | Purpose |
|--------|---------|
| Drops old policies | Removes any broken/conflicting policies |
| Enables RLS | Turns on Row Level Security |
| **Read Policy** | Allows everyone (customers) to see shop location |
| **Insert Policy** | Allows authenticated users (admins) to create records |
| **Update Policy** | Allows authenticated users (admins) to update records |

---

## 🛡️ Security

These policies are safe because:
- **Read** is open (shop location is public info)
- **Insert/Update** requires authentication (only logged-in users, ideally admins)
- **Delete** is not allowed (prevents accidental data loss)

---

## ❓ Troubleshooting

**Still getting 400 error?**
1. Check you ran the SQL in the correct Supabase project
2. Verify the SQL ran with "Success" message
3. Hard-refresh your browser (Ctrl+Shift+R)
4. Check browser DevTools > Console for updated error messages

**Policies not showing?**
Run this query to verify:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'shop_branding';
```

You should see 3 policies:
- `Allow public read access`
- `Allow authenticated insert`
- `Allow authenticated update`

---

## 📝 Files Modified

- `SHOP_BRANDING_RLS_FIX.sql` - The SQL query to fix RLS policies

---

## 🔗 Related Documentation

- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
- Our previous fix: `SUPABASE_RLS_FIX.md`
