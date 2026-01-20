-- Script simple para asignar el usuario mikelfedzmcc@gmail.com al plan Basic

-- 1. Asegurarse de que los planes existen (ejecutar el script de creación si es necesario)
-- Si los planes ya existen, esto no hace nada gracias a ON CONFLICT
INSERT INTO subscription_plans (
  name, 
  display_name, 
  price_monthly, 
  price_yearly,
  max_projects,
  max_rooms,
  sort_order
) VALUES
('free', 'Free', 0.00, 0.00, 2, 6, 1),
('profesional_esencial', 'Profesional Esencial', 29.99, 299.99, 10, 20, 2),
('pro_ia', 'Pro IA', 59.99, 599.99, NULL, NULL, 3),
('empresa', 'Empresa', 99.99, 999.99, NULL, NULL, 4)
ON CONFLICT (name) DO NOTHING;

-- 2. Actualizar el usuario al plan Basic (profesional_esencial)
UPDATE profiles 
SET 
  subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'profesional_esencial'),
  stripe_customer_id = 'cus_test_basic_' || substring(id::text from 1 for 8),
  stripe_subscription_id = 'sub_test_basic_' || substring(id::text from 1 for 8),
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mikelfedzmcc@gmail.com'
);

-- 3. Verificar el resultado
SELECT 
  u.email,
  sp.name as plan_name,
  sp.display_name as plan_display_name,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
WHERE u.email = 'mikelfedzmcc@gmail.com';
