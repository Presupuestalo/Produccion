-- Crear tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  
  -- Límites de proyectos y habitaciones
  max_projects INTEGER, -- NULL = ilimitado
  max_rooms INTEGER, -- NULL = ilimitado
  max_custom_prices INTEGER, -- NULL = ilimitado
  
  -- Características de IA
  ai_price_import BOOLEAN DEFAULT false,
  ai_floor_plan_upload BOOLEAN DEFAULT false,
  
  -- Características de presupuestos
  pdf_export BOOLEAN DEFAULT false,
  pdf_watermark BOOLEAN DEFAULT false, -- true = con marca de agua
  templates BOOLEAN DEFAULT false,
  quick_estimate BOOLEAN DEFAULT false,
  budget_comparator BOOLEAN DEFAULT false,
  
  -- Características avanzadas
  design_generator BOOLEAN DEFAULT false,
  pro_visualizer BOOLEAN DEFAULT false,
  windows_feature BOOLEAN DEFAULT false,
  crm BOOLEAN DEFAULT false,
  global_percentage_adjuster BOOLEAN DEFAULT false,
  
  -- Metadatos
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar los 4 planes
INSERT INTO subscription_plans (
  name, 
  display_name, 
  price_monthly, 
  price_yearly,
  max_projects,
  max_rooms,
  max_custom_prices,
  ai_price_import,
  ai_floor_plan_upload,
  pdf_export,
  pdf_watermark,
  templates,
  quick_estimate,
  budget_comparator,
  design_generator,
  pro_visualizer,
  windows_feature,
  crm,
  global_percentage_adjuster,
  sort_order
) VALUES
-- Plan Free
(
  'free',
  'Free',
  0.00,
  0.00,
  2, -- 2 proyectos
  6, -- 6 habitaciones
  0, -- sin precios personalizados
  false, -- sin IA para precios
  false, -- sin IA para planos
  true, -- PDF con marca de agua
  true, -- con marca de agua
  false, -- sin plantillas
  false, -- sin estimación rápida
  false, -- sin comparador
  false, -- sin generador de diseños
  false, -- sin visualizador PRO
  false, -- sin ventanas
  false, -- sin CRM
  false, -- sin aumentador global
  1
),
-- Plan Profesional Esencial
(
  'profesional_esencial',
  'Profesional Esencial',
  29.99,
  299.99,
  10, -- 10 proyectos
  20, -- 20 habitaciones
  10, -- 10 precios personalizados
  false, -- sin IA para precios
  false, -- sin IA para planos
  true, -- PDF sin marca de agua
  false, -- sin marca de agua
  false, -- sin plantillas
  true, -- estimación rápida incluida
  true, -- comparador incluido
  true, -- generador de diseños incluido
  true, -- visualizador PRO incluido
  true, -- ventanas incluido
  false, -- sin CRM
  false, -- sin aumentador global
  2
),
-- Plan Pro IA
(
  'pro_ia',
  'Pro IA',
  59.99,
  599.99,
  NULL, -- proyectos ilimitados
  NULL, -- habitaciones ilimitadas
  NULL, -- precios personalizados ilimitados
  true, -- IA para precios incluida
  true, -- IA para planos incluida
  true, -- PDF incluido
  false, -- sin marca de agua
  true, -- plantillas incluidas
  true, -- estimación rápida incluida
  true, -- comparador incluido
  true, -- generador de diseños incluido
  true, -- visualizador PRO incluido
  true, -- ventanas incluido
  true, -- CRM incluido
  true, -- aumentador global incluido
  3
),
-- Plan Empresa
(
  'empresa',
  'Empresa',
  99.99,
  999.99,
  NULL, -- proyectos ilimitados
  NULL, -- habitaciones ilimitadas
  NULL, -- precios personalizados ilimitados
  true, -- IA para precios incluida
  true, -- IA para planos incluida
  true, -- PDF incluido
  false, -- sin marca de agua
  true, -- plantillas incluidas
  true, -- estimación rápida incluida
  true, -- comparador incluido
  true, -- generador de diseños incluido
  true, -- visualizador PRO incluido
  true, -- ventanas incluido
  true, -- CRM incluido
  true, -- aumentador global incluido
  4
);

-- Agregar columna de plan a la tabla de perfiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
    
    -- Asignar plan Free por defecto a todos los usuarios existentes
    UPDATE profiles 
    SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free')
    WHERE subscription_plan_id IS NULL;
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer los planes
CREATE POLICY "Los planes son públicos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo el usuario master puede modificar planes
CREATE POLICY "Solo admins pueden modificar planes"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE p.id = auth.uid()
      AND u.email = 'mikelfedz@gmail.com'
    )
  );
