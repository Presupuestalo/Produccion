-- Script para corregir precios de PINTURA, LIMPIEZA y eliminar categoría duplicada de CALEFACCIÓN

-- Paso 1: Eliminar la categoría duplicada de CALEFACCIÓN (la que tiene códigos 06-CAL-01)
-- Primero eliminamos las partidas de esa categoría
DELETE FROM price_master 
WHERE category_id = (SELECT id FROM price_categories WHERE name = 'CALEFACCIÓN' AND display_order = 6 LIMIT 1)
AND code LIKE '06-CAL-01%';

-- Luego eliminamos la categoría duplicada (mantenemos la que tiene display_order = 6)
DELETE FROM price_categories 
WHERE name = 'CALEFACCIÓN' 
AND id IN (
  SELECT id FROM price_categories 
  WHERE name = 'CALEFACCIÓN' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Paso 2: Actualizar precios de PINTURA
UPDATE price_master SET labor_cost = 7.00, material_cost = 3.00 WHERE code = '09-P-01'; -- Pintura paredes: 10€/m²
UPDATE price_master SET labor_cost = 7.35, material_cost = 3.15 WHERE code = '09-P-02'; -- Pintura techos: 10.5€/m²
UPDATE price_master SET labor_cost = 175.00, material_cost = 75.00 WHERE code = '09-P-03'; -- Lacado puerta entrada: 250€/ud
UPDATE price_master SET labor_cost = 56.00, material_cost = 24.00 WHERE code = '09-P-04'; -- Lacado armarios: 80€/m²
UPDATE price_master SET labor_cost = 140.00, material_cost = 60.00 WHERE code = '09-P-05'; -- Lacado puertas interiores: 200€/ud

-- Paso 3: Actualizar precio de limpieza final a 250€
UPDATE price_master SET labor_cost = 175.00, material_cost = 75.00 WHERE code = '07-L-02'; -- Limpieza final: 250€
