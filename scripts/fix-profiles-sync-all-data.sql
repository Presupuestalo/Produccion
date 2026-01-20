-- Script para sincronizar todos los datos faltantes en profiles desde auth.users
-- Y arreglar phone_verified

-- 1. Arreglar phone_verified para usuarios que ya verificaron
-- (Si tienen teléfono guardado, probablemente ya lo verificaron)
UPDATE public.profiles 
SET phone_verified = true
WHERE phone IS NOT NULL 
AND phone != '' 
AND (phone_verified IS NULL OR phone_verified = false OR phone_verified::text = 'false');

-- 2. Sincronizar emails faltantes desde auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 3. Sincronizar nombres faltantes desde auth.users (user_metadata.name de Google)
UPDATE public.profiles p
SET full_name = COALESCE(
  u.raw_user_meta_data->>'name',
  u.raw_user_meta_data->>'full_name',
  split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE p.id = u.id
AND (p.full_name IS NULL OR p.full_name = '');

-- 4. Sincronizar avatars faltantes desde auth.users (Google avatar)
UPDATE public.profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE p.id = u.id
AND (p.avatar_url IS NULL OR p.avatar_url = '')
AND (u.raw_user_meta_data->>'avatar_url' IS NOT NULL OR u.raw_user_meta_data->>'picture' IS NOT NULL);

-- 5. Verificar los cambios
SELECT 
  p.email,
  p.full_name,
  p.avatar_url IS NOT NULL as has_avatar,
  p.phone,
  p.phone_verified,
  p.user_type
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 20;
