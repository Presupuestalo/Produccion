-- Script para verificar y corregir el estado phone_verified de usuarios
-- Ejecuta esto para ver el estado actual de los perfiles

SELECT 
  id, 
  email, 
  full_name, 
  phone, 
  phone_verified,
  created_at
FROM profiles 
WHERE phone IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Si necesitas marcar un teléfono como verificado manualmente, usa:
-- UPDATE profiles SET phone_verified = true WHERE email = 'tu-email@ejemplo.com';
