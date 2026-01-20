-- PASO 5: Crear todas las tablas de precios por país si no existen
-- Este script crea la estructura base para todos los países

DO $$
DECLARE
  country_codes TEXT[] := ARRAY['PE', 'BO', 'VE', 'MX', 'CO', 'AR', 'CL', 'EC', 'GT', 'CU', 'DO', 'HN', 'PY', 'NI', 'SV', 'CR', 'PA', 'UY', 'GQ', 'US'];
  country_names TEXT[] := ARRAY['peru', 'bolivia', 'venezuela', 'mexico', 'colombia', 'argentina', 'chile', 'ecuador', 'guatemala', 'cuba', 'dominicana', 'honduras', 'paraguay', 'nicaragua', 'salvador', 'costarica', 'panama', 'uruguay', 'guinea', 'usa'];
  country_code TEXT;
  country_name TEXT;
  table_name TEXT;
  user_table_name TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(country_codes, 1) LOOP
    country_code := country_codes[i];
    country_name := country_names[i];
    table_name := 'price_master_' || country_name;
    user_table_name := 'user_prices_' || country_name;
    
    -- Eliminar tablas existentes para recrearlas con el schema correcto
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', user_table_name);
    
    -- Crear tabla maestra con el schema completo de price_master
    EXECUTE format('
      CREATE TABLE %I (
        LIKE price_master INCLUDING ALL
      )', table_name);
    
    -- Crear tabla de usuario con el schema completo de user_prices
    EXECUTE format('
      CREATE TABLE %I (
        LIKE user_prices INCLUDING ALL
      )', user_table_name);
    
    -- Habilitar RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', user_table_name);
    
    -- Corregir políticas RLS para manejar correctamente NULLs y tipos UUID
    -- Crear políticas RLS para tabla maestra
    EXECUTE format('
      DROP POLICY IF EXISTS "Ver precios activos" ON %I;
      CREATE POLICY "Ver precios activos"
      ON %I FOR SELECT
      USING (is_active = true AND (user_id IS NULL OR user_id::uuid = auth.uid()))
    ', table_name, table_name);
    
    -- Crear políticas RLS para tabla de usuario
    EXECUTE format('
      DROP POLICY IF EXISTS "Ver precios de usuario" ON %I;
      CREATE POLICY "Ver precios de usuario"
      ON %I FOR SELECT
      USING (auth.uid() = user_id::uuid)
    ', user_table_name, user_table_name);
    
    EXECUTE format('
      DROP POLICY IF EXISTS "Crear precios de usuario" ON %I;
      CREATE POLICY "Crear precios de usuario"
      ON %I FOR INSERT
      WITH CHECK (auth.uid() = user_id::uuid)
    ', user_table_name, user_table_name);
    
    EXECUTE format('
      DROP POLICY IF EXISTS "Actualizar precios de usuario" ON %I;
      CREATE POLICY "Actualizar precios de usuario"
      ON %I FOR UPDATE
      USING (auth.uid() = user_id::uuid)
      WITH CHECK (auth.uid() = user_id::uuid)
    ', user_table_name, user_table_name);
    
    EXECUTE format('
      DROP POLICY IF EXISTS "Eliminar precios de usuario" ON %I;
      CREATE POLICY "Eliminar precios de usuario"
      ON %I FOR DELETE
      USING (auth.uid() = user_id::uuid)
    ', user_table_name, user_table_name);
    
    RAISE NOTICE 'Tabla creada: % y %', table_name, user_table_name;
  END LOOP;
  
  RAISE NOTICE '✅ Todas las tablas de precios por país creadas correctamente';
END $$;
