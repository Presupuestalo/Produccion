-- Crear todas las tablas necesarias para el sistema de marketplace de leads

-- 1. Tabla de créditos de empresa
CREATE TABLE IF NOT EXISTS company_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  credits_purchased_total INTEGER NOT NULL DEFAULT 0,
  credits_spent_total INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 2. Tabla de transacciones de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spent', 'refund')),
  amount INTEGER NOT NULL, -- positivo para compras/devoluciones, negativo para gastos
  payment_amount DECIMAL(10,2), -- precio en euros (solo para compras)
  description TEXT,
  lead_request_id UUID, -- si es gasto o devolución
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de configuración de preferencias de empresa
CREATE TABLE IF NOT EXISTS company_lead_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_radius_km INTEGER NOT NULL DEFAULT 30,
  accepted_reform_types TEXT[] DEFAULT ARRAY['reforma_integral', 'cocina', 'bano']::TEXT[],
  min_budget DECIMAL(10,2) DEFAULT 0,
  max_budget DECIMAL(10,2) DEFAULT 999999,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 4. Tabla de solicitudes de leads (publicadas por propietarios)
CREATE TABLE IF NOT EXISTS lead_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired', 'cancelled')),
  
  -- Información del proyecto
  estimated_budget DECIMAL(10,2) NOT NULL,
  credits_cost INTEGER NOT NULL, -- calculado según presupuesto
  reform_types TEXT[] NOT NULL,
  project_description TEXT, -- descripción adicional del propietario
  surface_m2 DECIMAL(10,2),
  
  -- Ubicación (PRIVADA - solo código postal y ciudad)
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'ES',
  location_lat DECIMAL(10,8), -- para cálculo de distancia
  location_lng DECIMAL(11,8),
  
  -- Contacto del cliente (OCULTO hasta que empresa acceda)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  
  -- Control de acceso
  max_companies INTEGER NOT NULL DEFAULT 4,
  companies_accessed_count INTEGER NOT NULL DEFAULT 0,
  companies_accessed_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Tiempos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- 48h después de creación
  closed_at TIMESTAMPTZ
);

-- 5. Tabla de interacciones con leads
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_request_id UUID NOT NULL REFERENCES lead_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Acciones
  action TEXT NOT NULL CHECK (action IN ('viewed', 'accessed', 'contacted', 'claim_no_response', 'won', 'lost')),
  credits_spent INTEGER, -- solo si action = 'accessed'
  credits_refunded INTEGER, -- solo si action = 'claim_no_response' y aprobado
  
  -- Notas internas de la empresa
  notes TEXT,
  
  -- Timestamps
  viewed_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  claim_submitted_at TIMESTAMPTZ,
  claim_resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_request_id, company_id)
);

-- 6. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_company_credits_company_id ON company_credits(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_company_id ON credit_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_lead_request ON credit_transactions(lead_request_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON lead_requests(status);
CREATE INDEX IF NOT EXISTS idx_lead_requests_homeowner ON lead_requests(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_location ON lead_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON lead_interactions(lead_request_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_company ON lead_interactions(company_id);

-- 7. Row Level Security (RLS) Policies

-- company_credits: Solo la empresa puede ver sus propios créditos
ALTER TABLE company_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresas ven sus propios créditos" ON company_credits;
CREATE POLICY "Empresas ven sus propios créditos" ON company_credits
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "Sistema puede gestionar créditos" ON company_credits;
CREATE POLICY "Sistema puede gestionar créditos" ON company_credits
  FOR ALL USING (true);

-- credit_transactions: Solo la empresa puede ver sus transacciones
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresas ven sus transacciones" ON credit_transactions;
CREATE POLICY "Empresas ven sus transacciones" ON credit_transactions
  FOR SELECT USING (company_id = auth.uid());

DROP POLICY IF EXISTS "Sistema puede crear transacciones" ON credit_transactions;
CREATE POLICY "Sistema puede crear transacciones" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- company_lead_preferences: Empresas gestionan sus preferencias
ALTER TABLE company_lead_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresas gestionan sus preferencias" ON company_lead_preferences;
CREATE POLICY "Empresas gestionan sus preferencias" ON company_lead_preferences
  FOR ALL USING (company_id = auth.uid());

-- lead_requests: Propietarios ven sus propias solicitudes
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietarios ven sus solicitudes" ON lead_requests;
CREATE POLICY "Propietarios ven sus solicitudes" ON lead_requests
  FOR SELECT USING (homeowner_id = auth.uid());

DROP POLICY IF EXISTS "Propietarios crean solicitudes" ON lead_requests;
CREATE POLICY "Propietarios crean solicitudes" ON lead_requests
  FOR INSERT WITH CHECK (homeowner_id = auth.uid());

DROP POLICY IF EXISTS "Empresas ven leads disponibles" ON lead_requests;
CREATE POLICY "Empresas ven leads disponibles" ON lead_requests
  FOR SELECT USING (status = 'open' AND companies_accessed_count < max_companies);

-- lead_interactions: Empresas ven sus propias interacciones
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Empresas ven sus interacciones" ON lead_interactions;
CREATE POLICY "Empresas ven sus interacciones" ON lead_interactions
  FOR ALL USING (company_id = auth.uid());

-- 8. Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_credits_updated_at ON company_credits;
CREATE TRIGGER update_company_credits_updated_at
  BEFORE UPDATE ON company_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_lead_preferences_updated_at ON company_lead_preferences;
CREATE TRIGGER update_company_lead_preferences_updated_at
  BEFORE UPDATE ON company_lead_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Función para calcular distancia entre coordenadas (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Radio de la Tierra en km
  dLat DECIMAL;
  dLng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLng := RADIANS(lng2 - lng1);
  
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLng/2) * SIN(dLng/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Función para calcular coste en créditos según presupuesto
CREATE OR REPLACE FUNCTION calculate_lead_credits_cost(budget DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  IF budget < 5000 THEN
    RETURN 8;
  ELSIF budget < 15000 THEN
    RETURN 15;
  ELSIF budget < 30000 THEN
    RETURN 25;
  ELSIF budget < 50000 THEN
    RETURN 35;
  ELSE
    RETURN 50;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'Tablas del marketplace creadas exitosamente';
END $$;
