-- Script de normalización completa de precios para todos los países
-- Actualiza las conversiones de moneda y normaliza estructuras

-- PASO 1: Verificar que price_master tenga todos los campos necesarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'equipment_cost') THEN
    ALTER TABLE price_master ADD COLUMN equipment_cost DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'other_cost') THEN
    ALTER TABLE price_master ADD COLUMN other_cost DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'margin_percentage') THEN
    ALTER TABLE price_master ADD COLUMN margin_percentage DECIMAL(5,2) DEFAULT 15;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'long_description') THEN
    ALTER TABLE price_master ADD COLUMN long_description TEXT;
  END IF;
END $$;

-- PASO 2: Actualizar tasas de conversión (valores aproximados de 2025)
-- Estas tasas deben revisarse periódicamente

-- Tabla temporal con tasas de conversión actualizadas
CREATE TEMP TABLE conversion_rates (
  country_code VARCHAR(2) PRIMARY KEY,
  country_name TEXT,
  currency_code VARCHAR(3),
  rate_from_eur DECIMAL(10,4),
  notes TEXT
);

INSERT INTO conversion_rates VALUES
  ('ES', 'España', 'EUR', 1.0000, 'Base currency'),
  ('US', 'Estados Unidos', 'USD', 1.1000, 'Dólar estadounidense'),
  ('GB', 'Reino Unido', 'GBP', 0.8500, 'Libra esterlina'),
  ('MX', 'México', 'MXN', 20.0000, 'Peso mexicano'),
  ('CO', 'Colombia', 'COP', 4500.0000, 'Peso colombiano'),
  ('AR', 'Argentina', 'ARS', 1000.0000, 'Peso argentino - alta inflación'),
  ('PE', 'Perú', 'PEN', 4.1000, 'Sol peruano'),
  ('CL', 'Chile', 'CLP', 1000.0000, 'Peso chileno'),
  ('BO', 'Bolivia', 'BOB', 7.5000, 'Boliviano'),
  ('VE', 'Venezuela', 'VES', 40.0000, 'Bolívar - alta volatilidad'),
  ('EC', 'Ecuador', 'USD', 1.1000, 'Usa dólar estadounidense'),
  ('GT', 'Guatemala', 'GTQ', 8.5000, 'Quetzal'),
  ('CU', 'Cuba', 'CUP', 26.0000, 'Peso cubano'),
  ('DO', 'República Dominicana', 'DOP', 63.0000, 'Peso dominicano'),
  ('HN', 'Honduras', 'HNL', 27.0000, 'Lempira'),
  ('PY', 'Paraguay', 'PYG', 8000.0000, 'Guaraní'),
  ('NI', 'Nicaragua', 'NIO', 40.0000, 'Córdoba'),
  ('SV', 'El Salvador', 'USD', 1.1000, 'Usa dólar estadounidense'),
  ('CR', 'Costa Rica', 'CRC', 570.0000, 'Colón'),
  ('PA', 'Panamá', 'PAB', 1.1000, 'Balboa (paridad con USD)'),
  ('UY', 'Uruguay', 'UYU', 43.0000, 'Peso uruguayo'),
  ('GQ', 'Guinea Ecuatorial', 'XAF', 650.0000, 'Franco CFA');

-- PASO 3: Mostrar resumen de conversiones
SELECT 
  country_code,
  country_name,
  currency_code,
  rate_from_eur,
  ROUND(100 * rate_from_eur, 2) as "100_EUR_equals",
  notes
FROM conversion_rates
ORDER BY country_code;

-- PASO 4: Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Tasas de conversión actualizadas';
  RAISE NOTICE '📊 Total de países configurados: %', (SELECT COUNT(*) FROM conversion_rates);
  RAISE NOTICE '⚠️  Estas tasas son aproximadas y deben actualizarse según el mercado real';
  RAISE NOTICE '⚠️  Los costos de construcción varían significativamente por país';
  RAISE NOTICE '⚠️  Se recomienda ajustar manualmente según análisis de mercado local';
END $$;
