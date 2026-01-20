-- Añadir columna de ordenamiento a la tabla subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Establecer el orden correcto: Free, Basic, Pro, Business
UPDATE subscription_plans SET sort_order = 1 WHERE id = 'free';
UPDATE subscription_plans SET sort_order = 2 WHERE id = 'basic';
UPDATE subscription_plans SET sort_order = 3 WHERE id = 'pro';
UPDATE subscription_plans SET sort_order = 4 WHERE id = 'business';

-- Crear índice para mejorar el rendimiento de las consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order 
ON subscription_plans(sort_order);
