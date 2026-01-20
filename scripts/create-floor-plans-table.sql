-- Crear tabla para almacenar planos 2D
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  walls JSONB NOT NULL DEFAULT '[]',
  doors JSONB NOT NULL DEFAULT '[]',
  windows JSONB NOT NULL DEFAULT '[]',
  rooms JSONB NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_floor_plans_user_id ON floor_plans(user_id);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_floor_plans_created_at ON floor_plans(created_at DESC);

-- Habilitar RLS
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios planos
CREATE POLICY "Users can view their own plans"
  ON floor_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear planos
CREATE POLICY "Users can create plans"
  ON floor_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus planos
CREATE POLICY "Users can update their own plans"
  ON floor_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus planos
CREATE POLICY "Users can delete their own plans"
  ON floor_plans
  FOR DELETE
  USING (auth.uid() = user_id);
