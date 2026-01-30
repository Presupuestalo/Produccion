-- Add professional_role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_role TEXT;

-- Comment on the column for clarity
COMMENT ON COLUMN profiles.professional_role IS 'Type of professional: Empresa, Coordinador de gremios, Diseñador, Arquitecto';
