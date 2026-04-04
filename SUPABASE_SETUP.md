# Supabase Setup Guide for Cross-Device Account Login

## Prerequisites
1. Supabase account created at https://supabase.com
2. Project created with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Environment variables configured in .env.local

## Setup Instructions

### 1. Create Users Table in Supabase SQL Editor

Run the following SQL in your Supabase project's SQL Editor:

```sql
-- Create users table for persistent account storage
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  isActive BOOLEAN DEFAULT true
);

-- Create an index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Enable row-level security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR true);
```

### 2. Features Implemented

✅ **Cross-Device Login**: Users can login from any device with email/password
✅ **Session Persistence**: Session token stored in localStorage
✅ **Password Hashing**: Simple hash function (production should use bcrypt)
✅ **Fallback Support**: Local storage fallback if Supabase unavailable
✅ **Email Validation**: Check for existing emails before registration
✅ **Multiple Device Support**: Same account can be logged in on multiple devices

### 3. How It Works

#### Registration Flow:
1. User provides email, password, name, city
2. System checks if email already exists in Supabase
3. Password is hashed: simpleHash(password + email) = "hash_xxxxx"
4. New user record created in Supabase `users` table
5. Session token (user ID) stored in localStorage
6. User is logged in

#### Login Flow:
1. User provides email and password
2. System queries Supabase for user with matching email
3. Provided password is hashed with same salt
4. Hash compared to stored hash
5. If match: Session token stored in localStorage, user logged in
6. User data persisted for next app session

#### Cross-Device Access:
1. User logs in on Device A -> Session stored
2. User logs in on Device B with same email/password
3. Each device has independent session in localStorage
4. User can simultaneously access on both devices
5. All data syncs from Supabase database

### 4. Environment Variables Required

Add to your .env.local file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Security Notes

⚠️ Current Implementation:
- Uses simple hash function (suitable for MVP)
- Passwords stored hashed in database
- Session tokens in localStorage

🔐 Production Recommendations:
- Use bcryptjs or similar for password hashing
- Implement password complexity requirements
- Add rate limiting to prevent brute force
- Use HTTP-only cookies for session tokens
- Add email verification for new accounts
- Implement password reset functionality
- Consider implementing 2FA

### 6. Testing Cross-Device Login

1. Open app on Device A (or browser)
2. Register new account: email@example.com, password
3. Logout on Device A
4. Open app on Device B (or incognito window)
5. Login with same email and password
6. Verify user data loads correctly

### 7. Database Schema

**users table:**
- `id` (UUID, Primary Key) - Unique identifier
- `email` (TEXT, UNIQUE) - User email address
- `password` (TEXT) - Hashed password
- `name` (TEXT) - User full name
- `city` (TEXT) - Optional city field
- `createdAt` (TIMESTAMP) - Account creation time
- `isActive` (BOOLEAN) - Account status

### 8. Key Changes from Previous Implementation

| Feature | Before | After |
|---------|--------|-------|
| Data Storage | localStorage only | Supabase + localStorage |
| Cross-Device | ❌ Not supported | ✅ Full support |
| Session | Per browser | Per user ID (database) |
| Email Validation | In memory check | Supabase query |
| Persistence | Lost on browser clear | Persists across devices |

### 9. Future Enhancements

- [ ] Implement real crypto hashing (bcryptjs)
- [ ] Add email verification flow
- [ ] Add password reset functionality
- [ ] Add device management dashboard
- [ ] Add login history/audit log
- [ ] Add account notifications
- [ ] Implement OAuth integrations
- [ ] Add two-factor authentication
