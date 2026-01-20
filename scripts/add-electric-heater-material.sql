-- Script para crear el precio de EMISOR TÉRMICO como material
-- Fecha: 2025-01-20
-- Descripción: Añade el emisor térmico como material de suministro

DO $$
DECLARE
  new_price_master_id UUID;
  materials_category_id UUID;
BEGIN
  -- Añadida verificación/creación de categoría Materiales
  -- Primero verificar o crear la categoría de Materiales
  INSERT INTO price_categories (id, name, description, display_order, is_active)
  VALUES (
    '66666666-6666-6666-6666-666666666666',
    'Materiales',
    'Materiales y suministros para construcción',
    6,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- Obtener el ID de la categoría Materiales
  SELECT id INTO materials_category_id 
  FROM price_categories 
  WHERE name = 'Materiales'
  LIMIT 1;

  -- Usar UUID fijo de Materiales directamente
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
    gen_random_uuid(), -- Generación explícita del UUID
    '10-M-25',
    materials_category_id, -- UUID fijo de Materiales
    'EMISOR TÉRMICO', -- Concepto en mayúsculas
    'Emisor Térmico Seco de bajo consumo-programable 24/7, Calor Rápido, 15m², Aluminio', -- Solo descripción
    'Ud',
    15.00,  -- Mano de obra mínima (transporte y ubicación)
    150.00, -- Material (emisor térmico)
    15,     -- 15% margen
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
    SELECT id INTO new_price_master_id FROM price_master WHERE code = '10-M-25';
  END IF;

  -- Insertar precios para países hispanos en price_master_by_country
  -- España (ES) - EUR - 189.75€ (165€ base + 15% margen)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'ES', 189.75, 'EUR', true)
  ON CONFLICT (price_master_id, country_code) 
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- México (MX) - MXN - 3,605 (189.75 * 19)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'MX', 3605, 'MXN', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Colombia (CO) - COP - 831,105 (189.75 * 4,380)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CO', 831105, 'COP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Argentina (AR) - ARS - 163,754 (189.75 * 863)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'AR', 163754, 'ARS', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Perú (PE) - PEN - 715 (189.75 * 3.77)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PE', 715, 'PEN', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Chile (CL) - CLP - 183,470 (189.75 * 967)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CL', 183470, 'CLP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Bolivia (BO) - BOB - 1,309 (189.75 * 6.9)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'BO', 1309, 'BOB', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Venezuela (VE) - VES - 6,900 (189.75 * 36.36)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'VE', 6900, 'VES', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Ecuador (EC) - USD - 190 (189.75 * 1)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'EC', 190, 'USD', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Guatemala (GT) - GTQ - 1,467 (189.75 * 7.73)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'GT', 1467, 'GTQ', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Cuba (CU) - CUP - 4,554 (189.75 * 24)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CU', 4554, 'CUP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- República Dominicana (DO) - DOP - 11,195 (189.75 * 59)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'DO', 11195, 'DOP', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Honduras (HN) - HNL - 4,696 (189.75 * 24.75)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'HN', 4696, 'HNL', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Paraguay (PY) - PYG - 1,409,663 (189.75 * 7,430)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PY', 1409663, 'PYG', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Nicaragua (NI) - NIO - 6,973 (189.75 * 36.75)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'NI', 6973, 'NIO', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- El Salvador (SV) - USD - 190 (189.75 * 1)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'SV', 190, 'USD', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Costa Rica (CR) - CRC - 98,670 (189.75 * 520)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'CR', 98670, 'CRC', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Panamá (PA) - PAB - 190 (189.75 * 1)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'PA', 190, 'PAB', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Uruguay (UY) - UYU - 7,590 (189.75 * 40)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'UY', 7590, 'UYU', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  -- Guinea Ecuatorial (GQ) - XAF - 124,444 (189.75 * 655.96)
  INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, is_active)
  VALUES (new_price_master_id, 'GQ', 124444, 'XAF', true)
  ON CONFLICT (price_master_id, country_code)
  DO UPDATE SET final_price = EXCLUDED.final_price, updated_at = NOW();

  RAISE NOTICE 'Precio de EMISOR TÉRMICO creado correctamente para 20 países hispanos';
END $$;
