-- Script para configurar trigger de perfiles (versión simple y robusta)
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar trigger existente si hay alguno
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Desactivar RLS temporalmente para configuración
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;

-- 4. Crear función simple que solo inserta el ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo insertar el ID, nada más
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 5. Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Configurar políticas RLS muy permisivas
CREATE POLICY "Allow all authenticated users to insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. Reactivar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Verificar que todo está correcto
SELECT 
  'Trigger configurado correctamente' as status,
  COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
