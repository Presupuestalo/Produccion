-- Script para marcar teléfonos como verificados para usuarios que ya tienen número guardado
-- Ejecutar: Este script marca phone_verified = true para todos los perfiles que tienen un teléfono guardado

-- 1. Ver el estado actual de phone_verified
SELECT id, email, phone, phone_verified, typeof(phone_verified) as tipo_phone_verified
FROM profiles 
WHERE phone IS NOT NULL AND phone != ''
ORDER BY created_at DESC;

-- 2. Actualizar phone_verified a TRUE (boolean) para todos los que tienen teléfono
UPDATE profiles 
SET phone_verified = true
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (phone_verified IS NULL OR phone_verified = false OR phone_verified = 'false');

-- 3. Específicamente para propietariopresupuestalo1@gmail.com
UPDATE profiles 
SET phone_verified = true
WHERE email = 'propietariopresupuestalo1@gmail.com'
   OR email LIKE '%propietario%';

-- 4. Verificar el resultado
SELECT id, email, phone, phone_verified
FROM profiles 
WHERE phone IS NOT NULL AND phone != ''
ORDER BY created_at DESC;
