-- Script para actualizar la tabla subscription_plans
-- Eliminar plan Business y hacer habitaciones ilimitadas para todos

-- 1. Actualizar todos los usuarios que tienen plan 'business' a 'pro'
UPDATE profiles 
SET subscription_plan = 'pro' 
WHERE subscription_plan = 'business';

-- 2. Eliminar el plan business de subscription_plans si existe
DELETE FROM subscription_plans WHERE id = 'business' OR name = 'business';

-- 3. Actualizar max_rooms a NULL (ilimitado) para todos los planes
UPDATE subscription_plans 
SET max_rooms_per_project = NULL
WHERE max_rooms_per_project IS NOT NULL;

-- También actualizar max_rooms si existe esa columna
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_rooms') THEN
        EXECUTE 'UPDATE subscription_plans SET max_rooms = NULL WHERE max_rooms IS NOT NULL';
    END IF;
END $$;

-- 4. Verificar los planes actuales
SELECT id, name, display_name, max_projects, 
       COALESCE(max_rooms_per_project::text, 'Ilimitado') as max_rooms,
       sort_order
FROM subscription_plans
ORDER BY sort_order;

-- 5. Comentario de documentación
COMMENT ON TABLE subscription_plans IS 'Tabla que define los planes de suscripción: Free, Basic, Pro. Business eliminado.';
