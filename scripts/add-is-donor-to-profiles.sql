-- Add is_donor column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_donor BOOLEAN DEFAULT FALSE;

-- Comment on the column for clarity
COMMENT ON COLUMN profiles.is_donor IS 'True if the user has subscribed to the donation/support plan';
