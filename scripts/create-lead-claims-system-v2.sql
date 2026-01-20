-- =====================================================
-- Sistema de Reclamaciones para Presmarket v2
-- Días de expiración: 30 días
-- =====================================================

-- 1. Añadir nuevos estados y campos a lead_interactions
ALTER TABLE lead_interactions
ADD COLUMN IF NOT EXISTS claim_reason TEXT,
ADD COLUMN IF NOT EXISTS claim_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS claim_status TEXT CHECK (claim_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS claim_resolved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS claim_resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contact_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('contacted', 'negotiating', 'won', 'lost', 'claim_requested'));

-- 2. Crear tabla de reclamaciones separada para mejor tracking
CREATE TABLE IF NOT EXISTS lead_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_interaction_id UUID NOT NULL REFERENCES lead_interactions(id) ON DELETE CASCADE,
  lead_request_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Datos del lead para referencia
  lead_title TEXT,
  lead_city TEXT,
  
  -- Motivo y detalles
  reason TEXT NOT NULL CHECK (reason IN (
    'phone_off',
    'no_answer',
    'wrong_number',
    'email_bounced',
    'already_hired',
    'fake_data',
    'other'
  )),
  reason_details TEXT,
  
  -- Intentos de contacto declarados
  call_attempts INTEGER NOT NULL DEFAULT 0,
  call_dates TEXT[],
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  
  -- Créditos
  credits_spent INTEGER NOT NULL,
  credits_to_refund INTEGER NOT NULL,
  
  -- Estado de la reclamación
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Resolución (solo admins)
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_interaction_id)
);

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_lead_claims_status ON lead_claims(status);
CREATE INDEX IF NOT EXISTS idx_lead_claims_professional ON lead_claims(professional_id);
CREATE INDEX IF NOT EXISTS idx_lead_claims_created ON lead_claims(created_at DESC);

-- 4. RLS para lead_claims
ALTER TABLE lead_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profesionales ven sus reclamaciones" ON lead_claims;
CREATE POLICY "Profesionales ven sus reclamaciones" ON lead_claims
  FOR SELECT USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Profesionales crean reclamaciones" ON lead_claims;
CREATE POLICY "Profesionales crean reclamaciones" ON lead_claims
  FOR INSERT WITH CHECK (professional_id = auth.uid());

-- Admins pueden ver y actualizar todas las reclamaciones
DROP POLICY IF EXISTS "Admins gestionan reclamaciones" ON lead_claims;
CREATE POLICY "Admins gestionan reclamaciones" ON lead_claims
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR email IN ('pascualmollar@gmail.com', 'admin@presupuestalo.es'))
    )
  );

-- 5. Actualizar lead_requests para expiración a 30 días
ALTER TABLE lead_requests
ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '30 days';

-- Actualizar leads existentes sin expiración
UPDATE lead_requests 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL OR expires_at < NOW();

-- 6. Añadir columnas de tracking de reclamaciones a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_claims_submitted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_claims_approved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_claims_rejected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS claim_abuse_flag BOOLEAN DEFAULT FALSE;

-- 7. Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_lead_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_claims_updated_at ON lead_claims;
CREATE TRIGGER trigger_lead_claims_updated_at
  BEFORE UPDATE ON lead_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_claims_updated_at();

-- 8. Trigger para actualizar contadores de reclamaciones en profiles
CREATE OR REPLACE FUNCTION update_profile_claim_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET total_claims_submitted = COALESCE(total_claims_submitted, 0) + 1
    WHERE id = NEW.professional_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    IF NEW.status = 'approved' THEN
      UPDATE profiles 
      SET total_claims_approved = COALESCE(total_claims_approved, 0) + 1
      WHERE id = NEW.professional_id;
    ELSE
      UPDATE profiles 
      SET total_claims_rejected = COALESCE(total_claims_rejected, 0) + 1,
          claim_abuse_flag = CASE 
            WHEN COALESCE(total_claims_rejected, 0) + 1 >= 3 THEN TRUE 
            ELSE claim_abuse_flag 
          END
      WHERE id = NEW.professional_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_claim_stats ON lead_claims;
CREATE TRIGGER trigger_update_claim_stats
  AFTER INSERT OR UPDATE ON lead_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_claim_stats();

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'Sistema de reclamaciones v2 creado exitosamente - Expiración 30 días';
END $$;
