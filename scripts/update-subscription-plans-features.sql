-- Script para actualizar las características de los planes de suscripción
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir columnas de características si no existen
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS can_import_prices BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_appointment_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_photo_gallery BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_accounting BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS support_type TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS max_budgets_per_project INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ai_tools_daily_limit INTEGER DEFAULT 3;

-- Usar solo name o id para identificar planes (sin plan_type)

-- 2. Actualizar plan FREE
UPDATE subscription_plans
SET 
  max_projects = 1,
  max_budgets_per_project = 1,
  ai_tools_daily_limit = 3,
  can_import_prices = false,
  has_appointment_reminders = false,
  has_photo_gallery = true,
  has_accounting = true,
  has_custom_contracts = false,
  has_watermark = true,
  support_type = 'email',
  features = jsonb_build_object(
    'proyectos', '1 Proyecto',
    'presupuestos', '1 Presupuesto por proyecto',
    'precios_personalizados', true,
    'importa_precios', false,
    'contabilidad', true,
    'herramientas_ia', '3 usos/día',
    'anadir_precios_ia', false,
    'reconocimiento_planos_ia', false,
    'presupuestos_pdf', 'con marca de agua',
    'contratos_personalizados', false,
    'gestion_citas', 'Gestión de Citas',
    'galeria_fotos', true,
    'soporte', 'email'
  )
WHERE LOWER(name) = 'free' OR LOWER(id) = 'free';

-- 3. Actualizar plan BASIC
UPDATE subscription_plans
SET 
  max_projects = NULL, -- ilimitado
  max_budgets_per_project = 3,
  ai_tools_daily_limit = 5,
  can_import_prices = true,
  has_appointment_reminders = true,
  has_photo_gallery = true,
  has_accounting = true,
  has_custom_contracts = true,
  has_watermark = false,
  support_type = 'email',
  features = jsonb_build_object(
    'proyectos', 'Proyectos ilimitados',
    'presupuestos', '3 Presupuestos por proyecto',
    'precios_personalizados', true,
    'importa_precios', true,
    'contabilidad', true,
    'herramientas_ia', '5 usos/día',
    'anadir_precios_ia', false,
    'reconocimiento_planos_ia', false,
    'presupuestos_pdf', 'sin marca de agua',
    'contratos_personalizados', true,
    'gestion_citas', 'Gestión de Citas + Avisos',
    'galeria_fotos', true,
    'soporte', 'email'
  )
WHERE LOWER(name) = 'basic' OR LOWER(id) = 'basic';

-- 4. Actualizar plan PRO
UPDATE subscription_plans
SET 
  max_projects = NULL, -- ilimitado
  max_budgets_per_project = 5,
  ai_tools_daily_limit = NULL, -- ilimitado
  can_import_prices = true,
  has_appointment_reminders = true,
  has_photo_gallery = true,
  has_accounting = true,
  has_custom_contracts = true,
  has_watermark = false,
  support_type = 'priority',
  features = jsonb_build_object(
    'proyectos', 'Proyectos ilimitados',
    'presupuestos', '5 Presupuestos por proyecto',
    'precios_personalizados', true,
    'importa_precios', true,
    'contabilidad', true,
    'herramientas_ia', 'ilimitadas',
    'anadir_precios_ia', true,
    'reconocimiento_planos_ia', true,
    'presupuestos_pdf', 'sin marca de agua',
    'contratos_personalizados', true,
    'gestion_citas', 'Gestión de Citas + Avisos',
    'galeria_fotos', true,
    'soporte', 'priority'
  )
WHERE LOWER(name) IN ('pro', 'professional') OR LOWER(id) IN ('pro', 'professional');

-- 5. Eliminar columnas obsoletas que ya no se usan
ALTER TABLE subscription_plans 
DROP COLUMN IF EXISTS max_rooms,
DROP COLUMN IF EXISTS has_advanced_ai;

-- 6. Eliminar plan Business si existe
DELETE FROM subscription_plans 
WHERE LOWER(name) LIKE '%business%' OR LOWER(id) LIKE '%business%';

-- 7. Verificar cambios
SELECT 
  id,
  name,
  max_projects,
  max_budgets_per_project,
  ai_tools_daily_limit,
  can_import_prices,
  has_appointment_reminders,
  support_type,
  features
FROM subscription_plans
ORDER BY sort_order;
