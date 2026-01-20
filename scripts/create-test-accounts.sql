-- Script para crear cuentas de prueba para diferentes planes
-- Password para todas las cuentas: Test1234!

-- IMPORTANTE: Este script crea usuarios directamente en auth.users
-- Ejecutar solo en desarrollo/staging, NO en producción

DO $$
DECLARE
  free_plan_id UUID;
  basic_plan_id UUID;
  pro_plan_id UUID;
  empresa_plan_id UUID;
  user_id UUID;
BEGIN
  -- Obtener IDs de los planes
  SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free';
  SELECT id INTO basic_plan_id FROM subscription_plans WHERE name = 'profesional_esencial';
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'pro_ia';
  SELECT id INTO empresa_plan_id FROM subscription_plans WHERE name = 'empresa';

  -- Crear usuario con plan FREE
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'test-free@presupuestalo.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_id;

  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, user_type, subscription_plan_id)
    VALUES (user_id, 'test-free@presupuestalo.com', 'Usuario Free Test', 'professional', free_plan_id);
  END IF;

  -- Crear usuario con plan BASIC
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'test-basic@presupuestalo.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_id;

  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, user_type, subscription_plan_id)
    VALUES (user_id, 'test-basic@presupuestalo.com', 'Usuario Basic Test', 'professional', basic_plan_id);
  END IF;

  -- Crear usuario con plan PRO IA
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'test-pro@presupuestalo.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_id;

  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, user_type, subscription_plan_id)
    VALUES (user_id, 'test-pro@presupuestalo.com', 'Usuario Pro IA Test', 'professional', pro_plan_id);
  END IF;

  -- Crear usuario con plan EMPRESA
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'test-empresa@presupuestalo.com',
    crypt('Test1234!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user_id;

  IF user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, user_type, subscription_plan_id)
    VALUES (user_id, 'test-empresa@presupuestalo.com', 'Usuario Empresa Test', 'professional', empresa_plan_id);
  END IF;

  RAISE NOTICE 'Cuentas de prueba creadas exitosamente';
  RAISE NOTICE 'Emails: test-free@, test-basic@, test-pro@, test-empresa@ presupuestalo.com';
  RAISE NOTICE 'Password para todas: Test1234!';
END $$;
