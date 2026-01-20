-- Agregar conceptos faltantes de demolición: RETIRAR CALDERA y RETIRAR TERMO ELÉCTRICO

-- Obtener el ID de la categoría DERRIBOS
DO $$
DECLARE
  derribos_category_id TEXT;
BEGIN
  SELECT id INTO derribos_category_id 
  FROM price_categories 
  WHERE name IN ('DERRIBOS', 'DERRIBO') 
  LIMIT 1;

  IF derribos_category_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría DERRIBOS';
  END IF;

  -- Insertar RETIRAR CALDERA si no existe
  IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '01-D-17') THEN
    INSERT INTO price_master (
      id, 
      code, 
      category_id, 
      subcategory, 
      description, 
      unit, 
      labor_cost, 
      material_cost, 
      equipment_cost, 
      other_cost, 
      is_custom, 
      user_id
    ) VALUES (
      gen_random_uuid()::text,
      '01-D-17',
      derribos_category_id,
      'RETIRAR CALDERA',
      'Desmontaje y retirada de caldera de gas o gasóleo existente.',
      'Ud',
      120.96,
      51.84,
      0,
      0,
      false,
      NULL::uuid
    );
    RAISE NOTICE 'Insertado precio 01-D-17: RETIRAR CALDERA';
  ELSE
    RAISE NOTICE 'El código 01-D-17 ya existe, no se inserta';
  END IF;

  -- Insertar RETIRAR TERMO ELÉCTRICO si no existe
  IF NOT EXISTS (SELECT 1 FROM price_master WHERE code = '01-D-18') THEN
    INSERT INTO price_master (
      id, 
      code, 
      category_id, 
      subcategory, 
      description, 
      unit, 
      labor_cost, 
      material_cost, 
      equipment_cost, 
      other_cost, 
      is_custom, 
      user_id
    ) VALUES (
      gen_random_uuid()::text,
      '01-D-18',
      derribos_category_id,
      'RETIRAR TERMO ELÉCTRICO',
      'Desmontaje y retirada de termo eléctrico existente.',
      'Ud',
      72.00,
      30.86,
      0,
      0,
      false,
      NULL::uuid
    );
    RAISE NOTICE 'Insertado precio 01-D-18: RETIRAR TERMO ELÉCTRICO';
  ELSE
    RAISE NOTICE 'El código 01-D-18 ya existe, no se inserta';
  END IF;

  -- Mostrar resumen
  RAISE NOTICE 'Proceso completado. Verificando precios de demolición...';
  
END $$;

-- Verificar que los precios se insertaron correctamente
SELECT code, subcategory, description, labor_cost + material_cost as total_price, unit
FROM price_master
WHERE code IN ('01-D-17', '01-D-18')
ORDER BY code;
