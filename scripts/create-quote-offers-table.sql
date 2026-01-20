-- Crear tabla para ofertas de profesionales a solicitudes de presupuesto
CREATE TABLE IF NOT EXISTS quote_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Datos de la oferta
  offered_price DECIMAL(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  estimated_duration TEXT NOT NULL, -- ej: "2-3 semanas"
  description TEXT NOT NULL,
  includes TEXT, -- Qué incluye la oferta
  excludes TEXT, -- Qué no incluye
  
  -- Información del profesional
  company_name TEXT,
  professional_phone TEXT NOT NULL,
  professional_email TEXT NOT NULL,
  
  -- Estado de la oferta
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  
  -- Notificaciones
  viewed_by_client BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_quote_offers_request_id ON quote_offers(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_professional_id ON quote_offers(professional_id);
CREATE INDEX IF NOT EXISTS idx_quote_offers_status ON quote_offers(status);
CREATE INDEX IF NOT EXISTS idx_quote_offers_created_at ON quote_offers(created_at DESC);

-- RLS Policies
ALTER TABLE quote_offers ENABLE ROW LEVEL SECURITY;

-- Los profesionales pueden ver sus propias ofertas
CREATE POLICY "Professionals can view own offers"
  ON quote_offers FOR SELECT
  USING (auth.uid() = professional_id);

-- Los clientes pueden ver ofertas a sus solicitudes
CREATE POLICY "Clients can view offers to their requests"
  ON quote_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = quote_offers.quote_request_id
      AND quote_requests.user_id = auth.uid()
    )
  );

-- Los profesionales pueden insertar ofertas
CREATE POLICY "Professionals can insert offers"
  ON quote_offers FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

-- Los profesionales pueden actualizar sus propias ofertas
CREATE POLICY "Professionals can update own offers"
  ON quote_offers FOR UPDATE
  USING (auth.uid() = professional_id);

-- Los clientes pueden actualizar el estado de ofertas a sus solicitudes
CREATE POLICY "Clients can update offer status"
  ON quote_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = quote_offers.quote_request_id
      AND quote_requests.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_quote_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_offers_updated_at
  BEFORE UPDATE ON quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_offers_updated_at();

-- Trigger para marcar solicitud como "quoted" cuando recibe primera oferta
CREATE OR REPLACE FUNCTION update_request_status_on_offer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quote_requests
  SET status = 'quoted'
  WHERE id = NEW.quote_request_id
  AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_status_on_offer
  AFTER INSERT ON quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_request_status_on_offer();
