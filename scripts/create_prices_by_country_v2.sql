-- Crear tabla para almacenar precios por país
-- Esto permite tener precios independientes para cada país con su moneda

-- Primero, eliminar la tabla si existe
DROP TABLE IF EXISTS price_master_by_country CASCADE;

-- Crear la tabla de precios por país
CREATE TABLE price_master_by_country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_master_id TEXT NOT NULL REFERENCES price_master(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL, -- ES, US, MX, CO, AR, GB
  currency_code TEXT NOT NULL, -- EUR, USD, MXN, COP, ARS, GBP
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(price_master_id, country_code)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_price_by_country_master ON price_master_by_country(price_master_id);
CREATE INDEX idx_price_by_country_code ON price_master_by_country(country_code);
CREATE INDEX idx_price_by_country_active ON price_master_by_country(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE price_master_by_country ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver precios activos por país
CREATE POLICY "Anyone can view active prices by country"
  ON price_master_by_country
  FOR SELECT
  USING (is_active = true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_price_by_country_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_by_country_updated_at
  BEFORE UPDATE ON price_master_by_country
  FOR EACH ROW
  EXECUTE FUNCTION update_price_by_country_updated_at();

-- Insertar precios para España (EUR) - copiando los precios actuales de final_price
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'ES', 'EUR', final_price
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Insertar precios para Estados Unidos (USD) - convertidos a dólares (1 EUR = 1.10 USD aprox)
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'US', 'USD', ROUND(final_price * 1.10, 2)
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Insertar precios para México (MXN) - convertidos a pesos mexicanos (1 EUR = 19 MXN aprox)
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'MX', 'MXN', ROUND(final_price * 19, 2)
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Insertar precios para Colombia (COP) - convertidos a pesos colombianos (1 EUR = 4300 COP aprox)
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'CO', 'COP', ROUND(final_price * 4300, 2)
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Insertar precios para Argentina (ARS) - convertidos a pesos argentinos (1 EUR = 1000 ARS aprox)
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'AR', 'ARS', ROUND(final_price * 1000, 2)
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Insertar precios para Reino Unido (GBP) - convertidos a libras (1 EUR = 0.85 GBP aprox)
INSERT INTO price_master_by_country (price_master_id, country_code, currency_code, final_price)
SELECT id, 'GB', 'GBP', ROUND(final_price * 0.85, 2)
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Verificar los datos insertados
SELECT 
  country_code,
  currency_code,
  COUNT(*) as total_prices,
  MIN(final_price) as min_price,
  MAX(final_price) as max_price,
  AVG(final_price) as avg_price
FROM price_master_by_country
GROUP BY country_code, currency_code
ORDER BY country_code;
