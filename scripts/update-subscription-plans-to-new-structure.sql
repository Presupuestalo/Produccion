-- =====================================================
-- ACTUALIZACIÓN DE PLANES DE SUSCRIPCIÓN
-- Free, Basic, Pro, Business
-- =====================================================

-- Primero, eliminar las políticas RLS existentes
DROP POLICY IF EXISTS "Los planes son públicos para lectura" ON subscription_plans;
DROP POLICY IF EXISTS "Solo admins pueden modificar planes" ON subscription_plans;

-- Eliminar la tabla existente y recrearla con la nueva estructura
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Crear tabla de planes con la nueva estructura
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Límites del plan
  max_projects INTEGER, -- NULL = ilimitado
  max_rooms_per_project INTEGER, -- NULL = ilimitado
  max_budgets_per_project INTEGER, -- NULL = ilimitado
  
  -- Características booleanas
  custom_prices BOOLEAN DEFAULT FALSE,
  ai_price_addition BOOLEAN DEFAULT FALSE,
  price_import BOOLEAN DEFAULT FALSE,
  ai_floor_plan_recognition BOOLEAN DEFAULT FALSE,
  pdf_export BOOLEAN DEFAULT FALSE,
  pdf_watermark BOOLEAN DEFAULT TRUE,
  custom_contracts BOOLEAN DEFAULT FALSE,
  ai_tools_daily_limit INTEGER, -- NULL = ilimitado, 0 = no incluido
  appointments BOOLEAN DEFAULT FALSE,
  photos BOOLEAN DEFAULT FALSE,
  
  -- Metadatos
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar los 4 nuevos planes con los precios actualizados
INSERT INTO subscription_plans (
  id,
  name,
  display_name,
  description,
  price_monthly,
  price_yearly,
  max_projects,
  max_rooms_per_project,
  max_budgets_per_project,
  custom_prices,
  ai_price_addition,
  price_import,
  ai_floor_plan_recognition,
  pdf_export,
  pdf_watermark,
  custom_contracts,
  ai_tools_daily_limit,
  appointments,
  photos,
  sort_order
) VALUES 
  -- Plan FREE
  (
    'free',
    'free',
    'Free',
    'Plan gratuito para probar la plataforma',
    0.00,    -- Precio mensual: 0€
    0.00,    -- Precio anual: 0€
    1,              -- 1 Proyecto
    6,              -- 6 Max Habitaciones/proyecto (sin cambios)
    1,              -- 1 Presupuesto/proyecto
    TRUE,           -- Precios personalizados: inc
    FALSE,          -- Añadir Precios con IA: No inc
    FALSE,          -- Importación Precios: No inc
    FALSE,          -- Reconocimiento planos IA: No inc
    TRUE,           -- Presupuestos PDF: Inc
    TRUE,           -- PDF con marca de agua
    FALSE,          -- Contratos personalizados: No inc
    0,              -- HERRAMIENTAS IA: no inc
    FALSE,          -- Citas: No inc
    FALSE,          -- Fotos: No inc
    1               -- sort_order para ordenamiento
  ),
  
  -- Plan BASIC
  (
    'basic',
    'basic',
    'Basic',
    'Plan básico para profesionales',
    29.00,   -- Precio mensual: 29€
    278.40,  -- Precio anual: 278.40€ (29 * 12 * 0.8 = 20% descuento)
    10,             -- 10 Proyectos
    10,             -- 10 Max Habitaciones/proyecto (cambiado de 6 a 10)
    1,              -- 1 Presupuesto/proyecto
    TRUE,           -- Precios personalizados: inc
    FALSE,          -- Añadir Precios con IA: no inc
    FALSE,          -- Importación Precios: no inc
    FALSE,          -- Reconocimiento planos IA: no inc
    TRUE,           -- Presupuestos PDF: Inc
    FALSE,          -- PDF sin marca de agua (cambiado de TRUE a FALSE)
    TRUE,           -- Contratos personalizados: Inc
    3,              -- HERRAMIENTAS IA: 3 usos/día
    FALSE,          -- Citas: No inc
    FALSE,          -- Fotos: No inc
    2               -- sort_order para ordenamiento
  ),
  
  -- Plan PRO
  (
    'pro',
    'pro',
    'Pro',
    'Plan profesional con IA avanzada',
    59.00,   -- Precio mensual: 59€
    566.40,  -- Precio anual: 566.40€ (59 * 12 * 0.8 = 20% descuento)
    20,             -- 20 Proyectos
    15,             -- 15 Max Habitaciones/proyecto (cambiado de 8 a 15)
    2,              -- 2 Presupuestos/proyecto
    TRUE,           -- Precios personalizados: inc
    TRUE,           -- Añadir Precios con IA: Incluido
    TRUE,           -- Importación Precios: Inc
    TRUE,           -- Reconocimiento planos IA: Incluido
    TRUE,           -- Presupuestos PDF: Inc
    FALSE,          -- PDF Sin marca de agua
    TRUE,           -- Contratos personalizados: inc
    3,              -- HERRAMIENTAS IA: 3 usos/día
    TRUE,           -- Citas: Incluido
    TRUE,           -- Fotos: Incluido
    3               -- sort_order para ordenamiento
  ),
  
  -- Plan BUSINESS
  (
    'business',
    'business',
    'Business',
    'Plan empresarial con todo ilimitado',
    99.00,   -- Precio mensual: 99€
    950.40,  -- Precio anual: 950.40€ (99 * 12 * 0.8 = 20% descuento)
    NULL,           -- Proyectos ilimitados
    NULL,           -- Habitaciones ilimitadas (cambiado de 15 a NULL)
    NULL,           -- Presupuestos ilimitados (cambiado de 5 a NULL)
    TRUE,           -- Precios personalizados: incluido
    TRUE,           -- Añadir Precios con IA: Incluido
    TRUE,           -- Importación Precios: Inc
    TRUE,           -- Reconocimiento planos IA: Incluido
    TRUE,           -- Presupuestos PDF: Inc
    FALSE,          -- PDF Sin marca de agua
    TRUE,           -- Contratos personalizados: inc
    NULL,           -- HERRAMIENTAS IA: ilimitado
    TRUE,           -- Citas: Incluido
    TRUE,           -- Fotos: Incluido
    4               -- sort_order para ordenamiento
  );

