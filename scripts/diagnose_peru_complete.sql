-- Script de diagnóstico completo para la tabla de Perú

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'price_master_peru'
) as table_exists;

-- 2. Si existe, contar cuántos registros tiene
SELECT COUNT(*) as total_records 
FROM price_master_peru;

-- 3. Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master_peru'
ORDER BY ordinal_position;

-- 4. Ver algunos registros de ejemplo (si existen)
SELECT id, code, category_id, description, final_price, is_active
FROM price_master_peru
LIMIT 5;

-- 5. Contar precios por categoría
SELECT category_id, COUNT(*) as count
FROM price_master_peru
WHERE is_active = true
GROUP BY category_id
ORDER BY count DESC;

-- 6. Verificar las categorías disponibles
SELECT id, name, display_order
FROM price_categories
ORDER BY display_order;
