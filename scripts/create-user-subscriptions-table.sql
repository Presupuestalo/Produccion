-- Crear tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Plan y estado
  plan_id TEXT REFERENCES subscription_plans(id) DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, trialing
  billing_type TEXT DEFAULT 'monthly', -- monthly, annual
  
  -- Fechas
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Solo el service role puede modificar suscripciones (webhooks)
CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE user_subscriptions IS 'Tabla que guarda las suscripciones activas de cada usuario';