-- Migración segura: eliminar y recrear la columna subscription_plan_id como TEXT
DO $$ 
BEGIN
  -- Eliminar la columna antigua si existe (puede ser UUID)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_plan_id;
  END IF;
  
  -- Crear la nueva columna como TEXT con referencia a subscription_plans
  ALTER TABLE profiles ADD COLUMN subscription_plan_id TEXT DEFAULT 'free' REFERENCES subscription_plans(id);
END $$;

-- Todos los usuarios empiezan con el plan FREE
UPDATE profiles SET subscription_plan_id = 'free' WHERE subscription_plan_id IS NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan_id ON profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- Habilitar RLS en la tabla subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer los planes (son públicos)
CREATE POLICY "Los planes son públicos para lectura"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Solo admins pueden modificar planes
CREATE POLICY "Solo admins pueden modificar planes"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'mikelfedz@gmail.com');

-- Comentarios para documentación
COMMENT ON TABLE subscription_plans IS 'Tabla que define los planes de suscripción: Free, Basic, Pro, Business';
COMMENT ON COLUMN subscription_plans.max_projects IS 'Número máximo de proyectos. NULL = ilimitado';
COMMENT ON COLUMN subscription_plans.max_rooms_per_project IS 'Número máximo de habitaciones por proyecto. NULL = ilimitado';
COMMENT ON COLUMN subscription_plans.max_budgets_per_project IS 'Número máximo de presupuestos por proyecto. NULL = ilimitado';
COMMENT ON COLUMN subscription_plans.ai_tools_daily_limit IS 'Límite diario de herramientas IA. NULL = ilimitado, 0 = no incluido';
COMMENT ON COLUMN subscription_plans.sort_order IS 'Orden de visualización: 1=Free, 2=Basic, 3=Pro, 4=Business';
