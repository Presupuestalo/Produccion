-- Sistema de Referidos para Presupuéstalo
-- Rewards: Basic = 100 créditos (ambos), Pro = 150 créditos (ambos)
-- Protección: Teléfono verificado via SMS Twilio

-- 1. Tabla de códigos de referido
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT 5, -- Máximo 5 referidos activos por usuario
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de relaciones de referidos
CREATE TABLE IF NOT EXISTS referral_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'phone_verified', 'converted', 'rewarded', 'expired')),
  -- pending: usuario registrado con código
  -- phone_verified: teléfono verificado via SMS
  -- converted: usuario pagó suscripción
  -- rewarded: créditos otorgados a ambos
  -- expired: expirado sin conversión
  referred_phone VARCHAR(20),
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  subscription_plan VARCHAR(20), -- basic o pro
  converted_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(referred_id) -- Un usuario solo puede ser referido una vez
);

-- 3. Tabla de recompensas de referidos
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_relationship_id UUID NOT NULL REFERENCES referral_relationships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('referrer', 'referred')),
  credits_amount INTEGER NOT NULL,
  plan_type VARCHAR(20) NOT NULL, -- basic o pro
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'failed')),
  granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referrer_id ON referral_relationships(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referred_id ON referral_relationships(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_status ON referral_relationships(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);

-- 5. Función para generar código de referido único
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar código: REF_ + 6 caracteres alfanuméricos
    new_code := 'REF_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_id::TEXT) FROM 1 FOR 6));
    
    -- Verificar que no existe
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para crear código de referido para un usuario
CREATE OR REPLACE FUNCTION create_user_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Verificar si ya tiene código
  SELECT code INTO existing_code FROM referral_codes WHERE user_id = p_user_id AND is_active = true;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generar nuevo código
  new_code := generate_referral_code(p_user_id);
  
  -- Insertar
  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para obtener créditos según plan
CREATE OR REPLACE FUNCTION get_referral_credits(plan_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE plan_type
    WHEN 'basic' THEN RETURN 100;
    WHEN 'pro' THEN RETURN 150;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para otorgar recompensas de referidos
CREATE OR REPLACE FUNCTION grant_referral_rewards(p_relationship_id UUID, p_plan_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_id UUID;
  v_credits INTEGER;
  v_status TEXT;
BEGIN
  -- Obtener datos de la relación
  SELECT referrer_id, referred_id, status 
  INTO v_referrer_id, v_referred_id, v_status
  FROM referral_relationships 
  WHERE id = p_relationship_id;
  
  -- Verificar que está en estado phone_verified o converted
  IF v_status NOT IN ('phone_verified', 'converted') THEN
    RAISE EXCEPTION 'Relationship is not in valid state for rewards: %', v_status;
  END IF;
  
  -- Obtener cantidad de créditos
  v_credits := get_referral_credits(p_plan_type);
  
  IF v_credits = 0 THEN
    RAISE EXCEPTION 'Invalid plan type: %', p_plan_type;
  END IF;
  
  -- Crear registros de recompensa
  INSERT INTO referral_rewards (referral_relationship_id, user_id, reward_type, credits_amount, plan_type)
  VALUES 
    (p_relationship_id, v_referrer_id, 'referrer', v_credits, p_plan_type),
    (p_relationship_id, v_referred_id, 'referred', v_credits, p_plan_type);
  
  -- Actualizar créditos del referrer (en company_credits si es profesional)
  UPDATE company_credits 
  SET credits_balance = credits_balance + v_credits,
      credits_purchased_total = credits_purchased_total + v_credits,
      updated_at = NOW()
  WHERE company_id = v_referrer_id;
  
  -- Si no existe en company_credits, crear registro
  IF NOT FOUND THEN
    INSERT INTO company_credits (company_id, credits_balance, credits_purchased_total, credits_spent_total)
    VALUES (v_referrer_id, v_credits, v_credits, 0);
  END IF;
  
  -- Actualizar créditos del referido
  UPDATE company_credits 
  SET credits_balance = credits_balance + v_credits,
      credits_purchased_total = credits_purchased_total + v_credits,
      updated_at = NOW()
  WHERE company_id = v_referred_id;
  
  -- Si no existe en company_credits, crear registro
  IF NOT FOUND THEN
    INSERT INTO company_credits (company_id, credits_balance, credits_purchased_total, credits_spent_total)
    VALUES (v_referred_id, v_credits, v_credits, 0);
  END IF;
  
  -- Marcar recompensas como granted
  UPDATE referral_rewards 
  SET status = 'granted', granted_at = NOW()
  WHERE referral_relationship_id = p_relationship_id;
  
  -- Actualizar relación a rewarded
  UPDATE referral_relationships 
  SET status = 'rewarded', 
      rewarded_at = NOW(),
      subscription_plan = p_plan_type,
      updated_at = NOW()
  WHERE id = p_relationship_id;
  
  -- Incrementar contador de usos del código
  UPDATE referral_codes 
  SET uses_count = uses_count + 1,
      updated_at = NOW()
  WHERE id = (SELECT referral_code_id FROM referral_relationships WHERE id = p_relationship_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas para referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
CREATE POLICY "Users can view their own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own referral codes" ON referral_codes;
CREATE POLICY "Users can create their own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view active referral codes by code" ON referral_codes;
CREATE POLICY "Anyone can view active referral codes by code" ON referral_codes
  FOR SELECT USING (is_active = true);

-- Políticas para referral_relationships
DROP POLICY IF EXISTS "Users can view their referral relationships" ON referral_relationships;
CREATE POLICY "Users can view their referral relationships" ON referral_relationships
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "System can manage referral relationships" ON referral_relationships;
CREATE POLICY "System can manage referral relationships" ON referral_relationships
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para referral_rewards
DROP POLICY IF EXISTS "Users can view their referral rewards" ON referral_rewards;
CREATE POLICY "Users can view their referral rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- 10. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON referral_codes;
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON referral_codes
  FOR EACH ROW EXECUTE FUNCTION update_referral_updated_at();

DROP TRIGGER IF EXISTS update_referral_relationships_updated_at ON referral_relationships;
CREATE TRIGGER update_referral_relationships_updated_at
  BEFORE UPDATE ON referral_relationships
  FOR EACH ROW EXECUTE FUNCTION update_referral_updated_at();

-- 11. Vista para estadísticas de referidos
CREATE OR REPLACE VIEW referral_stats AS
SELECT 
  rc.user_id,
  rc.code,
  rc.max_uses,
  rc.uses_count,
  COUNT(rr.id) FILTER (WHERE rr.status = 'pending') as pending_count,
  COUNT(rr.id) FILTER (WHERE rr.status = 'phone_verified') as phone_verified_count,
  COUNT(rr.id) FILTER (WHERE rr.status = 'converted') as converted_count,
  COUNT(rr.id) FILTER (WHERE rr.status = 'rewarded') as rewarded_count,
  COALESCE(SUM(rw.credits_amount) FILTER (WHERE rw.status = 'granted'), 0) as total_credits_earned
FROM referral_codes rc
LEFT JOIN referral_relationships rr ON rr.referral_code_id = rc.id
LEFT JOIN referral_rewards rw ON rw.referral_relationship_id = rr.id AND rw.reward_type = 'referrer'
GROUP BY rc.user_id, rc.code, rc.max_uses, rc.uses_count;

-- Dar permisos a la vista
GRANT SELECT ON referral_stats TO authenticated;

COMMENT ON TABLE referral_codes IS 'Códigos de referido únicos por usuario';
COMMENT ON TABLE referral_relationships IS 'Relaciones entre referrers y referidos';
COMMENT ON TABLE referral_rewards IS 'Historial de recompensas otorgadas';
