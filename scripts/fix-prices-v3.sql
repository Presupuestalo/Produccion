DO $$
DECLARE
  table_name text;
BEGIN
  -- Eliminar partidas de VENTANAS de todas las tablas price_master_*
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'price_master%'
  LOOP
    EXECUTE format('DELETE FROM %I WHERE category_id = %L', 
      table_name, 
      'ea0fa2aa-a638-438a-9a50-a9b4e6faae41'
    );
  END LOOP;
  
  -- Eliminar partidas de CALEFACCIÓN duplicada de todas las tablas price_master_*
  FOR table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'price_master%'
  LOOP
    EXECUTE format('DELETE FROM %I WHERE category_id = %L', 
      table_name, 
      '5090928c-9b72-4d83-8667-9d01ddbfca47'
    );
  END LOOP;
END $$;

-- Eliminar categoría VENTANAS
DELETE FROM price_categories WHERE id = 'ea0fa2aa-a638-438a-9a50-a9b4e6faae41';

-- Eliminar categoría duplicada de CALEFACCIÓN
DELETE FROM price_categories WHERE id = '5090928c-9b72-4d83-8667-9d01ddbfca47';

-- Actualizar precios de PINTURA
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
