-- Añadir campo is_admin para el usuario maestro del marketplace
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Marcar mikelfedz@gmail.com como administrador
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'mikelfedz@gmail.com';

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Comentarios
COMMENT ON COLUMN profiles.is_admin IS 'Usuario administrador con acceso completo al marketplace';
