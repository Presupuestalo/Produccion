-- Script simple: cambiar usuario a plan básico simulado
-- Este script NO requiere que la tabla subscription_plans esté poblada

-- Paso 1: Actualizar el usuario con IDs ficticios de Stripe para que se detecte como usuario de pago
UPDATE profiles
SET 
  stripe_customer_id = 'cus_test_basic_123456',
  stripe_subscription_id = 'sub_test_basic_123456'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mikelfedzmcc@gmail.com'
);

-- Paso 2: Verificar el cambio
SELECT 
  u.email,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_plan_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mikelfedzmcc@gmail.com';
