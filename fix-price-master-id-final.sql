-- Solución: Mantener id como text y quitar el default problemático
-- Los IDs personalizados como "01-D-01" deben mantenerse como text

-- 1. Quitar el default de gen_random_uuid() que causa problemas
ALTER TABLE public.price_master 
ALTER COLUMN id DROP DEFAULT;

-- 2. Verificar la estructura
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master'
  AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;
