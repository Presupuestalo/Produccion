-- Script para cambiar el usuario mikelfedzmcc@gmail.com al plan Basic (profesional_esencial)
-- Ejecuta este script en el SQL Editor de Supabase

DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Obtener el ID del usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mikelfedzmcc@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email mikelfedzmcc@gmail.com no encontrado';
  END IF;

  -- Obtener el ID del plan 'profesional_esencial' (Basic)
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE name = 'profesional_esencial';

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan profesional_esencial no encontrado';
  END IF;

  -- Actualizar el usuario al plan Basic
  UPDATE profiles
  SET 
    subscription_plan_id = v_plan_id,
    stripe_customer_id = 'cus_test_' || substr(md5(random()::text), 1, 14), -- ID ficticio de Stripe para testing
    stripe_subscription_id = 'sub_test_' || substr(md5(random()::text), 1, 14), -- ID ficticio de suscripción
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Usuario % actualizado correctamente al plan Basic', 'mikelfedzmcc@gmail.com';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Plan ID: %', v_plan_id;
END $$;

-- Verificar el cambio
SELECT 
  u.email,
  p.subscription_plan_id,
  sp.name as plan_name,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
WHERE u.email = 'mikelfedzmcc@gmail.com';
