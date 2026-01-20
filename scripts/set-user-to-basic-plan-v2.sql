-- Script para asignar plan Basic (profesional_esencial) a mikelfedzmcc@gmail.com
-- Este script primero verifica/crea los planes si no existen

DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
  v_plan_exists BOOLEAN;
BEGIN
  -- Verificar si la tabla subscription_plans existe y tiene datos
  SELECT EXISTS (
    SELECT 1 FROM subscription_plans LIMIT 1
  ) INTO v_plan_exists;

  -- Si no existen planes, crearlos primero
  IF NOT v_plan_exists THEN
    RAISE NOTICE 'Creando planes de suscripción...';
    
    -- Insertar los 4 planes básicos
    INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, max_projects, max_rooms, sort_order)
    VALUES 
      ('free', 'Free', 0.00, 0.00, 2, 6, 1),
      ('profesional_esencial', 'Profesional Esencial', 29.99, 299.99, 10, 20, 2),
      ('pro_ia', 'Pro IA', 59.99, 599.99, NULL, NULL, 3),
      ('empresa', 'Empresa', 99.99, 999.99, NULL, NULL, 4)
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE 'Planes creados exitosamente';
  END IF;

  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mikelfedzmcc@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email mikelfedzmcc@gmail.com no encontrado';
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_user_id;

  -- Buscar el plan "profesional_esencial"
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE name = 'profesional_esencial';

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan profesional_esencial no encontrado';
  END IF;

  RAISE NOTICE 'Plan Basic encontrado: %', v_plan_id;

  -- Actualizar el perfil del usuario con el nuevo plan
  UPDATE profiles
  SET 
    subscription_plan_id = v_plan_id,
    stripe_customer_id = COALESCE(stripe_customer_id, 'cus_test_' || substr(md5(random()::text), 1, 14)),
    stripe_subscription_id = COALESCE(stripe_subscription_id, 'sub_test_' || substr(md5(random()::text), 1, 14)),
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Usuario actualizado a plan Basic exitosamente';

  -- Verificar el cambio
  RAISE NOTICE '--- Verificación ---';
  RAISE NOTICE 'Email: mikelfedzmcc@gmail.com';
  RAISE NOTICE 'Plan: profesional_esencial (Basic)';
  RAISE NOTICE 'Stripe Customer ID: %', (SELECT stripe_customer_id FROM profiles WHERE id = v_user_id);

END $$;
