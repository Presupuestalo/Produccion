-- Crear tabla para solicitudes de presupuesto
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del formulario de estimación
  square_meters TEXT NOT NULL,
  rooms TEXT NOT NULL,
  bathrooms TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  heating_type TEXT NOT NULL,
  features TEXT,
  available_budget TEXT,
  
  -- Datos de la solicitud de presupuesto
  reform_type TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Resultado de la estimación
  price_range TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  
  -- Explicación generada por IA
  ai_explanation TEXT,
  
  -- Estado de la solicitud
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_country_city ON quote_requests(country, city);

-- RLS Policies
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias solicitudes
CREATE POLICY "Users can view own quote requests"
  ON quote_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias solicitudes
CREATE POLICY "Users can insert own quote requests"
  ON quote_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias solicitudes
CREATE POLICY "Users can update own quote requests"
  ON quote_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_requests_updated_at();
