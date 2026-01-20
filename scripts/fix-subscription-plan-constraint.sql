-- Script para arreglar el constraint de subscription_plan en profiles
-- El error es: "new row for relation 'profiles' violates check constraint 'profiles_subscription_plan_check'"

-- 1. Eliminar el constraint existente
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

-- 2. Actualizar valores existentes que puedan estar en formatos diferentes
UPDATE profiles SET subscription_plan = LOWER(subscription_plan) WHERE subscription_plan IS NOT NULL;
UPDATE profiles SET subscription_plan = 'free' WHERE subscription_plan IS NULL OR subscription_plan = '';

-- 3. Crear el nuevo constraint con todos los valores posibles
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('free', 'basic', 'professional', 'enterprise', 'pro', 'premium', 'business'));

-- 4. Verificar el resultado
SELECT subscription_plan, COUNT(*) as total
FROM profiles
GROUP BY subscription_plan;
