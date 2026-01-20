-- Actualizar el rol de usuario a homeowner para propietarios
-- Este script corrige usuarios que tienen role='user' cuando deberían ser 'homeowner'

-- Actualizar usuarios que son propietarios pero tienen role='user'
UPDATE profiles 
SET 
  role = 'homeowner',
  user_type = 'propietario'
WHERE 
  email = 'mikelfedz@gmail.com' -- Tu email
  OR (user_type IS NULL AND role = 'user'); -- Otros usuarios sin tipo definido

-- Verificar la actualización
SELECT id, email, role, user_type, country
FROM profiles
WHERE email = 'mikelfedz@gmail.com';
