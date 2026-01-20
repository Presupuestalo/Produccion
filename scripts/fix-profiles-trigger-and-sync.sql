-- Reparar trigger de creación automática de perfiles y sincronizar usuarios existentes

-- Paso 1: Mostrar usuarios sin perfil
SELECT 
  u.id,
  u.email,
  u.created_at as usuario_creado
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Paso 2: Eliminar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Paso 3: Recrear función mejorada que establece valores por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar perfil con valores por defecto para propietarios
  INSERT INTO public.profiles (
    id,
    role,
    user_type,
    country,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    'homeowner',  -- Por defecto todos son propietarios
    'propietario',
    'ES',         -- País por defecto España
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, solo loguear pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Paso 4: Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Paso 5: Sincronizar usuarios existentes sin perfil
INSERT INTO public.profiles (id, role, user_type, country, created_at, updated_at)
SELECT 
  u.id,
  'homeowner',
  'propietario',
  'ES',
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Paso 6: Verificar sincronización
SELECT 
  COUNT(*) as total_usuarios_auth
FROM auth.users;

SELECT 
  COUNT(*) as total_perfiles
FROM public.profiles;

-- Paso 7: Mostrar todos los perfiles creados
SELECT 
  p.id,
  u.email,
  p.role,
  p.user_type,
  p.country,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
