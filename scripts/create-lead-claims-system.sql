-- =====================================================
-- Sistema de Reclamaciones para Presmarket
-- =====================================================

-- 1. Añadir nuevos estados a lead_interactions
-- Los estados actuales son: viewed, accessed, contacted, claim_no_response, won, lost
-- Añadimos: claim_pending, claim_approved, claim_rejected

-- 2. Añadir campos para el sistema de reclamaciones
ALTER TABLE lead_interactions
ADD COLUMN IF NOT EXISTS claim_reason TEXT,
ADD COLUMN IF NOT EXISTS claim_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS claim_status TEXT CHECK (claim_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS claim_resolved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS claim_resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contact_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('negotiating', 'won', 'lost'));

-- 3. Crear tabla de reclamaciones separada para mejor tracking
CREATE TABLE IF NOT EXISTS lead_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_interaction_id UUID NOT NULL REFERENCES lead_interactions(id) ON DELETE CASCADE,
  lead_request_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Motivo y detalles
  reason TEXT NOT NULL CHECK (reason IN (
    'phone_off', -- Teléfono apagado/fuera de servicio
    'no_answer', -- No contesta tras múltiples intentos
    'wrong_number', -- Número incorrecto/no existe
    'email_bounced', -- Email rebotado
    'already_hired', -- El propietario ya contrató a otro
    'fake_data', -- Datos falsos/spam
    'other' -- Otro motivo
  )),
  reason_details TEXT,
  
  -- Intentos de contacto declarados
  call_attempts INTEGER NOT NULL DEFAULT 0,
  call_dates TEXT[], -- Fechas de las llamadas
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  
  -- Créditos
  credits_spent INTEGER NOT NULL,
  credits_to_refund INTEGER NOT NULL, -- 75% del gasto
  
  -- Estado de la reclamación
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Resolución (solo admins)
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_interaction_id) -- Solo una reclamación por interacción
);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_lead_claims_status ON lead_claims(status);
CREATE INDEX IF NOT EXISTS idx_lead_claims_professional ON lead_claims(professional_id);
CREATE INDEX IF NOT EXISTS idx_lead_claims_created ON lead_claims(created_at);

-- 5. RLS para lead_claims
ALTER TABLE lead_claims ENABLE ROW LEVEL SECURITY;

-- Profesionales ven sus propias reclamaciones
DROP POLICY IF EXISTS "Profesionales ven sus reclamaciones" ON lead_claims;
CREATE POLICY "Profesionales ven sus reclamaciones" ON lead_claims
  FOR SELECT USING (professional_id = auth.uid());

-- Profesionales pueden crear reclamaciones
DROP POLICY IF EXISTS "Profesionales crean reclamaciones" ON lead_claims;
CREATE POLICY "Profesionales crean reclamaciones" ON lead_claims
  FOR INSERT WITH CHECK (professional_id = auth.uid());

-- 6. Actualizar lead_requests para expiración a 30 días
ALTER TABLE lead_requests
ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '30 days';

-- 7. Añadir columna para contar reclamaciones del profesional (para anti-abuso)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_claims_submitted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_claims_approved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_claims_rejected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS claim_abuse_flag BOOLEAN DEFAULT FALSE;

-- 8. Trigger para actualizar timestamps
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

-- 9. Trigger para actualizar contadores de reclamaciones en profiles
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
          -- Marcar como abuso si tiene 3+ rechazadas
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
  RAISE NOTICE 'Sistema de reclamaciones creado exitosamente';
END $$;
