-- Script para establecer un usuario como profesional
-- Reemplaza 'tu-email@gmail.com' con el email del usuario

UPDATE profiles
SET user_type = 'professional'
WHERE email = 'mikelfedzmcc@gmail.com';

-- Verificar el cambio
SELECT id, email, user_type, full_name
FROM profiles
WHERE email = 'mikelfedzmcc@gmail.com';
