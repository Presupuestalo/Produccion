-- Crear tabla de portafolio profesional
CREATE TABLE IF NOT EXISTS professional_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  specialties TEXT[],
  years_experience INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Crear tabla de imágenes del portafolio
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES professional_portfolio(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  project_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de proyectos compartidos
CREATE TABLE IF NOT EXISTS shared_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'quoted', 'accepted', 'rejected')),
  message TEXT,
  quote_amount DECIMAL(10, 2),
  quote_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de suscripciones profesionales
CREATE TABLE IF NOT EXISTS professional_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  projects_limit INTEGER DEFAULT 5,
  projects_used INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Políticas RLS para professional_portfolio
ALTER TABLE professional_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portafolios públicos son visibles para todos"
  ON professional_portfolio FOR SELECT
  USING (is_public = true);

CREATE POLICY "Usuarios pueden ver su propio portafolio"
  ON professional_portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear su portafolio"
  ON professional_portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su portafolio"
  ON professional_portfolio FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su portafolio"
  ON professional_portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para portfolio_images
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imágenes de portafolios públicos son visibles"
  ON portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.is_public = true
    )
  );

CREATE POLICY "Usuarios pueden ver imágenes de su portafolio"
  ON portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden añadir imágenes a su portafolio"
  ON portfolio_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar imágenes de su portafolio"
  ON portfolio_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM professional_portfolio
      WHERE professional_portfolio.id = portfolio_images.portfolio_id
      AND professional_portfolio.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar imágenes de su portafolio"
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

CREATE POLICY "Clientes pueden ver proyectos que compartieron"
  ON shared_projects FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Profesionales pueden ver proyectos compartidos con ellos"
  ON shared_projects FOR SELECT
  USING (auth.uid() = professional_id);

CREATE POLICY "Clientes pueden compartir proyectos"
  ON shared_projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Profesionales pueden actualizar estado de proyectos"
  ON shared_projects FOR UPDATE
  USING (auth.uid() = professional_id);

-- Políticas RLS para professional_subscriptions
ALTER TABLE professional_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propia suscripción"
  ON professional_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear su suscripción"
  ON professional_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su suscripción"
  ON professional_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON professional_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_is_public ON professional_portfolio(is_public);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_portfolio_id ON portfolio_images(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_client_id ON shared_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_professional_id ON shared_projects(professional_id);
CREATE INDEX IF NOT EXISTS idx_shared_projects_status ON shared_projects(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON professional_subscriptions(user_id);

-- Función para resetear el contador mensual de proyectos
CREATE OR REPLACE FUNCTION reset_monthly_project_counter()
RETURNS void AS $$
BEGIN
  UPDATE professional_subscriptions
  SET projects_used = 0
  WHERE DATE_PART('day', NOW() - start_date) >= 30;
END;
$$ LANGUAGE plpgsql;
