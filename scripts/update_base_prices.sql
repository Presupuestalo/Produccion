-- Script para actualizar manualmente los valores de base_price
-- Ya que la columna generada no está funcionando

UPDATE price_master
SET base_price = labor_cost + material_cost + equipment_cost + other_cost
WHERE base_price = 0 OR base_price IS NULL;

-- Verificar los resultados
SELECT 
  code,
  subcategory,
  labor_cost,
  material_cost,
  equipment_cost,
  other_cost,
  base_price,
  (labor_cost + material_cost + equipment_cost + other_cost) as calculated_price
FROM price_master
ORDER BY code
LIMIT 20;
