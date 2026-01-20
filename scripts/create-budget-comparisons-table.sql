-- Crear tabla para almacenar comparaciones de presupuestos
CREATE TABLE IF NOT EXISTS budget_comparisons (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_urls TEXT[] NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_budget_comparisons_user_id ON budget_comparisons(user_id);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_budget_comparisons_created_at ON budget_comparisons(created_at DESC);

-- Habilitar RLS
ALTER TABLE budget_comparisons ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias comparaciones
CREATE POLICY "Users can view their own comparisons"
  ON budget_comparisons
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear comparaciones
CREATE POLICY "Users can create comparisons"
  ON budget_comparisons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus comparaciones
CREATE POLICY "Users can update their own comparisons"
  ON budget_comparisons
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus comparaciones
CREATE POLICY "Users can delete their own comparisons"
  ON budget_comparisons
  FOR DELETE
  USING (auth.uid() = user_id);
