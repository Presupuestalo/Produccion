-- Script para hacer a mikelfedz@gmail.com administrador
-- Este usuario será el master admin de la plataforma

-- Verificar si la columna is_admin existe, crearla si no
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna is_admin creada en profiles';
    ELSE
        RAISE NOTICE 'Columna is_admin ya existe';
    END IF;
END $$;

-- Actualizar el usuario mikelfedz@gmail.com como administrador
UPDATE profiles
SET is_admin = true
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'mikelfedz@gmail.com'
);

-- Verificar el cambio
SELECT 
    u.email,
    p.is_admin,
    p.user_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mikelfedz@gmail.com';
