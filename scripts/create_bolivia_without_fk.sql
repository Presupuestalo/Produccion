-- Crear tabla Bolivia sin foreign key constraint primero
DROP TABLE IF EXISTS price_master_bolivia CASCADE;

CREATE TABLE price_master_bolivia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category_id TEXT NOT NULL,  -- Sin foreign key por ahora
  subcategory TEXT,
  description TEXT,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar qué categorías existen antes de insertar
SELECT 'Categorías disponibles:' as info;
SELECT id, name FROM price_categories ORDER BY name;
