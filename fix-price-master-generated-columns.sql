-- Script para arreglar las columnas GENERATED en price_master
-- Problema: base_price y final_price están configuradas como GENERATED ALWAYS
-- Solución: Eliminar la restricción GENERATED y permitir inserción directa

-- 1. Verificar la estructura actual
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'price_master'
  AND column_name IN ('base_price', 'final_price', 'unit_cost', 'labor_cost', 'material_cost', 'profit_margin', 'iva')
ORDER BY ordinal_position;

-- 2. Eliminar las columnas GENERATED y recrearlas como columnas normales
ALTER TABLE price_master 
  DROP COLUMN IF EXISTS base_price CASCADE;

ALTER TABLE price_master 
  DROP COLUMN IF EXISTS final_price CASCADE;

-- 3. Agregar las columnas como NUMERIC normales (no GENERATED)
ALTER TABLE price_master 
  ADD COLUMN base_price NUMERIC(10, 2);

ALTER TABLE price_master 
  ADD COLUMN final_price NUMERIC(10, 2);

-- 4. Calcular y actualizar los valores para los registros existentes
UPDATE price_master
SET 
  base_price = COALESCE(unit_cost, 0) + COALESCE(labor_cost, 0) + COALESCE(material_cost, 0),
  final_price = (COALESCE(unit_cost, 0) + COALESCE(labor_cost, 0) + COALESCE(material_cost, 0)) * 
                (1 + COALESCE(profit_margin, 0) / 100) * 
                (1 + COALESCE(iva, 0) / 100)
WHERE base_price IS NULL OR final_price IS NULL;

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_base_price ON price_master(base_price);
CREATE INDEX IF NOT EXISTS idx_price_master_final_price ON price_master(final_price);

-- 6. Verificar que todo está correcto
SELECT 
  column_name,
  data_type,
  is_nullable,
  is_generated
FROM information_schema.columns
WHERE table_name = 'price_master'
  AND column_name IN ('base_price', 'final_price')
ORDER BY column_name;
