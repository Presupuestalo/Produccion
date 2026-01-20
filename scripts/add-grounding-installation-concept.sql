-- Buscar dinámicamente el ID de la categoría ELECTRICIDAD en lugar de usar un UUID hardcodeado
-- Agregar concepto de Instalación de toma de tierra
-- Este concepto se agregará automáticamente cuando se requiera nueva instalación eléctrica

DO $$
DECLARE
  v_category_id TEXT;
BEGIN
  -- Buscar el ID de la categoría ELECTRICIDAD
  SELECT id INTO v_category_id
  FROM price_categories
  WHERE name = 'ELECTRICIDAD'
  LIMIT 1;

  -- Verificar que la categoría existe
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría ELECTRICIDAD en price_categories';
  END IF;

  -- Insertar el concepto de toma de tierra
  INSERT INTO price_master (
    id,
    code,
    category_id,
    subcategory,
    description,
    unit,
    material_cost,
    labor_cost,
    base_price,
    profit_margin,
    final_price,
    is_custom,
    is_active
  ) VALUES (
    gen_random_uuid()::text, -- Cast UUID to TEXT
    '02-E-10',
    v_category_id,
    'Instalaciones generales',
    'INSTALACIÓN DE TOMA DE TIERRA',
    'Ud',
    45.00,
    85.00,
    130.00,
    15.00,
    149.50,
    false,
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    description = EXCLUDED.description,
    subcategory = EXCLUDED.subcategory,
    material_cost = EXCLUDED.material_cost,
    labor_cost = EXCLUDED.labor_cost,
    base_price = EXCLUDED.base_price,
    profit_margin = EXCLUDED.profit_margin,
    final_price = EXCLUDED.final_price,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE 'Concepto de toma de tierra agregado correctamente con código 02-E-10';
  
  -- Mostrar el concepto agregado
  RAISE NOTICE 'Detalles: % - % € (Unidad: Ud)', 
    (SELECT description FROM price_master WHERE code = '02-E-10'),
    (SELECT final_price FROM price_master WHERE code = '02-E-10');
END $$;
