-- Añadir columnas faltantes a price_master_bolivia para que coincida con price_master

-- Columnas de costos
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS material_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS equipment_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS other_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2) DEFAULT 0;

-- Columnas de descripción adicional
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS notes TEXT;

-- Columnas de materiales
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS model TEXT;

-- Columnas de control
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE price_master_bolivia ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Actualizar precios existentes con valores calculados
UPDATE price_master_bolivia 
SET 
  base_price = final_price / 1.20,  -- Asumiendo 20% de margen
  margin_percentage = 20,
  is_active = true,
  is_custom = false
WHERE base_price = 0 OR base_price IS NULL;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_bolivia_user ON price_master_bolivia(user_id);
CREATE INDEX IF NOT EXISTS idx_price_master_bolivia_active ON price_master_bolivia(is_active);
CREATE INDEX IF NOT EXISTS idx_price_master_bolivia_custom ON price_master_bolivia(is_custom);

-- Verificar el resultado
SELECT 
  'price_master_bolivia' as tabla,
  COUNT(*) as total_precios,
  COUNT(DISTINCT category_id) as categorias,
  MIN(final_price) as precio_min,
  MAX(final_price) as precio_max,
  AVG(final_price)::DECIMAL(10,2) as precio_promedio
FROM price_master_bolivia
WHERE is_active = true;
