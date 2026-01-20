-- Crear tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Límites del plan
  max_projects INTEGER NOT NULL DEFAULT 1,
  max_clients INTEGER NOT NULL DEFAULT 5,
  max_storage_mb INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_ai_requests_monthly INTEGER NOT NULL DEFAULT 0,
  
  -- Características booleanas
  has_advanced_calculations BOOLEAN DEFAULT FALSE,
  has_pdf_export BOOLEAN DEFAULT FALSE,
  has_ai_floor_plans BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,
  has_custom_branding BOOLEAN DEFAULT FALSE,
  has_api_access BOOLEAN DEFAULT FALSE,
  
  -- Metadatos
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar los 4 planes
INSERT INTO subscription_plans (
  id, 
  name, 
  display_name, 
  description,
  price_monthly,
  price_yearly,
  max_projects,
  max_clients,
  max_storage_mb,
  max_users,
  max_ai_requests_monthly,
  has_advanced_calculations,
  has_pdf_export,
  has_ai_floor_plans,
  has_priority_support,
  has_custom_branding,
  has_api_access,
  sort_order
) VALUES 
  -- Plan Free
  (
    'free',
    'Free',
    'Plan Gratuito',
    'Perfecto para probar la plataforma y proyectos pequeños',
    0.00,
    0.00,
    1,           -- 1 proyecto
    5,           -- 5 clientes
    50,          -- 50 MB almacenamiento
    1,           -- 1 usuario
    10,          -- 10 peticiones IA al mes
    FALSE,       -- Sin cálculos avanzados
    FALSE,       -- Sin exportación PDF
    FALSE,       -- Sin IA para planos
    FALSE,       -- Sin soporte prioritario
    FALSE,       -- Sin branding personalizado
    FALSE,       -- Sin acceso API
    1
  ),
  
  -- Plan Starter
  (
    'starter',
    'Starter',
    'Plan Inicial',
    'Ideal para profesionales que empiezan',
    9.99,
    99.00,
    10,          -- 10 proyectos
    25,          -- 25 clientes
    500,         -- 500 MB almacenamiento
    1,           -- 1 usuario
    100,         -- 100 peticiones IA al mes
    TRUE,        -- Cálculos avanzados
    TRUE,        -- Exportación PDF
    FALSE,       -- Sin IA para planos
    FALSE,       -- Sin soporte prioritario
    FALSE,       -- Sin branding personalizado
    FALSE,       -- Sin acceso API
    2
  ),
  
  -- Plan Professional
  (
    'professional',
    'Professional',
    'Plan Profesional',
    'Para profesionales con múltiples proyectos',
    29.99,
    299.00,
    100,         -- 100 proyectos
    200,         -- 200 clientes
    5000,        -- 5 GB almacenamiento
    5,           -- 5 usuarios
    500,         -- 500 peticiones IA al mes
    TRUE,        -- Cálculos avanzados
    TRUE,        -- Exportación PDF
    TRUE,        -- IA para planos
    TRUE,        -- Soporte prioritario
    TRUE,        -- Branding personalizado
    FALSE,       -- Sin acceso API
    3
  ),
  
  -- Plan Business
  (
    'business',
    'Business',
    'Plan Empresa',
    'Solución completa para empresas y equipos grandes',
    99.99,
    999.00,
    -1,          -- Proyectos ilimitados (-1 = ilimitado)
    -1,          -- Clientes ilimitados
    50000,       -- 50 GB almacenamiento
    -1,          -- Usuarios ilimitados
    -1,          -- Peticiones IA ilimitadas
    TRUE,        -- Cálculos avanzados
    TRUE,        -- Exportación PDF
    TRUE,        -- IA para planos
    TRUE,        -- Soporte prioritario
    TRUE,        -- Branding personalizado
    TRUE,        -- Acceso API
    4
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_projects = EXCLUDED.max_projects,
  max_clients = EXCLUDED.max_clients,
  max_storage_mb = EXCLUDED.max_storage_mb,
  max_users = EXCLUDED.max_users,
  max_ai_requests_monthly = EXCLUDED.max_ai_requests_monthly,
  has_advanced_calculations = EXCLUDED.has_advanced_calculations,
  has_pdf_export = EXCLUDED.has_pdf_export,
  has_ai_floor_plans = EXCLUDED.has_ai_floor_plans,
  has_priority_support = EXCLUDED.has_priority_support,
  has_custom_branding = EXCLUDED.has_custom_branding,
  has_api_access = EXCLUDED.has_api_access,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Agregar columna subscription_plan a la tabla profiles si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free' REFERENCES subscription_plans(id);
  END IF;
END $$;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- Habilitar RLS en la tabla subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer los planes (son públicos)
CREATE POLICY "Los planes son públicos para lectura"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Solo admins pueden modificar planes (puedes ajustar esto según tus necesidades)
CREATE POLICY "Solo admins pueden modificar planes"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'mikelfedz@gmail.com');

COMMENT ON TABLE subscription_plans IS 'Tabla que define los planes de suscripción disponibles con sus límites y características';
COMMENT ON COLUMN subscription_plans.max_projects IS 'Número máximo de proyectos permitidos. -1 = ilimitado';
COMMENT ON COLUMN subscription_plans.max_clients IS 'Número máximo de clientes permitidos. -1 = ilimitado';
COMMENT ON COLUMN subscription_plans.max_users IS 'Número máximo de usuarios en el equipo. -1 = ilimitado';
COMMENT ON COLUMN subscription_plans.max_ai_requests_monthly IS 'Número máximo de peticiones IA al mes. -1 = ilimitado';
