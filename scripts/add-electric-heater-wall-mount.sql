-- Script para crear el precio de FIJACIÓN DE EMISOR TÉRMICO en albañilería
-- Fecha: 2025-01-20
-- Descripción: Añade el código de albañilería para la fijación de emisores térmicos eléctricos

DO $$
DECLARE
  new_price_master_id UUID;
  albañileria_category_id UUID;
BEGIN
  -- Buscar el ID de la categoría Albañilería por nombre en lugar de usar UUID fijo
  SELECT id INTO albañileria_category_id 
  FROM price_categories 
  WHERE name = 'Albañilería' OR name ILIKE '%alba%' OR name ILIKE '%masonry%'
  LIMIT 1;

  -- Si no se encuentra la categoría, lanzar error
  IF albañileria_category_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la categoría de Albañilería en price_categories';
  END IF;

  -- Insertar en price_master para España
  INSERT INTO price_master (
    id,
    code,
    category_id,
    subcategory, -- Añadido campo subcategory para el concepto
    description,
    unit,
    labor_cost,
    material_cost,
    margin_percentage,
    is_active
  ) VALUES (
    gen_random_uuid(),
    '02-A-20', -- Corregido de 02-ALB-20 a 02-A-20 para coincidir con el formato de albañilería
    albañileria_category_id, -- Usar el ID encontrado dinámicamente
    'FIJACIÓN DE EMISOR TÉRMICO', -- Concepto en mayúsculas
    'Mano de obra para la fijación física a la pared (marcar, taladrar, colocar soportes y colgar) de un radiador eléctrico. Excluye la conexión eléctrica y el suministro del aparato', -- Solo descripción
    'Ud',
    25.00, -- Mano de obra
    8.00,  -- Material (soportes, tacos, tornillos)
    15,    -- 15% margen
    true
  )
  ON CONFLICT (code) 
  DO UPDATE SET
    subcategory = EXCLUDED.subcategory, -- Actualizar subcategory también
    description = EXCLUDED.description,
    labor_cost = EXCLUDED.labor_cost,
    material_cost = EXCLUDED.material_cost,
    updated_at = NOW()
  RETURNING id INTO new_price_master_id;

  -- Si no se obtuvo el ID (porque ya existía), lo buscamos
  IF new_price_master_id IS NULL THEN
    SELECT id INTO new_price_master_id FROM price_master WHERE code = '02-A-20'; -- Corregido aquí
  END IF;

  -- Convertir UUID a TEXT para price_master_by_country
  -- Insertar precios para países hispanos (price_master_id es TEXT en esta tabla)
  
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'ES', 37.95, 'EUR', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'MX', 722, 'MXN', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'CO', 166275, 'COP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'AR', 32757, 'ARS', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'PE', 143, 'PEN', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'CL', 36708, 'CLP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'BO', 262, 'BOB', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'VE', 1380, 'VES', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'EC', 38, 'USD', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'GT', 293, 'GTQ', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'CU', 910, 'CUP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'DO', 2240, 'DOP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'HN', 939, 'HNL', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'PY', 281955, 'PYG', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'NI', 1395, 'NIO', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'SV', 38, 'USD', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'CR', 19735, 'CRC', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'PA', 38, 'PAB', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'UY', 1518, 'UYU', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id::TEXT, 'GQ', 24885, 'XAF', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  RAISE NOTICE 'Precio de FIJACIÓN DE EMISOR TÉRMICO (02-A-20) creado correctamente para 20 países hispanos';
END $$;
