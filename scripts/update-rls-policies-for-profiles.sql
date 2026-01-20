-- Update RLS policies to ensure users can update their personal data
-- This is necessary for the new profile fields

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create updated policy allowing users to update all their profile fields
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);
