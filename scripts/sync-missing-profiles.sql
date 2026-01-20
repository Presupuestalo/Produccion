-- Sincronizar usuarios de auth.users que no tienen perfil en profiles
-- Este script crea perfiles para usuarios existentes que no los tienen

-- Primero, verificar qué usuarios no tienen perfil
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Crear perfiles para usuarios sin perfil
-- Por defecto, todos los usuarios sin perfil se consideran propietarios (homeowners)
INSERT INTO public.profiles (
  id,
  role,
  user_type,
  country,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'homeowner' as role,
  'propietario' as user_type,
  'ES' as country,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT 
  p.id,
  au.email,
  p.role,
  p.user_type,
  p.country
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'presupuestaloficial@gmail.com';
