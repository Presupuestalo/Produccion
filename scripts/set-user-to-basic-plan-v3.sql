-- Script para asignar el usuario mikelfedzmcc@gmail.com al plan Basic
-- Primero crea los planes si no existen, luego asigna el usuario

-- Paso 1: Insertar planes usando UPSERT (solo si no existen)
INSERT INTO subscription_plans (name, stripe_price_id, price, features)
VALUES 
  ('free', 'price_free', 0, '{"projects": 1, "rooms": "unlimited", "pdf_export": true}'),
  ('profesional_esencial', 'price_profesional_esencial', 29, '{"projects": 1, "rooms": "unlimited", "pdf_export": true, "ai_suggestions": false}'),
  ('pro_ia', 'price_pro_ia', 49, '{"projects": "unlimited", "rooms": "unlimited", "pdf_export": true, "ai_suggestions": true}'),
  ('empresa', 'price_empresa', 99, '{"projects": "unlimited", "rooms": "unlimited", "pdf_export": true, "ai_suggestions": true, "priority_support": true}')
ON CONFLICT (name) DO NOTHING;

RAISE NOTICE 'Planes de suscripción verificados/creados';

-- Paso 2: Buscar el ID del usuario
DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Buscar usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mikelfedzmcc@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario mikelfedzmcc@gmail.com no encontrado';
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: %', v_user_id;
  
  -- Buscar el plan Basic (profesional_esencial)
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE name = 'profesional_esencial';
  
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan profesional_esencial no encontrado';
  END IF;
  
  RAISE NOTICE 'Plan encontrado: %', v_plan_id;
  
  -- Actualizar el perfil del usuario
  UPDATE profiles
  SET 
    subscription_plan_id = v_plan_id,
    stripe_customer_id = 'cus_test_basic_' || substring(v_user_id::text, 1, 8),
    stripe_subscription_id = 'sub_test_basic_' || substring(v_user_id::text, 1, 8),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Usuario actualizado correctamente al plan Basic';
  
END $$;

-- Paso 3: Verificar el resultado
SELECT 
  au.email,
  sp.name as plan_name,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
WHERE au.email = 'mikelfedzmcc@gmail.com';
