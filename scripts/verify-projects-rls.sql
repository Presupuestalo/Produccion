-- Verificar estructura de la tabla projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- Verificar políticas RLS de la tabla projects
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
WHERE tablename = 'projects';

-- Ver proyectos creados recientemente (usando * para ver todas las columnas)
SELECT * 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;
