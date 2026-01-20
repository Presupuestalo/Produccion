-- Script para identificar y corregir precios maestros sin category_id
-- Primero ejecuta este SELECT para ver QUÉ precios no tienen categoría

SELECT 
  id,
  code,
  description,
  cost_labor,
  cost_materials,
  cost_total,
  unit
FROM master_prices 
WHERE category_id IS NULL
ORDER BY code;

-- Una vez identifiques los precios, descomenta y ajusta los UPDATEs según corresponda:

-- Ejemplo: Si son precios de DEMOLICIONES
-- UPDATE master_prices 
-- SET category_id = (SELECT id FROM price_categories WHERE name = 'Demoliciones')
-- WHERE id IN ('id-del-precio-1', 'id-del-precio-2');

-- Ejemplo: Si son precios de ALBAÑILERÍA
-- UPDATE master_prices 
-- SET category_id = (SELECT id FROM price_categories WHERE name = 'Albañilería')
-- WHERE id IN ('id-del-precio-3');

-- Ejemplo: Si son precios de ELECTRICIDAD
-- UPDATE master_prices 
-- SET category_id = (SELECT id FROM price_categories WHERE name = 'Electricidad')
-- WHERE id IN ('id-del-precio-4', 'id-del-precio-5');

-- Verificar que todos los precios ya tienen categoría:
-- SELECT COUNT(*) as precios_sin_categoria FROM master_prices WHERE category_id IS NULL;
