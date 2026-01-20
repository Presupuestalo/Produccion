-- Crear tabla para almacenar diseños generados
CREATE TABLE IF NOT EXISTS generated_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  designs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_generated_designs_user_id ON generated_designs(user_id);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_generated_designs_created_at ON generated_designs(created_at DESC);

-- Habilitar RLS
ALTER TABLE generated_designs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios diseños
CREATE POLICY "Users can view their own designs"
  ON generated_designs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear diseños
CREATE POLICY "Users can create designs"
  ON generated_designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus diseños
CREATE POLICY "Users can delete their own designs"
  ON generated_designs
  FOR DELETE
  USING (auth.uid() = user_id);
