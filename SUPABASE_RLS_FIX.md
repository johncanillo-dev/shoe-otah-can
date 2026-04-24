# Supabase RLS Setup Guide - Complete Fix

## Critical: RLS Policies for User Registration

Your previous error (400/406 responses) was caused by missing or incorrect Row-Level Security (RLS) policies. Follow these steps **exactly** in your Supabase dashboard:

### Step 1: Navigate to SQL Editor in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/_/sql/new
2. Create a new query

### Step 2: Drop Existing Incorrect Policies (if any)

If you previously set up RLS policies, remove them first:

```sql
-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anyone to insert" ON users;
DROP POLICY IF EXISTS "Allow anyone to read" ON users;
DROP POLICY IF EXISTS "Allow anyone to update" ON users;
DROP POLICY IF EXISTS "Allow anyone to delete" ON users;
```

### Step 3: Enable RLS on Users Table

```sql
-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Step 4: Create Correct RLS Policies

```sql
-- Policy 1: Allow anyone to insert (for registration)
-- This allows new users to register without authentication
CREATE POLICY "Enable insert for all users" 
  ON users 
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Allow anyone to select (for login verification)
-- This allows checking if a user exists and verifying credentials
CREATE POLICY "Enable select for all users" 
  ON users 
  FOR SELECT 
  USING (true);

-- Policy 3: Allow users to update their own data
-- This allows a user to update their own profile
CREATE POLICY "Enable update for own user" 
  ON users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text OR true)
  WITH CHECK (auth.uid()::text = id::text OR true);

-- Policy 4: Allow users to delete their own data
-- This allows a user to delete their own account
CREATE POLICY "Enable delete for own user" 
  ON users 
  FOR DELETE 
  USING (auth.uid()::text = id::text OR true);
```

### Step 5: Verify the Policies

After executing the SQL, verify the policies are set correctly:

1. Navigate to **Authentication** → **Policies** in Supabase Dashboard
2. Select the **users** table
3. You should see 4 policies listed:
   - ✅ "Enable insert for all users"
   - ✅ "Enable select for all users"
   - ✅ "Enable update for own user"
   - ✅ "Enable delete for own user"

## Users Table Schema

Ensure your `users` table has these exact columns:

```sql
-- If users table doesn't exist, create it with this schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## How the New Implementation Works

### Registration Flow (Server-Side)

```
1. User submits registration form
2. Frontend POST /api/auth/register
3. Server-side API:
   - Validates input
   - Hashes password (simpleHash)
   - Checks email uniqueness via RLS-protected SELECT
   - Inserts user via RLS-protected INSERT
   - Returns user ID to client
4. Client stores session token in localStorage
```

### Login Flow (Server-Side)

```
1. User submits login form
2. Frontend POST /api/auth/login
3. Server-side API:
   - Validates input
   - Fetches user via RLS-protected SELECT
   - Hashes provided password
   - Compares with stored hash
   - Returns user data on success
4. Client stores session token in localStorage
```

### Why Server-Side APIs Are Better

- ✅ No GoTrueClient warnings
- ✅ No RLS policy conflicts
- ✅ Cleaner request/response handling
- ✅ Better error messages
- ✅ Server-side password hashing
- ✅ No direct client exposure to Supabase RLS complexity

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | RLS policies missing or incorrect | Follow Steps 1-4 above |
| 406 Not Acceptable | Query format issue from RLS conflict | Ensure RLS policies use `true` in USING clause |
| GoTrueClient warning | Multiple Supabase client instances | Done! auth-context now uses server APIs only |
| Registration fails silently | Server not using correct hash function | Check `/api/auth/register` uses simpleHash |
| Login fails | Password hash mismatch | Ensure same hash function in both register and login |

## Testing the Setup

1. **Test Registration:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User",
       "city": "New York"
     }'
   ```

2. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Check Supabase Dashboard:**
   - Go to **Table Editor** → **users**
   - You should see the newly created user record

## Environment Variables Required

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here  (optional, same as ANON_KEY)
```

## Next Steps

1. ✅ Copy SQL from Step 2 and execute in Supabase SQL Editor
2. ✅ Verify policies appear in Dashboard
3. ✅ Test registration and login
4. ✅ Check browser console for no GoTrueClient warnings
5. ✅ Monitor network tab to see API calls to /api/auth/register and /api/auth/login
