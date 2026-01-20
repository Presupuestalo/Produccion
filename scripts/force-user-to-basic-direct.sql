DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'mikelfedzmcc@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Intentar obtener el ID del plan profesional_esencial
  SELECT id INTO v_plan_id 
  FROM subscription_plans 
  WHERE name = 'profesional_esencial';
  
  -- Si no existe el plan, crear uno básico
  IF v_plan_id IS NULL THEN
    -- Generar UUID explícitamente antes de insertar
    v_plan_id := gen_random_uuid();
    INSERT INTO subscription_plans (id, name, display_name)
    VALUES (v_plan_id, 'profesional_esencial', 'Plan Básico');
    
    RAISE NOTICE 'Plan creado con ID: %', v_plan_id;
  END IF;
  
  -- Actualizar el usuario
  UPDATE profiles
  SET 
    stripe_customer_id = 'cus_test_basic_' || substring(v_user_id::text from 1 for 8),
    stripe_subscription_id = 'sub_test_basic_' || substring(v_user_id::text from 1 for 8),
    subscription_plan_id = v_plan_id
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Usuario actualizado exitosamente';
  
  -- Mostrar el resultado
  RAISE NOTICE 'Resultado: user_id=%, plan_id=%', v_user_id, v_plan_id;
END $$;

-- Verificar el resultado final
SELECT 
  u.email,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_plan_id,
  sp.name as plan_name,
  sp.display_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
WHERE u.email = 'mikelfedzmcc@gmail.com';
