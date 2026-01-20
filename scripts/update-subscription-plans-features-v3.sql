-- =====================================================
-- Script para actualizar planes de suscripción
-- Versión 3: Añade columnas de forma segura antes de actualizar
-- =====================================================

-- PASO 1: Añadir TODAS las columnas necesarias si no existen
-- ===========================================================

-- Columnas de límites
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_projects INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_budgets_per_project INTEGER DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ai_tools_daily_limit INTEGER;

-- Columnas de características booleanas
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_custom_prices BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_accounting BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS can_import_prices BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_ai_prices BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_ai_floor_plans BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_watermark BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_custom_contracts BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_appointments BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_appointment_reminders BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_photo_gallery BOOLEAN DEFAULT true;

-- Columna de tipo de soporte
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS support_type TEXT DEFAULT 'email';

-- PASO 2: Actualizar plan FREE
-- ============================
UPDATE subscription_plans
SET 
  max_projects = 1,
  max_budgets_per_project = 1,
  ai_tools_daily_limit = 3,
  has_custom_prices = true,
  has_accounting = true,
  can_import_prices = false,
  has_ai_prices = false,
  has_ai_floor_plans = false,
  has_watermark = true,
  has_custom_contracts = false,
  has_appointments = true,
  has_appointment_reminders = false,
  has_photo_gallery = true,
  support_type = 'email'
WHERE LOWER(name) = 'free' OR id = 'free';

-- PASO 3: Actualizar plan BASIC
-- =============================
UPDATE subscription_plans
SET 
  max_projects = NULL, -- ilimitado
  max_budgets_per_project = 3,
  ai_tools_daily_limit = 5,
  has_custom_prices = true,
  has_accounting = true,
  can_import_prices = true,
  has_ai_prices = false,
  has_ai_floor_plans = false,
  has_watermark = false,
  has_custom_contracts = true,
  has_appointments = true,
  has_appointment_reminders = true,
  has_photo_gallery = true,
  support_type = 'email'
WHERE LOWER(name) = 'basic' OR id = 'basic';

-- PASO 4: Actualizar plan PRO
-- ===========================
UPDATE subscription_plans
SET 
  max_projects = NULL, -- ilimitado
  max_budgets_per_project = 5,
  ai_tools_daily_limit = NULL, -- ilimitado
  has_custom_prices = true,
  has_accounting = true,
  can_import_prices = true,
  has_ai_prices = true,
  has_ai_floor_plans = true,
  has_watermark = false,
  has_custom_contracts = true,
  has_appointments = true,
  has_appointment_reminders = true,
  has_photo_gallery = true,
  support_type = 'priority'
WHERE LOWER(name) = 'pro' OR id = 'pro';

-- PASO 5: Eliminar plan Business si existe
-- ========================================
DELETE FROM subscription_plans 
WHERE LOWER(name) = 'business' OR id = 'business';

-- PASO 6: Verificar resultado
-- ===========================
SELECT 
  id,
  name,
  max_projects,
  max_budgets_per_project,
  ai_tools_daily_limit,
  can_import_prices,
  has_ai_prices,
  has_ai_floor_plans,
  has_watermark,
  has_custom_contracts,
  has_appointments,
  has_appointment_reminders,
  has_photo_gallery,
  support_type
FROM subscription_plans
ORDER BY 
  CASE 
    WHEN LOWER(name) = 'free' THEN 1
    WHEN LOWER(name) = 'basic' THEN 2
    WHEN LOWER(name) = 'pro' THEN 3
    ELSE 4
  END;
