-- Script para configurar planes de suscripción

-- Añadir columna subscription_plan a profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium'));
  END IF;
END $$;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- Actualizar usuarios existentes al plan free por defecto
UPDATE profiles 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Verificar estructura
SELECT 
  id,
  email,
  subscription_plan,
  created_at
FROM profiles
LIMIT 5;
