-- Script para convertir las columnas GENERATED ALWAYS en columnas normales
-- Esto permite insertar valores calculados directamente desde el código

-- 1. Eliminar las columnas generadas
ALTER TABLE price_master 
  DROP COLUMN IF EXISTS base_price CASCADE,
  DROP COLUMN IF EXISTS final_price CASCADE;

-- 2. Recrear las columnas como columnas normales (no generadas)
ALTER TABLE price_master 
  ADD COLUMN base_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN final_price NUMERIC(10,2) DEFAULT 0;

-- 3. Calcular y actualizar los valores para todos los registros existentes
UPDATE price_master
SET 
  base_price = COALESCE(labor_cost, 0) + COALESCE(material_cost, 0) + COALESCE(equipment_cost, 0) + COALESCE(other_cost, 0),
  final_price = (COALESCE(labor_cost, 0) + COALESCE(material_cost, 0) + COALESCE(equipment_cost, 0) + COALESCE(other_cost, 0)) * (1 + COALESCE(margin_percentage, 0) / 100);

-- 4. Hacer las columnas NOT NULL ahora que tienen valores
ALTER TABLE price_master 
  ALTER COLUMN base_price SET NOT NULL,
  ALTER COLUMN final_price SET NOT NULL;

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_base_price ON price_master(base_price);
CREATE INDEX IF NOT EXISTS idx_price_master_final_price ON price_master(final_price);

-- 6. Verificar que todo está correcto
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master'
  AND column_name IN ('base_price', 'final_price', 'labor_cost', 'material_cost', 'equipment_cost', 'other_cost')
ORDER BY column_name;
