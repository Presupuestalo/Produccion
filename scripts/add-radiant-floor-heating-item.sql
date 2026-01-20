-- Script para añadir nuevo ítem de SUELO RADIANTE COMPLETO a la base de datos de precios
-- Este ítem incluye: Colector de distribución, aislante térmico, tubería multicapa y capa compresora
-- Precio base: 60€/m² en España (35€ material + 20€ MO + 15% margen ≈ 63.25€)

DO $$
DECLARE
  calefaccion_category_id UUID;
  new_price_master_id UUID;
BEGIN
  -- Obtener el ID de la categoría CALEFACCIÓN
  SELECT id INTO calefaccion_category_id 
  FROM price_categories 
  WHERE UPPER(name) IN ('CALEFACCIÓN', 'CLIMATIZACIÓN')
  LIMIT 1;

  IF calefaccion_category_id IS NULL THEN
    RAISE EXCEPTION 'Categoría CALEFACCIÓN no encontrada. Ejecuta primero add-heating-category-v2.sql';
  END IF;

  -- Insertar el ítem de suelo radiante completo en price_master (España - EUR)
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
    margin_percentage,
    is_custom,
    user_id
  ) VALUES (
    gen_random_uuid(),
    '07-CAL-11',
    calefaccion_category_id,
    'SUELO RADIANTE COMPLETO', -- Ya estaba correcto, concepto en mayúsculas
    'Sistema completo de suelo radiante incluyendo colector de distribución, aislante térmico, tubería multicapa y capa compresora', -- Ya estaba correcto, solo descripción
    'm²',
    20.00,   -- Mano de obra
    35.00,   -- Material (colector, aislante, tubo, capa compresora)
    0.00,    -- Equipo
    0.00,    -- Otros
    15.00,   -- Margen 15%
    false,   -- No es personalizado
    NULL     -- Usuario NULL para precios base
  )
  ON CONFLICT (code) DO UPDATE SET
    subcategory = EXCLUDED.subcategory, -- Actualizar subcategory también
    description = EXCLUDED.description,
    labor_cost = EXCLUDED.labor_cost,
    material_cost = EXCLUDED.material_cost,
    equipment_cost = EXCLUDED.equipment_cost,
    other_cost = EXCLUDED.other_cost,
    margin_percentage = EXCLUDED.margin_percentage,
    updated_at = NOW()
  RETURNING id INTO new_price_master_id;

  -- Si fue UPDATE, obtener el ID existente
  IF new_price_master_id IS NULL THEN
    SELECT id INTO new_price_master_id FROM price_master WHERE code = '07-CAL-11';
  END IF;

  RAISE NOTICE 'Ítem de Suelo Radiante Completo (07-CAL-11) agregado/actualizado en price_master';
  RAISE NOTICE 'ID: %, Precio final: ~63.25€/m²', new_price_master_id;

  -- Ahora insertar precios para todos los países hispanos en price_master_by_country
  
  -- ESPAÑA (EUR) - Base 60€/m²
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'ES', 60.00, 'EUR', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- MÉXICO (MXN) - 1 EUR ≈ 19 MXN
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'MX', 1140.00, 'MXN', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- COLOMBIA (COP) - 1 EUR ≈ 4,500 COP
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CO', 270000, 'COP', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- ARGENTINA (ARS) - 1 EUR ≈ 1,100 ARS
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'AR', 66000, 'ARS', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- PERÚ (PEN) - 1 EUR ≈ 4.2 PEN
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PE', 252.00, 'PEN', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- CHILE (CLP) - 1 EUR ≈ 1,050 CLP
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CL', 63000, 'CLP', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- BOLIVIA (BOB) - 1 EUR ≈ 7.6 BOB
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'BO', 456.00, 'BOB', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- VENEZUELA (VES) - 1 EUR ≈ 40 VES
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'VE', 2400.00, 'VES', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- ECUADOR (USD) - 1 EUR ≈ 1.1 USD
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'EC', 66.00, 'USD', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- GUATEMALA (GTQ) - 1 EUR ≈ 8.5 GTQ
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'GT', 510.00, 'GTQ', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- CUBA (CUP) - 1 EUR ≈ 110 CUP
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CU', 6600, 'CUP', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- REPÚBLICA DOMINICANA (DOP) - 1 EUR ≈ 63 DOP
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'DO', 3780.00, 'DOP', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- HONDURAS (HNL) - 1 EUR ≈ 27 HNL
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'HN', 1620.00, 'HNL', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- PARAGUAY (PYG) - 1 EUR ≈ 8,000 PYG
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PY', 480000, 'PYG', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- NICARAGUA (NIO) - 1 EUR ≈ 40 NIO
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'NI', 2400.00, 'NIO', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- EL SALVADOR (USD) - 1 EUR ≈ 1.1 USD
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'SV', 66.00, 'USD', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- COSTA RICA (CRC) - 1 EUR ≈ 560 CRC
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CR', 33600, 'CRC', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- PANAMÁ (USD) - 1 EUR ≈ 1.1 USD
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PA', 66.00, 'USD', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- URUGUAY (UYU) - 1 EUR ≈ 43 UYU
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'UY', 2580.00, 'UYU', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- GUINEA ECUATORIAL (XAF) - 1 EUR ≈ 655 XAF
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'GQ', 39300, 'XAF', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  RAISE NOTICE '✓ Precios añadidos para 20 países de habla hispana en price_master_by_country';
  RAISE NOTICE 'Sistema completo incluye: colector de distribución, aislante térmico, tubería multicapa y capa compresora';
  
END $$;

-- Verificar los precios insertados
SELECT 
  pbc.country_code,
  pbc.currency_code,
  pm.description as nombre,
  pbc.final_price as precio_final
FROM price_master_by_country pbc
JOIN price_master pm ON pbc.price_master_id = pm.id
WHERE pm.code = '07-CAL-11'
ORDER BY pbc.country_code;
