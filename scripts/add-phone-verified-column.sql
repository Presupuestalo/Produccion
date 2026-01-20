-- Add phone_verified column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified 
ON profiles(phone_verified);

COMMENT ON COLUMN profiles.phone_verified IS 'Indica si el teléfono ha sido verificado mediante SMS';
