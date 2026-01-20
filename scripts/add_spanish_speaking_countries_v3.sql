-- Script para añadir países de habla hispana con precios localizados
-- Este script añade columnas para nombres y descripciones localizadas,
-- y luego inserta precios para 6 países hispanohablantes

-- Paso 1: Añadir columnas para contenido localizado si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master_by_country' 
    AND column_name = 'localized_code'
  ) THEN
    ALTER TABLE price_master_by_country 
    ADD COLUMN localized_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master_by_country' 
    AND column_name = 'localized_description'
  ) THEN
    ALTER TABLE price_master_by_country 
    ADD COLUMN localized_description TEXT;
  END IF;
END $$;

-- Paso 2: Insertar precios para países de habla hispana
-- Los precios están adaptados a cada mercado local con terminología específica

-- ESPAÑA (EUR) - Precios base originales
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'ES',
  pm.final_price,
  'EUR',
  pm.code,
  pm.description,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- MÉXICO (MXN) - Conversión aproximada: 1 EUR = 18 MXN
-- Terminología adaptada: "tabique" → "muro divisorio", "alicatado" → "azulejo"
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'MX',
  ROUND(pm.final_price * 18, 2),
  'MXN',
  CASE 
    WHEN pm.code LIKE '%TABIQUE%' THEN REPLACE(pm.code, 'TABIQUE', 'MURO DIVISORIO')
    WHEN pm.code LIKE '%ALICATADO%' THEN REPLACE(pm.code, 'ALICATADO', 'AZULEJO')
    WHEN pm.code LIKE '%SOLADO%' THEN REPLACE(pm.code, 'SOLADO', 'PISO')
    ELSE pm.code
  END,
  REPLACE(REPLACE(REPLACE(
    pm.description,
    'tabique', 'muro divisorio'),
    'alicatado', 'azulejo'),
    'solado', 'piso'),
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- COLOMBIA (COP) - Conversión aproximada: 1 EUR = 4500 COP
-- Terminología adaptada: "tabique" → "drywall", "alicatado" → "enchape"
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'CO',
  ROUND(pm.final_price * 4500, 2),
  'COP',
  CASE 
    WHEN pm.code LIKE '%TABIQUE%' THEN REPLACE(pm.code, 'TABIQUE', 'DRYWALL')
    WHEN pm.code LIKE '%ALICATADO%' THEN REPLACE(pm.code, 'ALICATADO', 'ENCHAPE')
    WHEN pm.code LIKE '%SOLADO%' THEN REPLACE(pm.code, 'SOLADO', 'PISO')
    ELSE pm.code
  END,
  REPLACE(REPLACE(REPLACE(
    pm.description,
    'tabique', 'drywall'),
    'alicatado', 'enchape'),
    'solado', 'piso'),
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- ARGENTINA (ARS) - Conversión aproximada: 1 EUR = 1100 ARS
-- Terminología adaptada: "tabique" → "Durlock", "alicatado" → "revestimiento"
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'AR',
  ROUND(pm.final_price * 1100, 2),
  'ARS',
  CASE 
    WHEN pm.code LIKE '%TABIQUE%' THEN REPLACE(pm.code, 'TABIQUE', 'DURLOCK')
    WHEN pm.code LIKE '%ALICATADO%' THEN REPLACE(pm.code, 'ALICATADO', 'REVESTIMIENTO')
    WHEN pm.code LIKE '%SOLADO%' THEN REPLACE(pm.code, 'SOLADO', 'PISO')
    ELSE pm.code
  END,
  REPLACE(REPLACE(REPLACE(
    pm.description,
    'tabique', 'Durlock'),
    'alicatado', 'revestimiento'),
    'solado', 'piso'),
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- CHILE (CLP) - Conversión aproximada: 1 EUR = 1000 CLP
-- Terminología adaptada: "tabique" → "Volcanita", "alicatado" → "revestimiento"
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'CL',
  ROUND(pm.final_price * 1000, 2),
  'CLP',
  CASE 
    WHEN pm.code LIKE '%TABIQUE%' THEN REPLACE(pm.code, 'TABIQUE', 'VOLCANITA')
    WHEN pm.code LIKE '%ALICATADO%' THEN REPLACE(pm.code, 'ALICATADO', 'REVESTIMIENTO')
    WHEN pm.code LIKE '%SOLADO%' THEN REPLACE(pm.code, 'SOLADO', 'PISO')
    ELSE pm.code
  END,
  REPLACE(REPLACE(REPLACE(
    pm.description,
    'tabique', 'Volcanita'),
    'alicatado', 'revestimiento'),
    'solado', 'piso'),
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- PERÚ (PEN) - Conversión aproximada: 1 EUR = 4 PEN
-- Terminología adaptada: "tabique" → "drywall", "alicatado" → "mayólica"
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_code, localized_description, is_active)
SELECT 
  pm.id,
  'PE',
  ROUND(pm.final_price * 4, 2),
  'PEN',
  CASE 
    WHEN pm.code LIKE '%TABIQUE%' THEN REPLACE(pm.code, 'TABIQUE', 'DRYWALL')
    WHEN pm.code LIKE '%ALICATADO%' THEN REPLACE(pm.code, 'ALICATADO', 'MAYÓLICA')
    WHEN pm.code LIKE '%SOLADO%' THEN REPLACE(pm.code, 'SOLADO', 'PISO')
    ELSE pm.code
  END,
  REPLACE(REPLACE(REPLACE(
    pm.description,
    'tabique', 'drywall'),
    'alicatado', 'mayólica'),
    'solado', 'piso'),
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_code = EXCLUDED.localized_code,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Mostrar resumen de precios insertados por país
SELECT 
  country_code,
  currency_code,
  COUNT(*) as total_prices,
  ROUND(AVG(final_price), 2) as avg_price,
  ROUND(MIN(final_price), 2) as min_price,
  ROUND(MAX(final_price), 2) as max_price
FROM price_master_by_country
WHERE country_code IN ('ES', 'MX', 'CO', 'AR', 'CL', 'PE')
GROUP BY country_code, currency_code
ORDER BY country_code;
