-- Actualizar precios de PINTURA
UPDATE price_master 
SET 
  labor_cost = 7.0,
  material_cost = 3.0
WHERE code = '09-P-01';

UPDATE price_master 
SET 
  labor_cost = 7.35,
  material_cost = 3.15
WHERE code = '09-P-02';

UPDATE price_master 
SET 
  labor_cost = 175.0,
  material_cost = 75.0
WHERE code = '09-P-03';

UPDATE price_master 
SET 
  labor_cost = 56.0,
  material_cost = 24.0
WHERE code = '09-P-04';

UPDATE price_master 
SET 
  labor_cost = 140.0,
  material_cost = 60.0
WHERE code = '09-P-05';

-- Actualizar precio de limpieza final a 250€
UPDATE price_master 
SET 
  labor_cost = 175.0,
  material_cost = 75.0
WHERE code = '07-L-02';
