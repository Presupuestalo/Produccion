-- Script para corregir el problema de nombres de usuario
-- El problema: el trigger está usando 'full_name' pero el registro usa 'name'

-- Paso 1: Actualizar el trigger para usar el campo correcto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    -- Primero intenta 'name', luego 'full_name', por último el email
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    -- Solo actualiza full_name si viene un nombre válido (no email)
    full_name = CASE 
      WHEN EXCLUDED.full_name != EXCLUDED.email 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Paso 2: Corregir perfiles existentes que tienen el email como nombre
UPDATE public.profiles p
SET 
  full_name = COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(p.email, '@', 1)
  ),
  updated_at = now()
FROM auth.users au
WHERE p.id = au.id
  -- Solo actualizar si el full_name es igual al email (claramente incorrecto)
  AND p.full_name = p.email;

-- Paso 3: Verificar los cambios
SELECT 
  p.id,
  p.email,
  p.full_name,
  au.raw_user_meta_data->>'name' as metadata_name,
  au.raw_user_meta_data->>'full_name' as metadata_full_name,
  CASE 
    WHEN p.full_name = p.email THEN '❌ NOMBRE = EMAIL (MAL)'
    ELSE '✅ Correcto'
  END as estado
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 20;
