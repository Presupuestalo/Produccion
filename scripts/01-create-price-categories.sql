-- Crear tabla de categorías de precios
CREATE TABLE IF NOT EXISTS price_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías principales
INSERT INTO price_categories (id, name, description, icon, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Albañilería', 'Trabajos de construcción y mampostería', '🧱', 1),
  ('22222222-2222-2222-2222-222222222222', 'Fontanería', 'Instalaciones de agua y saneamiento', '🚰', 2),
  ('33333333-3333-3333-3333-333333333333', 'Electricidad', 'Instalaciones eléctricas', '⚡', 3),
  ('44444444-4444-4444-4444-444444444444', 'Carpintería', 'Puertas, ventanas y trabajos en madera', '🚪', 4),
  ('55555555-5555-5555-5555-555555555555', 'Pintura', 'Trabajos de pintura y acabados', '🎨', 5),
  ('66666666-6666-6666-6666-666666666666', 'Materiales', 'Materiales de construcción', '📦', 6),
  ('77777777-7777-7777-7777-777777777777', 'Climatización', 'Calefacción y aire acondicionado', '🌡️', 7),
  ('88888888-8888-8888-8888-888888888888', 'Sanitarios', 'Aparatos sanitarios y accesorios', '🚽', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Índices
CREATE INDEX IF NOT EXISTS idx_price_categories_active ON price_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_price_categories_order ON price_categories(display_order);

-- Habilitar RLS
ALTER TABLE price_categories ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Todos pueden ver categorías activas" ON price_categories;

-- Políticas: todos pueden ver categorías activas
CREATE POLICY "Todos pueden ver categorías activas"
  ON price_categories FOR SELECT
  USING (is_active = true);
