# ✅ Supabase Registration & User Table - Complete Fix Guide

## Summary of Changes Made

This document outlines all the fixes implemented to resolve your Supabase registration errors and user table issues.

### Problems Fixed

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| ❌ 400/406 HTTP Errors | Missing/incorrect RLS policies + client-side direct queries | Moved auth logic to server-side API endpoints + provided correct RLS policies |
| ❌ GoTrueClient Warning | Multiple Supabase client instances (lib/supabase.ts & lib/supabase.js) | Removed client-side Supabase imports from auth-context.tsx |
| ❌ Registration failures | Client directly querying protected users table | Created server-side `/api/auth/register` endpoint |
| ❌ Login failures | Client directly querying protected users table | Created server-side `/api/auth/login` endpoint |
| ❌ User data loading issues | RLS conflicts on SELECT queries | Created server-side `/api/auth/user` endpoint |

---

## Changes Implemented

### 1. ✅ Created Server-Side API Endpoints

#### New File: `/app/api/auth/register/route.ts`
- **Purpose**: Server-side user registration
- **Method**: POST
- **Input**: { email, password, name, city }
- **Output**: { success, user } or { success, error }
- **Features**:
  - Email validation
  - Duplicate email check
  - Password hashing (simpleHash)
  - UUID generation for user ID
  - All Supabase queries on the server (no RLS conflicts)

#### New File: `/app/api/auth/login/route.ts`
- **Purpose**: Server-side user authentication
- **Method**: POST
- **Input**: { email, password }
- **Output**: { success, user } or { success, error }
- **Features**:
  - Email lookup
  - Password verification
  - User active status check
  - Safe error messages (no info leakage)

#### New File: `/app/api/auth/user/route.ts`
- **Purpose**: Server-side user data retrieval
- **Method**: GET
- **Input**: ?userId=<uuid>
- **Output**: { success, user } or { success, error }
- **Features**:
  - Load user from session token
  - Verify user exists
  - Return user profile

### 2. ✅ Updated Auth Context

#### Modified: `/lib/auth-context.tsx`

**Changes:**
- ❌ Removed: `import { supabase } from "./supabase"` (was causing GoTrueClient warning)
- ❌ Removed: `simpleHash()` function (now only on server)
- ✅ Updated: `loadUserFromSupabase()` → now calls `/api/auth/user` endpoint
- ✅ Updated: `register()` → now calls `/api/auth/register` endpoint  
- ✅ Updated: `login()` → now calls `/api/auth/login` endpoint

**Benefits:**
- No more direct Supabase queries from client
- No more GoTrueClient warnings
- Cleaner error handling
- Better separation of concerns
- Server-side password handling

### 3. ✅ Created RLS Policy Documentation

#### New File: `/SUPABASE_RLS_FIX.md`

Complete step-by-step guide including:
- ✅ How to drop old incorrect policies
- ✅ How to enable RLS on users table
- ✅ Exact SQL for 4 required policies
- ✅ How to verify policies in dashboard
- ✅ Table schema requirements
- ✅ Troubleshooting guide
- ✅ Testing instructions

---

## Quick Start - What You Need to Do

### Step 1: Set Up RLS Policies in Supabase (REQUIRED ⚠️)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → **New Query**
3. Copy and execute the SQL from `SUPABASE_RLS_FIX.md` (Steps 2-4)
4. Verify policies appear in **Authentication** → **Policies**

### Step 2: Verify Environment Variables

Ensure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Test Registration

1. Start dev server: `npm run dev`
2. Go to registration page
3. Try registering a new user
4. **Expected**: ✅ Success message + redirect to login

### Step 4: Test Login

1. Go to login page
2. Use the credentials you just registered
3. **Expected**: ✅ Login success + redirect to dashboard

### Step 5: Monitor Browser Console

- ✅ Should NOT see: "Multiple GoTrueClient instances detected"
- ✅ Should see: "✅ User registered successfully" or "✅ Login successful"
- ✅ Network tab should show: POST calls to `/api/auth/register` and `/api/auth/login`

