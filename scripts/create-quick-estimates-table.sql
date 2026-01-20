-- Tabla para almacenar todas las estimaciones rápidas
CREATE TABLE IF NOT EXISTS quick_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Datos del formulario
  square_meters VARCHAR(50) NOT NULL,
  rooms VARCHAR(10) NOT NULL,
  bathrooms VARCHAR(10) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  heating_type VARCHAR(100) NOT NULL,
  available_budget VARCHAR(50),
  
  -- Moneda
  currency_code VARCHAR(10) NOT NULL,
  currency_symbol VARCHAR(10) NOT NULL,
  
  -- Resultado de la estimación
  estimated_price_range TEXT,
  estimated_breakdown JSONB,
  
  -- Datos de contacto (si solicita presupuestos)
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  reform_type VARCHAR(100),
  project_description TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar las consultas de estadísticas
CREATE INDEX IF NOT EXISTS idx_quick_estimates_country ON quick_estimates(country);
CREATE INDEX IF NOT EXISTS idx_quick_estimates_city ON quick_estimates(city);
CREATE INDEX IF NOT EXISTS idx_quick_estimates_created_at ON quick_estimates(created_at);
CREATE INDEX IF NOT EXISTS idx_quick_estimates_user_id ON quick_estimates(user_id);

-- RLS (Row Level Security)
ALTER TABLE quick_estimates ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propias estimaciones
CREATE POLICY "Users can view own estimates"
  ON quick_estimates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias estimaciones
CREATE POLICY "Users can insert own estimates"
  ON quick_estimates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política: Los administradores pueden ver todas las estimaciones
-- (Necesitarás crear una tabla de roles o usar metadata en auth.users)
CREATE POLICY "Admins can view all estimates"
  ON quick_estimates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_quick_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_quick_estimates_updated_at
  BEFORE UPDATE ON quick_estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_estimates_updated_at();

COMMENT ON TABLE quick_estimates IS 'Almacena todas las estimaciones rápidas de presupuestos para análisis estadístico';
