-- Crear tabla para productos de Amazon
CREATE TABLE IF NOT EXISTS amazon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin VARCHAR(20) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  rating DECIMAL(2, 1),
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  brand VARCHAR(200),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_amazon_products_category ON amazon_products(category);
CREATE INDEX IF NOT EXISTS idx_amazon_products_subcategory ON amazon_products(subcategory);
CREATE INDEX IF NOT EXISTS idx_amazon_products_asin ON amazon_products(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_products_name ON amazon_products USING gin(to_tsvector('spanish', name));

-- Habilitar RLS
ALTER TABLE amazon_products ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer productos
CREATE POLICY "Todos pueden ver productos de Amazon"
  ON amazon_products
  FOR SELECT
  TO public
  USING (true);

-- Política: Solo admins pueden insertar/actualizar
CREATE POLICY "Solo admins pueden gestionar productos"
  ON amazon_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'company')
    )
  );
