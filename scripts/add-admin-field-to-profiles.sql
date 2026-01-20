-- Añadir campo is_admin a profiles para el usuario maestro
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Marcar mikelfedz@gmail.com como admin
UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'mikelfedz@gmail.com'
);

-- Añadir índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

COMMENT ON COLUMN profiles.is_admin IS 'Usuario administrador maestro con acceso completo al marketplace';
