-- Arreglar la columna ID de price_categories para que genere UUIDs automáticamente

-- 1. Verificar la estructura actual
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_categories'
  AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;

-- 2. Si la columna id es text sin default, agregar el default
ALTER TABLE price_categories 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. Actualizar cualquier registro que tenga id NULL (si existe)
UPDATE price_categories 
SET id = gen_random_uuid()::text 
WHERE id IS NULL;

-- 4. Verificar que todo está correcto
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_categories'
  AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;
