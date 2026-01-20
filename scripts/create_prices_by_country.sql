-- Crear tabla para almacenar precios por país
CREATE TABLE IF NOT EXISTS price_master_by_country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_master_id UUID NOT NULL REFERENCES price_master(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(price_master_id, country_code)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_price_country_master ON price_master_by_country(price_master_id);
CREATE INDEX IF NOT EXISTS idx_price_country_code ON price_master_by_country(country_code);

-- RLS Policies
ALTER TABLE price_master_by_country ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver precios por país" ON price_master_by_country
  FOR SELECT USING (true);

CREATE POLICY "Crear precios por país" ON price_master_by_country
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Actualizar precios por país" ON price_master_by_country
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Eliminar precios por país" ON price_master_by_country
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insertar precios por defecto para España (EUR) - Copiando de price_master
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'ES', final_price, 'EUR'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

-- Insertar precios para Estados Unidos (USD) - Convertidos automáticamente
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'US', final_price * 1.09, 'USD'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

-- Insertar precios para México (MXN)
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'MX', final_price * 18.5, 'MXN'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

-- Insertar precios para Colombia (COP)
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'CO', final_price * 4300, 'COP'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

-- Insertar precios para Argentina (ARS)
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'AR', final_price * 950, 'ARS'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

-- Insertar precios para Reino Unido (GBP)
INSERT INTO price_master_by_country (price_master_id, country_code, price, currency_code)
SELECT id, 'GB', final_price * 0.86, 'GBP'
FROM price_master
WHERE final_price > 0
ON CONFLICT (price_master_id, country_code) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();
