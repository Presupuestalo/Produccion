-- Script para capturar avatares de Google OAuth y permitir cambio de avatar

-- Paso 1: Actualizar el trigger para capturar avatar_url de Google OAuth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    -- Primero intenta 'name', luego 'full_name', por último el email
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    -- Capturar avatar_url de Google OAuth
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN EXCLUDED.full_name != EXCLUDED.email 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    -- Actualizar avatar_url si viene de OAuth y el perfil no tiene uno custom
    avatar_url = CASE
      WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = ''
      THEN EXCLUDED.avatar_url
      ELSE public.profiles.avatar_url
    END,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 2: Actualizar perfiles existentes que no tienen avatar pero tienen uno en OAuth
UPDATE public.profiles p
SET 
  avatar_url = au.raw_user_meta_data->>'avatar_url',
  updated_at = now()
FROM auth.users au
WHERE p.id = au.id
  AND (p.avatar_url IS NULL OR p.avatar_url = '')
  AND au.raw_user_meta_data->>'avatar_url' IS NOT NULL;

-- Paso 3: Verificar los cambios
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  au.raw_user_meta_data->>'avatar_url' as oauth_avatar,
  CASE 
    WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN '✅ Tiene avatar'
    ELSE '❌ Sin avatar'
  END as estado_avatar
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 20;
