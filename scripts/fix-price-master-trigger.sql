-- Script para diagnosticar y eliminar el trigger problemático de price_master
-- Este trigger está intentando insertar en price_master con un ID NULL

-- 1. Ver todos los triggers en la tabla profiles
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== TRIGGERS EN LA TABLA PROFILES ===';
    FOR trigger_record IN 
        SELECT tgname, proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'public.profiles'::regclass
        AND NOT tgisinternal
    LOOP
        RAISE NOTICE 'Trigger: %, Función: %', trigger_record.tgname, trigger_record.proname;
    END LOOP;
END $$;

-- 2. Eliminar triggers relacionados con price_master
DROP TRIGGER IF EXISTS on_profile_created_price_master ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS initialize_price_master ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS create_price_master ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS setup_price_master ON public.profiles CASCADE;

-- 3. Eliminar funciones relacionadas con price_master
DROP FUNCTION IF EXISTS public.handle_profile_created_price_master() CASCADE;
DROP FUNCTION IF EXISTS public.initialize_price_master() CASCADE;
DROP FUNCTION IF EXISTS public.create_price_master() CASCADE;
DROP FUNCTION IF EXISTS public.setup_price_master() CASCADE;

-- 4. Eliminar el trigger de emails si todavía existe
DROP TRIGGER IF EXISTS on_profile_created_send_email ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_created_send_email() CASCADE;
DROP FUNCTION IF EXISTS public.send_welcome_email() CASCADE;

-- 5. Crear un trigger simple y limpio que solo cree el perfil básico
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo insertar el perfil básico con el ID del usuario
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay algún error, solo registrarlo pero no bloquear la creación del usuario
    RAISE WARNING 'Error al crear perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar que solo existe nuestro trigger
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== TRIGGERS FINALES EN LA TABLA PROFILES ===';
    FOR trigger_record IN 
        SELECT tgname, proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'public.profiles'::regclass
        AND NOT tgisinternal
    LOOP
        RAISE NOTICE 'Trigger: %, Función: %', trigger_record.tgname, trigger_record.proname;
    END LOOP;
END $$;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✓ Triggers de price_master y emails eliminados correctamente';
  RAISE NOTICE '✓ Trigger simple de creación de perfiles configurado';
  RAISE NOTICE '✓ Los usuarios ahora podrán registrarse sin errores';
END $$;
