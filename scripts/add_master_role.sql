-- Añadir columna role a la tabla profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Establecer el usuario mikelfedz@gmail.com como master
UPDATE profiles 
SET role = 'master'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'mikelfedz@gmail.com'
);

-- Crear índice para búsquedas rápidas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Mostrar el resultado
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.country
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'master';
