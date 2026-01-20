-- Script para añadir campos de color, marca y modelo a materiales existentes
-- Este script actualiza la estructura si no existen los campos

-- Verificar y añadir columnas si no existen
DO $$ 
BEGIN
  -- Añadir columna color si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'color'
  ) THEN
    ALTER TABLE price_master ADD COLUMN color TEXT;
  END IF;

  -- Añadir columna brand si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'brand'
  ) THEN
    ALTER TABLE price_master ADD COLUMN brand TEXT;
  END IF;

  -- Añadir columna model si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'price_master' AND column_name = 'model'
  ) THEN
    ALTER TABLE price_master ADD COLUMN model TEXT;
  END IF;
END $$;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_price_master_color ON price_master(color);
CREATE INDEX IF NOT EXISTS idx_price_master_brand ON price_master(brand);
CREATE INDEX IF NOT EXISTS idx_price_master_model ON price_master(model);

-- Verificar estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'price_master'
ORDER BY ordinal_position;
