-- Arreglar las columnas base_price y final_price para que sean editables

-- 1. Eliminar cualquier restricción GENERATED en base_price y final_price
ALTER TABLE price_master 
  ALTER COLUMN base_price DROP DEFAULT,
  ALTER COLUMN final_price DROP DEFAULT;

-- 2. Hacer las columnas nullables temporalmente para poder actualizarlas
ALTER TABLE price_master 
  ALTER COLUMN base_price DROP NOT NULL,
  ALTER COLUMN final_price DROP NOT NULL;

-- 3. Actualizar valores NULL existentes con cálculos
UPDATE price_master 
SET 
  base_price = COALESCE(labor_cost, 0) + COALESCE(material_cost, 0) + COALESCE(equipment_cost, 0) + COALESCE(other_cost, 0),
  final_price = (COALESCE(labor_cost, 0) + COALESCE(material_cost, 0) + COALESCE(equipment_cost, 0) + COALESCE(other_cost, 0)) * (1 + COALESCE(margin_percentage, 0) / 100)
WHERE base_price IS NULL OR final_price IS NULL;

-- 4. Volver a hacer las columnas NOT NULL
ALTER TABLE price_master 
  ALTER COLUMN base_price SET NOT NULL,
  ALTER COLUMN final_price SET NOT NULL;

-- 5. Verificar la estructura
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  is_generated
FROM information_schema.columns
WHERE table_name = 'price_master'
  AND column_name IN ('id', 'base_price', 'final_price', 'created_at', 'updated_at')
ORDER BY column_name;
