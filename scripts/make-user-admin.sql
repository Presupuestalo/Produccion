-- Hacer administrador al usuario mikelfedzmcc@gmail.com

-- Primero verificar si el campo is_admin existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    -- Añadir la columna is_admin si no existe
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Columna is_admin creada';
  ELSE
    RAISE NOTICE 'Columna is_admin ya existe';
  END IF;
END $$;

-- Hacer administrador al usuario
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mikelfedzmcc@gmail.com'
);

-- Verificar el cambio
SELECT 
  u.email,
  p.is_admin,
  p.user_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mikelfedzmcc@gmail.com';
