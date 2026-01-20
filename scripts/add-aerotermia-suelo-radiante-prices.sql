-- Agregar precios de Aerotermia y Suelo Radiante por m² a todos los países
-- Estos conceptos solo aplican para reforma (son tecnologías modernas)

-- ============================================================================
-- ESPAÑA - price_master
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  -- Obtener el ID de la categoría CLIMATIZACIÓN (puede variar según el país)
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  -- Si no existe la categoría, usar NULL y el insert fallará con un mensaje claro
  IF climatizacion_category_id IS NULL THEN
    RAISE NOTICE 'Categoría CLIMATIZACIÓN no encontrada en España';
  ELSE
    -- Insertar Aerotermia (precio por m²)
    INSERT INTO price_master (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      '05-C-10',
      climatizacion_category_id,
      'Sistemas de climatización',
      'INSTALACIÓN DE AEROTERMIA',
      'm²',
      85.00,
      45.00,
      130.00,
      15.00,
      149.50,
      true,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      description = EXCLUDED.description,
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      profit_margin = EXCLUDED.profit_margin,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();

    -- Insertar Suelo Radiante (precio por m²)
    INSERT INTO price_master (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      '05-C-11',
      climatizacion_category_id,
      'Sistemas de climatización',
      'INSTALACIÓN DE SUELO RADIANTE',
      'm²',
      75.00,
      40.00,
      115.00,
      15.00,
      132.25,
      true,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      description = EXCLUDED.description,
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      profit_margin = EXCLUDED.profit_margin,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- BOLIVIA - price_master_bolivia (Bs - Bolivianos)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_bolivia (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 850.00, 450.00, 1300.00, 15.00, 1495.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 750.00, 400.00, 1150.00, 15.00, 1322.50, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- ARGENTINA - price_master_argentina (ARS - Pesos Argentinos)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_argentina (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 120000.00, 65000.00, 185000.00, 15.00, 212750.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 105000.00, 55000.00, 160000.00, 15.00, 184000.00, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- CHILE - price_master_chile (CLP - Pesos Chilenos)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_chile (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 95000.00, 50000.00, 145000.00, 15.00, 166750.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 82000.00, 44000.00, 126000.00, 15.00, 144900.00, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- PERÚ - price_master_peru (PEN - Soles)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_peru (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 420.00, 220.00, 640.00, 15.00, 736.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 370.00, 195.00, 565.00, 15.00, 649.75, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- Continuar con el resto de países...
-- MÉXICO, COLOMBIA, ECUADOR, VENEZUELA, GUATEMALA, CUBA, REPÚBLICA DOMINICANA,
-- HONDURAS, PARAGUAY, NICARAGUA, EL SALVADOR, COSTA RICA, PANAMÁ, URUGUAY,
-- GUINEA ECUATORIAL, ESTADOS UNIDOS

-- ============================================================================
-- MÉXICO - price_master_mexico (MXN - Pesos Mexicanos)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_mexico (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 2100.00, 1100.00, 3200.00, 15.00, 3680.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 1850.00, 980.00, 2830.00, 15.00, 3254.50, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- COLOMBIA - price_master_colombia (COP - Pesos Colombianos)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_colombia (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 450000.00, 240000.00, 690000.00, 15.00, 793500.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 395000.00, 210000.00, 605000.00, 15.00, 695750.00, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- ECUADOR - price_master_ecuador (USD - Dólares)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_ecuador (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 92.00, 48.00, 140.00, 15.00, 161.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 81.00, 42.00, 123.00, 15.00, 141.45, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- VENEZUELA - price_master_venezuela (VES - Bolívares)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_venezuela (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 3200.00, 1700.00, 4900.00, 15.00, 5635.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 2800.00, 1500.00, 4300.00, 15.00, 4945.00, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- Agregar el resto de países con precios adaptados a su moneda local
-- (Guatemala, Cuba, República Dominicana, Honduras, Paraguay, Nicaragua, 
-- El Salvador, Costa Rica, Panamá, Uruguay, Guinea Ecuatorial, Estados Unidos)

-- ============================================================================
-- GUATEMALA - price_master_guatemala (GTQ - Quetzales)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_guatemala (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 730.00, 385.00, 1115.00, 15.00, 1282.25, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 640.00, 340.00, 980.00, 15.00, 1127.00, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================================
-- ESTADOS UNIDOS - price_master_usa (USD - Dólares)
-- ============================================================================

DO $$
DECLARE
  climatizacion_category_id TEXT;
BEGIN
  SELECT id INTO climatizacion_category_id 
  FROM price_categories 
  WHERE UPPER(name) = 'CLIMATIZACIÓN' OR UPPER(name) = 'CALEFACCIÓN'
  LIMIT 1;

  IF climatizacion_category_id IS NOT NULL THEN
    INSERT INTO price_master_usa (
      id, code, category_id, subcategory, description, unit,
      material_cost, labor_cost, base_price, profit_margin, final_price,
      is_active, is_custom, created_at, updated_at
    ) VALUES 
    (gen_random_uuid()::text, '05-C-10', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE AEROTERMIA', 'm²', 105.00, 55.00, 160.00, 15.00, 184.00, true, false, NOW(), NOW()),
    (gen_random_uuid()::text, '05-C-11', climatizacion_category_id, 'Sistemas de climatización', 'INSTALACIÓN DE SUELO RADIANTE', 'm²', 93.00, 48.00, 141.00, 15.00, 162.15, true, false, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      material_cost = EXCLUDED.material_cost,
      labor_cost = EXCLUDED.labor_cost,
      base_price = EXCLUDED.base_price,
      final_price = EXCLUDED.final_price,
      updated_at = NOW();
  END IF;
END $$;

-- Verificación final
SELECT 'Script completado - Aerotermia y Suelo Radiante agregados a todos los países' AS status;
