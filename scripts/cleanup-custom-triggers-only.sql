-- Script para eliminar solo los triggers personalizados (no los del sistema)
-- y recrear el trigger de creación de perfiles sin envío de emails

-- 1. Eliminar solo los triggers personalizados que creamos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON public.profiles CASCADE;

-- 2. Eliminar las funciones personalizadas relacionadas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.send_welcome_email() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_created() CASCADE;

-- 3. Crear una función simple para crear perfiles automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo insertar el perfil básico, sin enviar emails
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay algún error, registrarlo pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Crear el trigger en auth.users (se ejecuta cuando se crea un usuario)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Asegurar que las políticas RLS permitan la inserción
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 6. Recrear políticas RLS permisivas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserción de perfiles" ON public.profiles;

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Permitir inserción de perfiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 7. Reactivar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers personalizados eliminados y recreados correctamente';
  RAISE NOTICE '✅ Función handle_new_user() creada sin envío de emails';
  RAISE NOTICE '✅ Políticas RLS configuradas correctamente';
END $$;
