-- Script para arreglar definitivamente las políticas RLS de la tabla projects
-- Este script verifica y corrige los permisos de actualización

-- 1. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON projects;

-- 2. Crear política de UPDATE clara y específica
CREATE POLICY "users_can_update_own_projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Verificar que existan las demás políticas necesarias
-- Política de SELECT
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON projects;

CREATE POLICY "users_can_view_own_projects"
ON projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política de INSERT
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their projects" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;

CREATE POLICY "users_can_insert_projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política de DELETE
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;

CREATE POLICY "users_can_delete_own_projects"
ON projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Asegurar que RLS esté habilitado
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 5. Verificar la configuración
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY cmd, policyname;
