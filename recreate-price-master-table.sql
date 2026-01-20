-- ALTERNATIVA: Recrear la tabla price_master con la estructura correcta
-- ADVERTENCIA: Este script eliminará todos los datos existentes
-- Solo usar si la tabla está vacía o quieres empezar de cero

-- Hacer backup de los datos existentes (opcional)
CREATE TABLE IF NOT EXISTS price_master_backup AS 
SELECT * FROM price_master;

-- Eliminar la tabla existente
DROP TABLE IF EXISTS price_master CASCADE;

-- Recrear la tabla con la estructura correcta
CREATE TABLE price_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES price_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL DEFAULT 'Ud',
  labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  material_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  equipment_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  base_price DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + material_cost + equipment_cost + other_cost) STORED,
  margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 + margin_percentage / 100)) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_price_master_category ON price_master(category_id);
CREATE INDEX idx_price_master_code ON price_master(code);
CREATE INDEX idx_price_master_user ON price_master(user_id);
CREATE INDEX idx_price_master_active ON price_master(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver precios activos
CREATE POLICY "Anyone can view active prices"
  ON price_master
  FOR SELECT
  USING (is_active = true);

-- Política: Los usuarios pueden ver sus propios precios personalizados (incluso inactivos)
CREATE POLICY "Users can view their own custom prices"
  ON price_master
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Los usuarios pueden crear sus propios precios personalizados
CREATE POLICY "Users can create custom prices"
  ON price_master
  FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid());

-- Política: Los usuarios pueden actualizar sus propios precios personalizados
CREATE POLICY "Users can update their own custom prices"
  ON price_master
  FOR UPDATE
  USING (is_custom = true AND user_id = auth.uid())
  WITH CHECK (is_custom = true AND user_id = auth.uid());

-- Política: Los usuarios pueden eliminar sus propios precios personalizados
CREATE POLICY "Users can delete their own custom prices"
  ON price_master
  FOR DELETE
  USING (is_custom = true AND user_id = auth.uid());

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_price_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_master_updated_at
  BEFORE UPDATE ON price_master
  FOR EACH ROW
  EXECUTE FUNCTION update_price_master_updated_at();

-- Restaurar datos del backup (si existe)
-- INSERT INTO price_master (code, category_id, subcategory, description, ...)
-- SELECT code, category_id, subcategory, description, ... FROM price_master_backup;

-- Eliminar el backup después de verificar
-- DROP TABLE IF EXISTS price_master_backup;
