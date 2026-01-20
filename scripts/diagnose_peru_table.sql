-- Diagnóstico de la tabla price_master_peru

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'price_master_peru'
) as table_exists;

-- 2. Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master_peru'
ORDER BY ordinal_position;

-- 3. Contar cuántos registros hay
SELECT COUNT(*) as total_prices FROM price_master_peru;

-- 4. Ver las categorías disponibles
SELECT id, name FROM price_categories ORDER BY display_order;

-- 5. Ver algunos registros de ejemplo si existen
SELECT id, code, description, final_price 
FROM price_master_peru 
LIMIT 5;
