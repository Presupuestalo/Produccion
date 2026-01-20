-- Add localized columns to price_master_by_country table
ALTER TABLE price_master_by_country 
ADD COLUMN IF NOT EXISTS localized_name TEXT,
ADD COLUMN IF NOT EXISTS localized_description TEXT;

-- Insert Spanish-speaking countries with localized content
-- Spain (EUR)
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  id,
  'ES',
  final_price,
  'EUR',
  name,
  description,
  true
FROM price_master
WHERE is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Mexico (MXN) - Approximate conversion: 1 EUR = 18 MXN
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'MX',
  ROUND(pm.final_price * 18, 2),
  'MXN',
  CASE 
    WHEN pm.name ILIKE '%tabique%' THEN REPLACE(pm.name, 'TABIQUE', 'MURO DIVISORIO')
    WHEN pm.name ILIKE '%alicatado%' THEN REPLACE(pm.name, 'ALICATADO', 'AZULEJO')
    WHEN pm.name ILIKE '%rodapié%' THEN REPLACE(pm.name, 'RODAPIÉ', 'ZOCLO')
    WHEN pm.name ILIKE '%tarima%' THEN REPLACE(pm.name, 'TARIMA', 'PISO DE MADERA')
    ELSE pm.name
  END,
  CASE 
    WHEN pm.description ILIKE '%tabique%' THEN REPLACE(pm.description, 'tabique', 'muro divisorio')
    WHEN pm.description ILIKE '%alicatado%' THEN REPLACE(pm.description, 'alicatado', 'azulejo')
    WHEN pm.description ILIKE '%rodapié%' THEN REPLACE(pm.description, 'rodapié', 'zoclo')
    WHEN pm.description ILIKE '%tarima%' THEN REPLACE(pm.description, 'tarima', 'piso de madera')
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Colombia (COP) - Approximate conversion: 1 EUR = 4500 COP
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'CO',
  ROUND(pm.final_price * 4500, 0),
  'COP',
  CASE 
    WHEN pm.name ILIKE '%tabique%' THEN REPLACE(pm.name, 'TABIQUE', 'DRYWALL')
    WHEN pm.name ILIKE '%alicatado%' THEN REPLACE(pm.name, 'ALICATADO', 'ENCHAPE')
    WHEN pm.name ILIKE '%rodapié%' THEN REPLACE(pm.name, 'RODAPIÉ', 'GUARDA ESCOBA')
    WHEN pm.name ILIKE '%tarima%' THEN REPLACE(pm.name, 'TARIMA', 'PISO DE MADERA')
    ELSE pm.name
  END,
  CASE 
    WHEN pm.description ILIKE '%tabique%' THEN REPLACE(pm.description, 'tabique', 'drywall')
    WHEN pm.description ILIKE '%alicatado%' THEN REPLACE(pm.description, 'alicatado', 'enchape')
    WHEN pm.description ILIKE '%rodapié%' THEN REPLACE(pm.description, 'rodapié', 'guarda escoba')
    WHEN pm.description ILIKE '%tarima%' THEN REPLACE(pm.description, 'tarima', 'piso de madera')
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Argentina (ARS) - Approximate conversion: 1 EUR = 1000 ARS
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'AR',
  ROUND(pm.final_price * 1000, 0),
  'ARS',
  CASE 
    WHEN pm.name ILIKE '%tabique%' THEN REPLACE(pm.name, 'TABIQUE', 'DURLOCK')
    WHEN pm.name ILIKE '%alicatado%' THEN REPLACE(pm.name, 'ALICATADO', 'REVESTIMIENTO CERÁMICO')
    WHEN pm.name ILIKE '%rodapié%' THEN REPLACE(pm.name, 'RODAPIÉ', 'ZÓCALO')
    WHEN pm.name ILIKE '%tarima%' THEN REPLACE(pm.name, 'TARIMA', 'PISO DE MADERA')
    ELSE pm.name
  END,
  CASE 
    WHEN pm.description ILIKE '%tabique%' THEN REPLACE(pm.description, 'tabique', 'durlock')
    WHEN pm.description ILIKE '%alicatado%' THEN REPLACE(pm.description, 'alicatado', 'revestimiento cerámico')
    WHEN pm.description ILIKE '%rodapié%' THEN REPLACE(pm.description, 'rodapié', 'zócalo')
    WHEN pm.description ILIKE '%tarima%' THEN REPLACE(pm.description, 'tarima', 'piso de madera')
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Chile (CLP) - Approximate conversion: 1 EUR = 1000 CLP
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'CL',
  ROUND(pm.final_price * 1000, 0),
  'CLP',
  CASE 
    WHEN pm.name ILIKE '%tabique%' THEN REPLACE(pm.name, 'TABIQUE', 'VOLCANITA')
    WHEN pm.name ILIKE '%alicatado%' THEN REPLACE(pm.name, 'ALICATADO', 'REVESTIMIENTO CERÁMICO')
    WHEN pm.name ILIKE '%rodapié%' THEN REPLACE(pm.name, 'RODAPIÉ', 'GUARDAPOLVO')
    WHEN pm.name ILIKE '%tarima%' THEN REPLACE(pm.name, 'TARIMA', 'PISO DE MADERA')
    ELSE pm.name
  END,
  CASE 
    WHEN pm.description ILIKE '%tabique%' THEN REPLACE(pm.description, 'tabique', 'volcanita')
    WHEN pm.description ILIKE '%alicatado%' THEN REPLACE(pm.description, 'alicatado', 'revestimiento cerámico')
    WHEN pm.description ILIKE '%rodapié%' THEN REPLACE(pm.description, 'rodapié', 'guardapolvo')
    WHEN pm.description ILIKE '%tarima%' THEN REPLACE(pm.description, 'tarima', 'piso de madera')
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Peru (PEN) - Approximate conversion: 1 EUR = 4 PEN
INSERT INTO price_master_by_country (price_master_id, country_code, final_price, currency_code, localized_name, localized_description, is_active)
SELECT 
  pm.id,
  'PE',
  ROUND(pm.final_price * 4, 2),
  'PEN',
  CASE 
    WHEN pm.name ILIKE '%tabique%' THEN REPLACE(pm.name, 'TABIQUE', 'DRYWALL')
    WHEN pm.name ILIKE '%alicatado%' THEN REPLACE(pm.name, 'ALICATADO', 'MAYÓLICA')
    WHEN pm.name ILIKE '%rodapié%' THEN REPLACE(pm.name, 'RODAPIÉ', 'CONTRAZÓCALO')
    WHEN pm.name ILIKE '%tarima%' THEN REPLACE(pm.name, 'TARIMA', 'PISO DE MADERA')
    ELSE pm.name
  END,
  CASE 
    WHEN pm.description ILIKE '%tabique%' THEN REPLACE(pm.description, 'tabique', 'drywall')
    WHEN pm.description ILIKE '%alicatado%' THEN REPLACE(pm.description, 'alicatado', 'mayólica')
    WHEN pm.description ILIKE '%rodapié%' THEN REPLACE(pm.description, 'rodapié', 'contrazócalo')
    WHEN pm.description ILIKE '%tarima%' THEN REPLACE(pm.description, 'tarima', 'piso de madera')
    ELSE pm.description
  END,
  true
FROM price_master pm
WHERE pm.is_active = true
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();

-- Show summary
SELECT 
  country_code,
  currency_code,
  COUNT(*) as total_prices,
  ROUND(AVG(final_price), 2) as avg_price
FROM price_master_by_country
GROUP BY country_code, currency_code
ORDER BY country_code;
