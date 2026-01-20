-- Add accepted_terms column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_accepted_terms ON profiles(accepted_terms);

-- Add comment
COMMENT ON COLUMN profiles.accepted_terms IS 'Indica si el usuario ha aceptado los términos y condiciones';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Fecha y hora en que el usuario aceptó los términos';
