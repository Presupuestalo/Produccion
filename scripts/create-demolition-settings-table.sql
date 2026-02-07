-- Script para crear la tabla demolition_settings si no existe

-- Crear la tabla
CREATE TABLE IF NOT EXISTS demolition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Crear índice para búsquedas rápidas por project_id
CREATE INDEX IF NOT EXISTS idx_demolition_settings_project_id ON demolition_settings(project_id);

-- Habilitar RLS
ALTER TABLE demolition_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen (para evitar errores de duplicados)
DROP POLICY IF EXISTS "Users can view demolition settings for their own projects" ON demolition_settings;
DROP POLICY IF EXISTS "Users can insert demolition settings for their own projects" ON demolition_settings;
DROP POLICY IF EXISTS "Users can update demolition settings for their own projects" ON demolition_settings;
DROP POLICY IF EXISTS "Users can delete demolition settings for their own projects" ON demolition_settings;

-- Política para SELECT: Los usuarios solo pueden ver los ajustes de sus propios proyectos
CREATE POLICY "Users can view demolition settings for their own projects" 
ON demolition_settings 
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Política para INSERT: Los usuarios solo pueden crear ajustes para sus propios proyectos
CREATE POLICY "Users can insert demolition settings for their own projects" 
ON demolition_settings 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Política para UPDATE: Los usuarios solo pueden actualizar ajustes de sus propios proyectos
CREATE POLICY "Users can update demolition settings for their own projects" 
ON demolition_settings 
FOR UPDATE 
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Política para DELETE: Los usuarios solo pueden eliminar ajustes de sus propios proyectos
CREATE POLICY "Users can delete demolition settings for their own projects" 
ON demolition_settings 
FOR DELETE 
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);
