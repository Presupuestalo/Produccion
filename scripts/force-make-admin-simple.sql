-- Script super simple para hacer admin al usuario mikelfedz@gmail.com
-- Solo actualiza el campo is_admin sin hacer verificaciones complejas

UPDATE profiles 
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'mikelfedz@gmail.com');

-- Mostrar resultado
SELECT 
  u.email,
  p.is_admin,
  p.user_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mikelfedz@gmail.com';
