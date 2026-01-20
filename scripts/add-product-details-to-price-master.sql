-- Añadir columnas de detalles de producto a price_master
-- Estas columnas permiten especificar características como color, marca y modelo

ALTER TABLE price_master 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT;

-- Crear índice para búsquedas por marca
CREATE INDEX IF NOT EXISTS idx_price_master_brand ON price_master(brand);

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Columnas color, brand y model añadidas a price_master';
END $$;
