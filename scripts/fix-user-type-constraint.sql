-- Fix user_type constraint to accept both Spanish and English values
-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add new constraint that accepts both languages
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('homeowner', 'professional', 'company', 'propietario', 'profesional'));

-- Update any existing 'propietario' to 'homeowner' for consistency
UPDATE profiles SET user_type = 'homeowner' WHERE user_type = 'propietario';
UPDATE profiles SET user_type = 'professional' WHERE user_type = 'profesional';

-- Also update any NULL user_type for users with lead_requests to 'homeowner'
UPDATE profiles 
SET user_type = 'homeowner' 
WHERE user_type IS NULL 
AND id IN (SELECT DISTINCT homeowner_id FROM lead_requests);
