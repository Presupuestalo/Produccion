-- Script para actualizar los planes de suscripción con las nuevas características
-- Versión 2: Más seguro, añade columnas si no existen antes de actualizar

-- Paso 1: Añadir TODAS las columnas necesarias si no existen
DO $$
BEGIN
    -- Columnas para límites
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_budgets_per_project') THEN
        ALTER TABLE subscription_plans ADD COLUMN max_budgets_per_project INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'ai_tools_daily_limit') THEN
        ALTER TABLE subscription_plans ADD COLUMN ai_tools_daily_limit INTEGER DEFAULT 3;
    END IF;
    
    -- Columnas para características booleanas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'can_import_prices') THEN
        ALTER TABLE subscription_plans ADD COLUMN can_import_prices BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_custom_contracts') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_custom_contracts BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_appointment_reminders') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_appointment_reminders BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_photo_gallery') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_photo_gallery BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_accounting') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_accounting BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_ai_prices') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_ai_prices BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_floor_plan_recognition') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_floor_plan_recognition BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_appointments') THEN
        ALTER TABLE subscription_plans ADD COLUMN has_appointments BOOLEAN DEFAULT true;
    END IF;
    
    -- Columna para tipo de soporte
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'support_type') THEN
        ALTER TABLE subscription_plans ADD COLUMN support_type VARCHAR(50) DEFAULT 'email';
    END IF;
END $$;

-- Paso 2: Actualizar plan FREE
UPDATE subscription_plans SET
    max_projects = 1,
    max_budgets_per_project = 1,
    ai_tools_daily_limit = 3,
    can_import_prices = false,
    has_custom_contracts = false,
    has_appointment_reminders = false,
    has_photo_gallery = true,
    has_accounting = true,
    has_ai_prices = false,
    has_floor_plan_recognition = false,
    has_appointments = true,
    support_type = 'email',
    has_watermark = true
WHERE LOWER(name) LIKE '%free%' OR id = 'free';

-- Paso 3: Actualizar plan BASIC
UPDATE subscription_plans SET
    max_projects = NULL, -- ilimitado
    max_budgets_per_project = 3,
    ai_tools_daily_limit = 5,
    can_import_prices = true,
    has_custom_contracts = true,
    has_appointment_reminders = true,
    has_photo_gallery = true,
    has_accounting = true,
    has_ai_prices = false,
    has_floor_plan_recognition = false,
    has_appointments = true,
    support_type = 'email',
    has_watermark = false
WHERE LOWER(name) LIKE '%basic%' OR id = 'basic';

-- Paso 4: Actualizar plan PRO
UPDATE subscription_plans SET
    max_projects = NULL, -- ilimitado
    max_budgets_per_project = 5,
    ai_tools_daily_limit = NULL, -- ilimitado
    can_import_prices = true,
    has_custom_contracts = true,
    has_appointment_reminders = true,
    has_photo_gallery = true,
    has_accounting = true,
    has_ai_prices = true,
    has_floor_plan_recognition = true,
    has_appointments = true,
    support_type = 'priority',
    has_watermark = false
WHERE LOWER(name) LIKE '%pro%' OR id = 'pro';

-- Paso 5: Eliminar plan Business si existe
DELETE FROM subscription_plans 
WHERE LOWER(name) LIKE '%business%' OR id = 'business';

-- Paso 6: Eliminar columnas obsoletas si existen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_rooms') THEN
        ALTER TABLE subscription_plans DROP COLUMN max_rooms;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'has_advanced_ai') THEN
        ALTER TABLE subscription_plans DROP COLUMN has_advanced_ai;
    END IF;
END $$;

-- Paso 7: Verificar resultado
SELECT 
    id,
    name,
    max_projects,
    max_budgets_per_project,
    ai_tools_daily_limit,
    can_import_prices,
    has_custom_contracts,
    has_appointment_reminders,
    has_photo_gallery,
    has_accounting,
    has_ai_prices,
    has_floor_plan_recognition,
    has_appointments,
    support_type,
    has_watermark
FROM subscription_plans
ORDER BY 
    CASE 
        WHEN LOWER(name) LIKE '%free%' THEN 1
        WHEN LOWER(name) LIKE '%basic%' THEN 2
        WHEN LOWER(name) LIKE '%pro%' THEN 3
        ELSE 4
    END;
