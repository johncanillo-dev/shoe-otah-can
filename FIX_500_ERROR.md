# Fix: 500 Error on Shop Branding API

## 🔴 Error
```
api/admin/shop-branding:1  Failed to load resource: the server responded with a status of 500 ()
```

## ✅ Root Cause
The server-side Supabase client needs the **SUPABASE_SERVICE_ROLE_KEY** environment variable to perform database operations. Without it, the API returns 500 error.

## 🔧 Solution

### Step 1: Get Your Service Role Key from Supabase

1. Go to: https://supabase.com/dashboard/project/quczdzckbbbgzcdguqxo/settings/api
2. Under "Service role key" section, copy the key
3. Look for the key that starts with `eyJhbGc...` (it's a long JWT token)

### Step 2: Add to Your .env.local File

Create or update `.env.local` in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://quczdzckbbbgzcdguqxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**IMPORTANT:** The service role key is like a password - keep it secret and never commit it to Git!

### Step 3: Restart the Dev Server

After adding the environment variable:

```bash
# Stop the current server (Ctrl+C)
# Then restart it:
npm run dev
```

### Step 4: Test It Works

1. Go to **Admin Dashboard** → **Shop Location Editor**
2. Update the location
3. Click **Save**
4. You should see: ✅ **"Location saved and updated in real-time!"**

---

## 📋 Environment Variables Reference

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role key (SECRET!)** | Supabase Dashboard > Settings > API |

---

## ⚠️ Security Note

The `SUPABASE_SERVICE_ROLE_KEY` is like a root password for your database:
- ✅ **Safe in `.env.local`** (never committed)
- ✅ **Safe in production** (set on your hosting platform)
- ❌ **NOT safe** in Git, environment files, or public places

---

## 🚀 After Fixing

Once you add the environment variable and restart, the API endpoint will:
- ✅ Authenticate with Supabase using the service role key
- ✅ Have full permissions to read/write location data
- ✅ Successfully save location updates
- ✅ No more 500 errors!
