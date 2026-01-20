-- Crear tabla maestra de precios
CREATE TABLE IF NOT EXISTS price_master (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES price_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  
  -- Precios base
  material_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  
  -- Márgenes y precio final
  profit_margin DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  
  -- Campos específicos para materiales
  color TEXT,
  brand TEXT,
  model TEXT,
  
  -- Metadatos
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Restricción: precios personalizados deben tener user_id
  CONSTRAINT check_custom_has_user CHECK (
    (is_custom = false) OR (is_custom = true AND user_id IS NOT NULL)
  )
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_category ON price_master(category_id);
CREATE INDEX IF NOT EXISTS idx_price_master_code ON price_master(code);
CREATE INDEX IF NOT EXISTS idx_price_master_user ON price_master(user_id);
CREATE INDEX IF NOT EXISTS idx_price_master_active ON price_master(is_active);
CREATE INDEX IF NOT EXISTS idx_price_master_custom ON price_master(is_custom);
CREATE INDEX IF NOT EXISTS idx_price_master_base_price ON price_master(base_price);
CREATE INDEX IF NOT EXISTS idx_price_master_final_price ON price_master(final_price);

-- Habilitar RLS
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver precios base y propios"
  ON price_master FOR SELECT
  USING (
    is_custom = false OR 
    (is_custom = true AND user_id = auth.uid())
  );

CREATE POLICY "Usuarios pueden crear precios personalizados"
  ON price_master FOR INSERT
  WITH CHECK (
    is_custom = true AND 
    user_id = auth.uid() AND
    created_by = auth.uid()
  );

CREATE POLICY "Usuarios pueden editar sus precios personalizados"
  ON price_master FOR UPDATE
  USING (
    is_custom = true AND 
    user_id = auth.uid()
  )
  WITH CHECK (
    is_custom = true AND 
    user_id = auth.uid()
  );

CREATE POLICY "Usuarios pueden eliminar sus precios personalizados"
  ON price_master FOR DELETE
  USING (
    is_custom = true AND 
    user_id = auth.uid()
  );

-- Trigger para actualizar updated_at
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
