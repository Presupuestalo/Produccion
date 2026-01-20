-- Diagnóstico completo de precios en la base de datos

-- 1. Contar precios por categoría
SELECT 
  pc.name as categoria,
  COUNT(pm.id) as total_precios,
  COUNT(CASE WHEN pm.base_price > 0 THEN 1 END) as precios_con_valor,
  COUNT(CASE WHEN pm.base_price = 0 THEN 1 END) as precios_en_cero
FROM price_categories pc
LEFT JOIN price_master pm ON pm.category_id = pc.id
GROUP BY pc.id, pc.name
ORDER BY pc.display_order;

-- 2. Ver algunos precios de ejemplo con sus costos
SELECT 
  pm.code,
  pc.name as categoria,
  pm.subcategory,
  pm.labor_cost,
  pm.material_cost,
  pm.equipment_cost,
  pm.other_cost,
  pm.base_price,
  pm.is_custom
FROM price_master pm
JOIN price_categories pc ON pm.category_id = pc.id
ORDER BY pm.code
LIMIT 20;

-- 3. Total de precios en la base de datos
SELECT COUNT(*) as total_precios FROM price_master;

-- 4. Ver si hay precios con costos pero base_price en 0
SELECT 
  code,
  labor_cost,
  material_cost,
  equipment_cost,
  other_cost,
  base_price
FROM price_master
WHERE (labor_cost > 0 OR material_cost > 0 OR equipment_cost > 0 OR other_cost > 0)
  AND base_price = 0
LIMIT 10;