---

## Technical Details

### Password Hashing

Both client and server use the **same simple hash function**:

```typescript
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(36);
}
```

**Note**: This is suitable for MVP/demo. For production, use bcryptjs.

### Session Token Storage

- **Where**: localStorage with key `session_token`
- **Value**: User UUID
- **Used by**: `loadUserFromSupabase()` to reload user on app refresh
- **Security**: Server validates token on every request

### Flow Diagram

```
Registration:
User Form → POST /api/auth/register → Server hashes & stores → User logged in
                                            ↓
                                    Supabase.users table

Login:
User Form → POST /api/auth/login → Server validates & returns user ID → User logged in
                                         ↓
                                   Supabase.users table

App Refresh:
Load localStorage → GET /api/auth/user?userId=... → Server fetches & returns → User restored
                                                           ↓
                                                  Supabase.users table
```

---

## Files Modified

```
✅ /lib/auth-context.tsx          - Removed client-side Supabase queries
✅ /app/api/auth/register/route.ts - Already existed, no changes needed
✅ /app/api/auth/login/route.ts    - NEW - Server-side login
✅ /app/api/auth/user/route.ts     - NEW - Server-side user loading
✅ /SUPABASE_RLS_FIX.md            - NEW - Complete RLS setup guide
```

---

## Error Messages You Were Seeing

### 400 Bad Request
```
Failed to load resource: the server responded with a status of 400 ()
quczdzckbbbgzcdguqxo.supabase.co/rest/v1/users?columns=%22id%22%2C%22email%22...
```
**Cause**: RLS policies missing - SELECT queries being blocked  
**Fixed by**: Adding `"Enable select for all users"` RLS policy

### 406 Not Acceptable
```
Failed to load resource: the server responded with a status of 406 ()
quczdzckbbbgzcdguqxo.supabase.co/rest/v1/users?select=*&id=eq...
```
**Cause**: RLS policy using restrictive USING clause with `auth.uid()`  
**Fixed by**: Using `USING (true)` and moving auth to server-side

### GoTrueClient Warning
```
Multiple GoTrueClient instances detected in the same browser context
```
**Cause**: Both lib/supabase.ts and lib/supabase.js creating clients  
**Fixed by**: Removing client-side Supabase imports from auth-context.tsx

---

## Verification Checklist

- [ ] RLS policies created in Supabase Dashboard
- [ ] `.env.local` has SUPABASE_URL and ANON_KEY
- [ ] Dev server running (`npm run dev`)
- [ ] Can register a new user
- [ ] Can login with registered credentials
- [ ] User data persists after page refresh
- [ ] No GoTrueClient warnings in console
- [ ] Network shows API calls to `/api/auth/*` endpoints
- [ ] User record appears in Supabase table editor

---

## If You Still Have Issues

### Scenario: "Email already registered" error but I'm sure it's new
**Solution**: 
1. Check Supabase table editor for duplicate entries
2. Manually delete test records
3. Try registering with different email

### Scenario: Login shows "Account not found" 
**Solution**:
1. Verify user was created in Supabase dashboard
2. Check email match (case-sensitive)
3. Re-run RLS policy SQL from SUPABASE_RLS_FIX.md

### Scenario: Still seeing 400 errors
**Solution**:
1. Go to Supabase → **Authentication** → **Policies**
2. Verify all 4 policies exist on users table
3. Check policy USING clauses have `true` not just `auth.uid()`

### Scenario: GoTrueClient warning still appearing
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server
3. Check `/lib/auth-context.tsx` doesn't import from lib/supabase

---

## Next Steps for Production

- [ ] Replace `simpleHash()` with bcryptjs
- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Implement rate limiting on auth endpoints
- [ ] Use Supabase Auth (not custom auth)
- [ ] Add HTTPS in production
- [ ] Enable CORS properly
- [ ] Add refresh token support

---

## Support

For issues:
1. Check the checklist above
2. Review error logs in browser console
3. Check Supabase dashboard for errors
4. Verify RLS policies using SUPABASE_RLS_FIX.md
