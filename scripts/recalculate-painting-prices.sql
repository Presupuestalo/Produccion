-- Forzar recálculo de base_price y final_price para las partidas de PINTURA
-- Las columnas base_price y final_price son columnas generadas que se calculan automáticamente

-- Actualizar PINTURA DE PAREDES (09-P-01) a 10€/m²
UPDATE price_master
SET 
  labor_cost = 7.0,
  material_cost = 3.0,
  equipment_cost = 0,
  other_cost = 0
WHERE code = '09-P-01';

-- Actualizar PINTURA DE TECHOS (09-P-02) a 10.5€/m²
UPDATE price_master
SET 
  labor_cost = 7.35,
  material_cost = 3.15,
  equipment_cost = 0,
  other_cost = 0
WHERE code = '09-P-02';

-- Actualizar LACADO DE PUERTA DE ENTRADA (09-P-03) a 250€/ud
UPDATE price_master
SET 
  labor_cost = 175.0,
  material_cost = 75.0,
  equipment_cost = 0,
  other_cost = 0
WHERE code = '09-P-03';

-- Actualizar LACADO DE ARMARIOS (09-P-04) a 80€/m²
UPDATE price_master
SET 
  labor_cost = 56.0,
  material_cost = 24.0,
  equipment_cost = 0,
  other_cost = 0
WHERE code = '09-P-04';

-- Actualizar LACADO DE PUERTAS INTERIORES (09-P-05) a 200€/ud
UPDATE price_master
SET 
  labor_cost = 140.0,
  material_cost = 60.0,
  equipment_cost = 0,
  other_cost = 0
WHERE code = '09-P-05';

-- Verificar que los precios se hayan actualizado correctamente
SELECT 
  code,
  description,
  labor_cost,
  material_cost,
  equipment_cost,
  other_cost,
  base_price,
  final_price
FROM price_master
WHERE code LIKE '09-P-%'
ORDER BY code;
