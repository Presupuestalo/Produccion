-- Add user_id column to price_categories
ALTER TABLE price_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies
DROP POLICY IF EXISTS "Todos pueden ver categorías activas" ON price_categories;

CREATE POLICY "Ver categorías globales y propias"
  ON price_categories FOR SELECT
  USING (
    (user_id IS NULL AND is_active = true) OR 
    (auth.uid() = user_id)
  );

CREATE POLICY "Usuarios pueden crear sus categorías"
  ON price_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus categorías"
  ON price_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus categorías"
  ON price_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_price_categories_user ON price_categories(user_id);
