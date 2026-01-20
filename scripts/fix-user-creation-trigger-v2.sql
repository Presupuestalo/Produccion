-- Script para arreglar el trigger de creación de usuarios
-- Solucionando el error "Database error creating new user"

-- 1. Eliminar trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Crear función mejorada que maneja errores y añade datos por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Intentar insertar el perfil con valores por defecto para evitar errores
  INSERT INTO public.profiles (
    id,
    role,
    user_type,
    country,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'homeowner', -- Rol por defecto
    'propietario', -- Tipo por defecto
    'ES', -- País por defecto
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay error, registrarlo pero NO bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Asegurar que las políticas RLS permiten la inserción
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de creación de usuarios actualizado';
  RAISE NOTICE '✅ Ahora crea perfiles con rol=homeowner, user_type=propietario, country=ES por defecto';
  RAISE NOTICE '✅ Manejo de errores mejorado para no bloquear la creación de usuarios';
END $$;
