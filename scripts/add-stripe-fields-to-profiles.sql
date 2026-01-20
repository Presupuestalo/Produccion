-- Añadir campos de Stripe a la tabla profiles para sincronización
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);

-- Añadir email a profiles si no existe (necesario para webhooks)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Crear índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
