-- Add personal data and country support to profiles table
-- This allows homeowners to store their complete personal information
-- and enables multi-country support for the application

-- Add personal information fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS dni_nif TEXT;

-- Add address fields for user's personal address
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_province TEXT,
ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ES';

-- Add avatar support
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index for country lookups
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);

-- Add comment to explain the purpose
COMMENT ON COLUMN profiles.country IS 'ISO country code (ES, FR, PT, IT, etc.) for user residence';
COMMENT ON COLUMN profiles.full_name IS 'Complete name for homeowners, company name for professionals';
COMMENT ON COLUMN profiles.dni_nif IS 'Tax ID - optional, used for billing purposes';
