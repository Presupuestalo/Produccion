-- Script para limpiar TODOS los triggers y funciones relacionados con emails
-- y dejar solo el trigger básico de creación de perfiles

-- Paso 1: Eliminar TODOS los triggers en la tabla profiles
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.profiles'::regclass
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.profiles CASCADE', trigger_record.tgname);
        RAISE NOTICE 'Eliminado trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Paso 2: Eliminar TODAS las funciones relacionadas con perfiles y emails
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.send_welcome_email() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_creation() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- Paso 3: Crear una función SIMPLE que solo cree el perfil sin enviar emails
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
    -- Si hay error, registrarlo pero no bloquear el registro
    RAISE WARNING 'Error al crear perfil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Paso 4: Crear el trigger simple
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Paso 5: Verificar que todo está correcto
DO $$
BEGIN
  RAISE NOTICE '✅ Limpieza completada';
  RAISE NOTICE 'Triggers actuales en profiles:';
END $$;

SELECT 
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass;
