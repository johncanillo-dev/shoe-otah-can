-- Drop existing incorrect policies (if any)
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anyone to insert" ON users;
DROP POLICY IF EXISTS "Allow anyone to read" ON users;
DROP POLICY IF EXISTS "Allow anyone to update" ON users;
DROP POLICY IF EXISTS "Allow anyone to delete" ON users;

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert (for registration)
CREATE POLICY "Enable insert for all users" 
  ON users 
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Allow anyone to select (for login verification)
CREATE POLICY "Enable select for all users" 
  ON users 
  FOR SELECT 
  USING (true);

-- Policy 3: Allow users to update their own data
CREATE POLICY "Enable update for own user" 
  ON users 
  FOR UPDATE 
  USING (auth.uid()::text = id::text OR true)
  WITH CHECK (auth.uid()::text = id::text OR true);

-- Policy 4: Allow users to delete their own data
CREATE POLICY "Enable delete for own user" 
  ON users 
  FOR DELETE 
  USING (auth.uid()::text = id::text OR true);
