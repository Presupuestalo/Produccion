-- Script para asignar el usuario mikelfedzmcc@gmail.com al plan Basic
-- Versión simplificada sin bloques complejos

-- Paso 1: Insertar planes si no existen
INSERT INTO subscription_plans (name, stripe_price_id, price, features)
VALUES 
  ('free', 'price_free', 0, '{"projects": 1, "rooms": "unlimited", "pdf_export": true}'),
  ('profesional_esencial', 'price_profesional_esencial', 29, '{"projects": 1, "rooms": "unlimited", "pdf_export": true, "ai_suggestions": false}'),
  ('pro_ia', 'price_pro_ia', 49, '{"projects": "unlimited", "rooms": "unlimited", "pdf_export": true, "ai_suggestions": true}'),
  ('empresa', 'price_empresa', 99, '{"projects": "unlimited", "rooms": "unlimited", "pdf_export": true, "ai_suggestions": true, "priority_support": true}')
ON CONFLICT (name) DO NOTHING;

-- Paso 2: Actualizar el usuario directamente con una subconsulta
UPDATE profiles
SET 
  subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'profesional_esencial'),
  stripe_customer_id = 'cus_test_basic_mikelfedz',
  stripe_subscription_id = 'sub_test_basic_mikelfedz',
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'mikelfedzmcc@gmail.com');

-- Paso 3: Verificar el resultado
SELECT 
  au.email,
  sp.name as plan_name,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.updated_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id
WHERE au.email = 'mikelfedzmcc@gmail.com';
