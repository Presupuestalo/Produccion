-- Añadir columnas de aceptación de términos y privacidad a profiles
-- Ejecutar en Supabase SQL Editor

-- Añadir columna accepted_terms
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false;

-- Añadir columna accepted_privacy
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_privacy BOOLEAN DEFAULT false;

-- Añadir columna marketing_consent
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Añadir columna accepted_at para registrar cuándo aceptó
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Crear índice para búsquedas por marketing_consent
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent 
ON profiles(marketing_consent) 
WHERE marketing_consent = true;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN profiles.accepted_terms IS 'Usuario aceptó los términos y condiciones';
COMMENT ON COLUMN profiles.accepted_privacy IS 'Usuario aceptó la política de privacidad';
COMMENT ON COLUMN profiles.marketing_consent IS 'Usuario aceptó recibir comunicaciones de marketing';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Fecha y hora de aceptación de términos';
