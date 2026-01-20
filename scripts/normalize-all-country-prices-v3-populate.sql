-- PASO 6: Poblar todas las tablas de precios con datos convertidos
-- Este script copia los precios base y aplica las conversiones

DO $$
DECLARE
  country_rec RECORD;
  table_name TEXT;
  rows_inserted INTEGER;
  total_inserted INTEGER := 0;
BEGIN
  -- Obtener tasas de conversión
  CREATE TEMP TABLE IF NOT EXISTS conversion_rates (
    country_code VARCHAR(2) PRIMARY KEY,
    country_name TEXT,
    currency_code VARCHAR(3),
    rate_from_eur DECIMAL(10,4)
  );
  
  TRUNCATE conversion_rates;
  
  INSERT INTO conversion_rates VALUES
    ('PE', 'peru', 'PEN', 4.1000),
    ('BO', 'bolivia', 'BOB', 7.5000),
    ('VE', 'venezuela', 'VES', 40.0000),
    ('MX', 'mexico', 'MXN', 20.0000),
    ('CO', 'colombia', 'COP', 4500.0000),
    ('AR', 'argentina', 'ARS', 1000.0000),
    ('CL', 'chile', 'CLP', 1000.0000),
    ('EC', 'ecuador', 'USD', 1.1000),
    ('GT', 'guatemala', 'GTQ', 8.5000),
    ('CU', 'cuba', 'CUP', 26.0000),
    ('DO', 'dominicana', 'DOP', 63.0000),
    ('HN', 'honduras', 'HNL', 27.0000),
    ('PY', 'paraguay', 'PYG', 8000.0000),
    ('NI', 'nicaragua', 'NIO', 40.0000),
    ('SV', 'salvador', 'USD', 1.1000),
    ('CR', 'costarica', 'CRC', 570.0000),
    ('PA', 'panama', 'PAB', 1.1000),
    ('UY', 'uruguay', 'UYU', 43.0000),
    ('GQ', 'guinea', 'XAF', 650.0000),
    ('US', 'usa', 'USD', 1.1000);
  
  -- Iterar sobre cada país
  FOR country_rec IN SELECT * FROM conversion_rates LOOP
    table_name := 'price_master_' || country_rec.country_name;
    
    -- Corregido para usar solo las columnas que existen en price_master
    EXECUTE format('
      INSERT INTO %I (
        id, code, category_id, subcategory, description, unit,
        material_cost, labor_cost, base_price,
        profit_margin, final_price,
        color, brand, model,
        is_active, is_custom, user_id, created_by,
        created_at, updated_at
      )
      SELECT 
        id, code, category_id, subcategory, description, unit,
        ROUND(material_cost * $1, 2),
        ROUND(labor_cost * $1, 2),
        ROUND(base_price * $1, 2),
        profit_margin,
        ROUND(final_price * $1, 2),
        color, brand, model,
        is_active, is_custom, user_id, created_by,
        created_at, updated_at
      FROM price_master
      WHERE is_active = true AND is_custom = false
      ON CONFLICT (id) DO UPDATE SET
        material_cost = EXCLUDED.material_cost,
        labor_cost = EXCLUDED.labor_cost,
        base_price = EXCLUDED.base_price,
        final_price = EXCLUDED.final_price,
        updated_at = NOW()
    ', table_name) USING country_rec.rate_from_eur;
    
    GET DIAGNOSTICS rows_inserted = ROW_COUNT;
    total_inserted := total_inserted + rows_inserted;
    
    RAISE NOTICE '✅ %: % precios actualizados (tasa: % %)', 
      upper(country_rec.country_code), 
      rows_inserted, 
      country_rec.rate_from_eur,
      country_rec.currency_code;
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ NORMALIZACIÓN COMPLETADA';
  RAISE NOTICE '📊 Total de precios actualizados: %', total_inserted;
  RAISE NOTICE '🌍 Países procesados: %', (SELECT COUNT(*) FROM conversion_rates);
  RAISE NOTICE '====================================';
END $$;
