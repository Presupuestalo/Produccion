-- Tabla para registrar usuarios que han eliminado su cuenta
CREATE TABLE IF NOT EXISTS deleted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  user_type TEXT, -- 'propietario' o 'profesional'
  company_name TEXT, -- Solo para profesionales
  phone TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  subscription_plan TEXT,
  projects_count INTEGER DEFAULT 0,
  quotes_sent_count INTEGER DEFAULT 0, -- Para profesionales
  quotes_received_count INTEGER DEFAULT 0, -- Para propietarios
  credits_remaining INTEGER DEFAULT 0,
  account_created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deletion_reason TEXT, -- Campo opcional para futuro uso
  additional_data JSONB -- Para guardar cualquier info extra relevante
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_deleted_users_email ON deleted_users(email);
CREATE INDEX IF NOT EXISTS idx_deleted_users_user_type ON deleted_users(user_type);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at ON deleted_users(deleted_at);

-- RLS
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver esta tabla (a través de service role)
CREATE POLICY "Solo service role puede insertar" ON deleted_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Solo service role puede leer" ON deleted_users
  FOR SELECT USING (true);
