-- Script para sincronizar emails desde auth.users a profiles
-- y convertir phone_verified de string a boolean

-- 1. Sincronizar emails desde auth.users a profiles donde email es null
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 2. Sincronizar full_name desde user_metadata de auth.users donde full_name es null
UPDATE profiles p
SET full_name = COALESCE(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name',
  split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE p.id = u.id
AND (p.full_name IS NULL OR p.full_name = '');

-- 3. Verificar resultados
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.phone_verified,
  u.email as auth_email,
  u.raw_user_meta_data->>'name' as auth_name
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 20;
