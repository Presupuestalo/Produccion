-- Actualizar precios de pintura según especificaciones
-- PINTURA DE PAREDES: 10.10€/m²
-- PINTURA DE TECHOS: 10.15€/m²
-- LACADO PUERTA ENTRADA: 250€/ud
-- LACADO DE ARMARIOS: 60€/m²
-- LACADO DE PUERTAS INTERIORES: 90€/ud

-- Updated to use correct column names: labor_cost, material_cost, base_price, final_price

-- Actualizar PINTURA DE PAREDES (09-P-01) a 10.10€/m²
UPDATE price_master
SET 
  labor_cost = 7.07,
  material_cost = 3.03,
  base_price = 10.10,
  final_price = 10.10,
  updated_at = NOW()
WHERE code = '09-P-01' AND is_custom = false;

-- Actualizar PINTURA DE TECHOS (09-P-02) a 10.15€/m²
UPDATE price_master
SET 
  labor_cost = 7.105,
  material_cost = 3.045,
  base_price = 10.15,
  final_price = 10.15,
  updated_at = NOW()
WHERE code = '09-P-02' AND is_custom = false;

-- Actualizar LACADO DE PUERTA DE ENTRADA (09-P-03) a 250€/ud
UPDATE price_master
SET 
  labor_cost = 175.0,
  material_cost = 75.0,
  base_price = 250.0,
  final_price = 250.0,
  updated_at = NOW()
WHERE code = '09-P-03' AND is_custom = false;

-- Actualizar LACADO DE ARMARIOS (09-P-04) a 60€/m²
UPDATE price_master
SET 
  labor_cost = 42.0,
  material_cost = 18.0,
  base_price = 60.0,
  final_price = 60.0,
  updated_at = NOW()
WHERE code = '09-P-04' AND is_custom = false;

-- Actualizar LACADO DE PUERTAS INTERIORES (09-P-05) a 90€/ud
UPDATE price_master
SET 
  labor_cost = 63.0,
  material_cost = 27.0,
  base_price = 90.0,
  final_price = 90.0,
  updated_at = NOW()
WHERE code = '09-P-05' AND is_custom = false;

-- Fixed SELECT query to use 'description' instead of 'concept'
-- Verificar que los precios se hayan actualizado correctamente
SELECT 
  code,
  description,
  unit,
  labor_cost,
  material_cost,
  base_price,
  final_price
FROM price_master
WHERE code LIKE '09-P-%' AND is_custom = false
ORDER BY code;
