-- DIAGNÓSTICO Y REPARACIÓN COMPLETA DE LA TABLA PROFILES
-- Ejecuta este script completo en Supabase SQL Editor

-- 1. DIAGNÓSTICO: Ver el estado actual
DO $$ 
BEGIN
    RAISE NOTICE '=== DIAGNÓSTICO INICIAL ===';
    
    -- Verificar si existe la tabla profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE '✓ Tabla profiles existe';
    ELSE
        RAISE NOTICE '✗ Tabla profiles NO existe';
    END IF;
    
    -- Verificar si existe el trigger
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        RAISE NOTICE '✓ Trigger on_auth_user_created existe';
    ELSE
        RAISE NOTICE '✗ Trigger on_auth_user_created NO existe';
    END IF;
END $$;

-- 2. LIMPIEZA COMPLETA: Eliminar todo lo existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. DESACTIVAR RLS TEMPORALMENTE
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;

-- 5. CREAR LA FUNCIÓN DEL TRIGGER (MUY SIMPLE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insertar solo el ID, nada más
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, registrarlo pero no fallar
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 6. CREAR EL TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. CREAR POLÍTICAS RLS MUY PERMISIVAS
CREATE POLICY "Allow all operations for authenticated users"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role all operations"
    ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 8. REACTIVAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. VERIFICACIÓN FINAL
DO $$ 
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        RAISE NOTICE '✓ Trigger creado correctamente';
    ELSE
        RAISE NOTICE '✗ ERROR: Trigger NO se creó';
    END IF;
    
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles') THEN
        RAISE NOTICE '✓ Políticas RLS creadas';
    ELSE
        RAISE NOTICE '✗ ERROR: No hay políticas RLS';
    END IF;
    
    RAISE NOTICE '=== CONFIGURACIÓN COMPLETADA ===';
END $$;
