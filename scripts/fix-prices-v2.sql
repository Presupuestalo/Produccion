-- Añadiendo eliminación de partidas de price_master_bolivia y otras tablas por país

-- Eliminar partidas de todas las tablas price_master_* que hacen referencia a VENTANAS
DELETE FROM price_master_peru WHERE category_id = 'ea0fa2aa-a638-438a-9a50-a9b4e6faae41';
DELETE FROM price_master_bolivia WHERE category_id = 'ea0fa2aa-a638-438a-9a50-a9b4e6faae41';
DELETE FROM price_master WHERE category_id = 'ea0fa2aa-a638-438a-9a50-a9b4e6faae41';

-- Eliminar categoría VENTANAS
DELETE FROM price_categories WHERE id = 'ea0fa2aa-a638-438a-9a50-a9b4e6faae41';

-- Eliminar partidas de todas las tablas price_master_* que hacen referencia a CALEFACCIÓN duplicada
DELETE FROM price_master_peru WHERE category_id = '5090928c-9b72-4d83-8667-9d01ddbfca47';
DELETE FROM price_master_bolivia WHERE category_id = '5090928c-9b72-4d83-8667-9d01ddbfca47';
DELETE FROM price_master WHERE category_id = '5090928c-9b72-4d83-8667-9d01ddbfca47';

-- Eliminar categoría duplicada de CALEFACCIÓN (la que tiene códigos 06-CAL-01)
DELETE FROM price_categories WHERE id = '5090928c-9b72-4d83-8667-9d01ddbfca47';

-- Actualizar precios de PINTURA con los valores correctos
UPDATE price_master 
SET 
  labor_cost = 7.0,
  material_cost = 3.0,
  base_price = 10.0,
  final_price = 10.0
WHERE code = '09-P-01';

UPDATE price_master 
SET 
  labor_cost = 7.35,
  material_cost = 3.15,
  base_price = 10.5,
  final_price = 10.5
WHERE code = '09-P-02';

UPDATE price_master 
SET 
  labor_cost = 175.0,
  material_cost = 75.0,
  base_price = 250.0,
  final_price = 250.0
WHERE code = '09-P-03';

UPDATE price_master 
SET 
  labor_cost = 56.0,
  material_cost = 24.0,
  base_price = 80.0,
  final_price = 80.0
WHERE code = '09-P-04';

UPDATE price_master 
SET 
  labor_cost = 140.0,
  material_cost = 60.0,
  base_price = 200.0,
  final_price = 200.0
WHERE code = '09-P-05';

-- Actualizar precio de limpieza final a 250€
UPDATE price_master 
SET 
  labor_cost = 175.0,
  material_cost = 75.0,
  base_price = 250.0,
  final_price = 250.0
WHERE code = '07-L-02';
