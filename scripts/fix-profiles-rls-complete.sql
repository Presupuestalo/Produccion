-- ============================================
-- FIX COMPLETO DE PROFILES: RLS + DATOS
-- Ejecutar para solucionar problemas de lectura
-- ============================================

-- 1. Primero, desactivar RLS temporalmente para poder hacer cambios
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes de profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Reactivar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas SIMPLES y CLARAS

-- Los usuarios pueden ver su propio perfil (TODOS los campos)
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Service role puede hacer todo (para triggers y funciones del servidor)
CREATE POLICY "profiles_service_role_all"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Profesionales pueden ver perfiles básicos de propietarios (para ver nombre del cliente)
CREATE POLICY "profiles_professionals_view_homeowners"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_type = 'homeowner' 
    AND EXISTS (
        SELECT 1 FROM professional_proposals pp
        JOIN lead_requests lr ON lr.id = pp.lead_request_id
        JOIN projects p ON p.id = lr.project_id
        WHERE p.user_id = profiles.id
        AND pp.professional_id = auth.uid()
    )
);

-- 5. Sincronizar datos de auth.users a profiles
UPDATE public.profiles p
SET 
    email = COALESCE(p.email, u.email),
    full_name = COALESCE(
        p.full_name, 
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
    ),
    avatar_url = COALESCE(
        p.avatar_url, 
        u.raw_user_meta_data->>'avatar_url',
        u.raw_user_meta_data->>'picture'
    ),
    phone_verified = CASE 
        WHEN p.phone IS NOT NULL AND p.phone != '' THEN true
        ELSE COALESCE(p.phone_verified, false)
    END
FROM auth.users u
WHERE p.id = u.id;

-- 6. Verificar que todo está correcto
SELECT 
    id,
    email,
    full_name,
    phone,
    phone_verified,
    avatar_url,
    user_type
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
