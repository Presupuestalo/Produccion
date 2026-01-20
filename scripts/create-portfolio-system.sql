-- Tabla de portafolio de profesionales
CREATE TABLE IF NOT EXISTS professional_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Tabla de imágenes de portafolio
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES professional_portfolio(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proyectos compartidos con empresas
CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_company TEXT,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit')),
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'accepted', 'rejected')),
  quote_amount NUMERIC(10, 2),
  quote_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones de profesionales
CREATE TABLE IF NOT EXISTS professional_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT false,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
  max_projects_per_month INTEGER DEFAULT 0,
  projects_received_this_month INTEGER DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  specialties JSONB DEFAULT '[]'::JSONB,
  service_area JSONB DEFAULT '{}'::JSONB, -- {city: string, province: string, radius_km: number}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir campos adicionales a profiles para profesionales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province TEXT;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON professional_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON professional_portfolio(is_public);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON professional_portfolio(is_featured);
CREATE INDEX IF NOT EXISTS idx_shared_projects_token ON shared_projects(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_projects_email ON shared_projects(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_shared_projects_status ON shared_projects(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON professional_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON professional_subscriptions(is_active);

-- Políticas RLS para professional_portfolio
ALTER TABLE professional_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios portfolios"
  ON professional_portfolio FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Los usuarios pueden insertar en su propio portfolio"
  ON professional_portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar su propio portfolio"
  ON professional_portfolio FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar de su propio portfolio"
  ON professional_portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para portfolio_images
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Las imágenes son visibles si el portfolio es público o es del usuario"
  ON portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND (professional_portfolio.user_id = auth.uid() OR professional_portfolio.is_public = true)
    )
  );

CREATE POLICY "Los usuarios pueden insertar imágenes en su portfolio"
  ON portfolio_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden actualizar imágenes de su portfolio"
  ON portfolio_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden eliminar imágenes de su portfolio"
  ON portfolio_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

-- Políticas RLS para shared_projects
ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver proyectos que compartieron"
  ON shared_projects FOR SELECT
  USING (auth.uid() = shared_by);

CREATE POLICY "Los usuarios pueden compartir sus propios proyectos"
  ON shared_projects FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Los usuarios pueden actualizar proyectos que compartieron"
  ON shared_projects FOR UPDATE
  USING (auth.uid() = shared_by);

CREATE POLICY "Los usuarios pueden eliminar proyectos que compartieron"
  ON shared_projects FOR DELETE
  USING (auth.uid() = shared_by);

-- Políticas RLS para professional_subscriptions
ALTER TABLE professional_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propia suscripción"
  ON professional_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar su propia suscripción"
  ON professional_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar su propia suscripción"
  ON professional_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para resetear el contador mensual de proyectos
CREATE OR REPLACE FUNCTION reset_monthly_project_count()
RETURNS void AS $$
BEGIN
  UPDATE professional_subscriptions
  SET projects_received_this_month = 0,
      last_reset_date = NOW()
  WHERE last_reset_date < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Mostrar confirmación
SELECT 'Sistema de portafolio y compartir proyectos creado correctamente' as status;
