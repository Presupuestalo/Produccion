-- Script definitivo para arreglar RLS en profiles
-- Ejecutar con rol postgres o superadmin

-- 1. Primero, deshabilitamos RLS temporalmente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos TODAS las políticas existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-habilitamos RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Creamos políticas simples y claras

-- Política para SELECT: usuarios pueden leer su propio perfil completo
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política para INSERT: usuarios pueden crear su propio perfil
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para DELETE: usuarios pueden eliminar su propio perfil
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 5. Verificamos que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Sincronizamos datos desde auth.users
UPDATE profiles p
SET 
  email = COALESCE(p.email, u.email),
  full_name = COALESCE(p.full_name, u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name'),
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar_url'),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.full_name IS NULL OR p.avatar_url IS NULL);

-- 7. Verificamos que phone_verified sea boolean true donde hay teléfono
UPDATE profiles 
SET phone_verified = true 
WHERE phone IS NOT NULL 
AND phone != '' 
AND (phone_verified IS NULL OR phone_verified = false);

-- 8. Mostramos los perfiles actualizados para verificar
SELECT id, email, full_name, phone, phone_verified, user_type 
FROM profiles 
ORDER BY updated_at DESC
LIMIT 10;
