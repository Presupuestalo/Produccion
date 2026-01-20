-- Crear tabla para almacenar planos 3D
CREATE TABLE IF NOT EXISTS floor_plans_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_plan_url TEXT NOT NULL,
  rooms_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_floor_plans_3d_user_id ON floor_plans_3d(user_id);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_floor_plans_3d_created_at ON floor_plans_3d(created_at DESC);

-- Habilitar RLS
ALTER TABLE floor_plans_3d ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios planos
CREATE POLICY "Users can view their own floor plans"
  ON floor_plans_3d
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear planos
CREATE POLICY "Users can create floor plans"
  ON floor_plans_3d
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus planos
CREATE POLICY "Users can delete their own floor plans"
  ON floor_plans_3d
  FOR DELETE
  USING (auth.uid() = user_id);
