-- Script para crear tabla de precios específica para Perú
-- Adaptado con terminología y precios del mercado peruano

-- Crear tabla de precios para Perú
CREATE TABLE IF NOT EXISTS price_master_peru (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id UUID REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL DEFAULT 'm²',
  
  -- Componentes de costo en Soles Peruanos (PEN)
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Precio base (suma de componentes)
  base_price DECIMAL(10,2) DEFAULT 0,
  
  -- Margen de ganancia
  margin_percentage DECIMAL(5,2) DEFAULT 15.00,
  
  -- Precio final calculado directamente sin referenciar base_price
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (
    (labor_cost + material_cost + equipment_cost + other_cost) * (1 + margin_percentage / 100)
  ) STORED,
  
  -- Metadatos
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_peru_category ON price_master_peru(category_id);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_code ON price_master_peru(code);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_active ON price_master_peru(is_active);

-- Habilitar RLS
ALTER TABLE price_master_peru ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Anyone can view active prices peru" ON price_master_peru;
CREATE POLICY "Anyone can view active prices peru"
  ON price_master_peru
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Master users can insert prices peru" ON price_master_peru;
CREATE POLICY "Master users can insert prices peru"
  ON price_master_peru
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

DROP POLICY IF EXISTS "Master users can update prices peru" ON price_master_peru;
CREATE POLICY "Master users can update prices peru"
  ON price_master_peru
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

DROP POLICY IF EXISTS "Master users can delete prices peru" ON price_master_peru;
CREATE POLICY "Master users can delete prices peru"
  ON price_master_peru
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Insertar precios adaptados al mercado peruano
-- Precios en Soles Peruanos (PEN) con terminología local

-- DERRIBOS (Demoliciones)
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '01-D-01',
  id,
  'DRYWALL DERRIBO',
  'Demolición de tabique de drywall existente, incluyendo mano de obra y desmontaje a punto autorizado.',
  'm²',
  45.00,  -- Mano de obra en PEN
  19.00,  -- Materiales/disposición en PEN
  64.00   -- Total base en PEN
FROM price_categories WHERE code = '01-D';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '01-D-02',
  id,
  'PICADO DE MAYÓLICA EN PAREDES',
  'Picado de paredes para retirada de mayólica o revestimiento cerámico existente en parámetros verticales.',
  'm²',
  37.00,
  16.00,
  53.00
FROM price_categories WHERE code = '01-D';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '01-D-03',
  id,
  'PICADO DE CONTRAPISO',
  'Picado de contrapiso y posterior desescombro.',
  'm²',
  55.00,
  23.00,
  78.00
FROM price_categories WHERE code = '01-D';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '01-D-04',
  id,
  'RETIRO DE CIELO RASO',
  'Retirada y desescombro de cielo raso de drywall o similar.',
  'm²',
  37.00,
  16.00,
  53.00
FROM price_categories WHERE code = '01-D';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '01-D-05',
  id,
  'RETIRO DE MOLDURAS',
  'Retiro de molduras de drywall o madera en el perímetro de techos.',
  'ml',
  3.70,
  1.60,
  5.30
FROM price_categories WHERE code = '01-D';

-- ALBAÑILERÍA (Construcción)
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '02-A-01',
  id,
  'TABIQUE DE DRYWALL',
  'Construcción de tabique divisorio de drywall con estructura metálica.',
  'm²',
  35.00,
  50.00,
  85.00
FROM price_categories WHERE code = '02-A';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '02-A-02',
  id,
  'TARRAJEO DE PAREDES',
  'Tarrajeo de paredes con mezcla de cemento y arena fina.',
  'm²',
  28.00,
  19.00,
  47.00
FROM price_categories WHERE code = '02-A';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '02-A-03',
  id,
  'INSTALACIÓN DE MAYÓLICA',
  'Colocación de mayólica en paredes con pegamento y fragua.',
  'm²',
  32.00,
  53.00,
  85.00
FROM price_categories WHERE code = '02-A';

-- GASFITERÍA (Fontanería/Plomería)
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '03-F-01',
  id,
  'INSTALACIÓN DE LAVATORIO',
  'Instalación completa de lavatorio con grifería y desagüe.',
  'Ud',
  85.00,
  85.00,
  170.00
FROM price_categories WHERE code = '03-F';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '03-F-02',
  id,
  'INSTALACIÓN DE INODORO',
  'Instalación de inodoro con accesorios y conexiones.',
  'Ud',
  95.00,
  95.00,
  190.00
FROM price_categories WHERE code = '03-F';

-- ELECTRICIDAD
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '04-E-01',
  id,
  'PUNTO DE LUZ',
  'Instalación de punto de luz con cableado y caja.',
  'Ud',
  42.00,
  42.00,
  84.00
FROM price_categories WHERE code = '04-E';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '04-E-02',
  id,
  'PUNTO DE TOMACORRIENTE',
  'Instalación de tomacorriente con cableado y caja.',
  'Ud',
  42.00,
  42.00,
  84.00
FROM price_categories WHERE code = '04-E';

-- CARPINTERÍA
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '05-C-01',
  id,
  'PUERTA DE MADERA',
  'Suministro e instalación de puerta de madera con marco y chapa.',
  'Ud',
  170.00,
  255.00,
  425.00
FROM price_categories WHERE code = '05-C';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '05-C-02',
  id,
  'VENTANA DE ALUMINIO',
  'Suministro e instalación de ventana de aluminio con vidrio.',
  'm²',
  106.00,
  159.00,
  265.00
FROM price_categories WHERE code = '05-C';

-- PINTURA
INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '07-P-01',
  id,
  'PINTURA LÁTEX EN PAREDES',
  'Aplicación de pintura látex en paredes interiores (2 manos).',
  'm²',
  11.00,
  8.00,
  19.00
FROM price_categories WHERE code = '07-P';

INSERT INTO price_master_peru (code, category_id, description, long_description, unit, labor_cost, material_cost, base_price)
SELECT 
  '07-P-02',
  id,
  'PINTURA LÁTEX EN CIELO RASO',
  'Aplicación de pintura látex en cielo raso (2 manos).',
  'm²',
  13.00,
  9.00,
  22.00
FROM price_categories WHERE code = '07-P';

-- Mostrar resumen
SELECT 
  'Tabla price_master_peru creada exitosamente' as status,
  COUNT(*) as total_precios,
  'PEN (Soles Peruanos)' as moneda
FROM price_master_peru;

SELECT 
  pc.name as categoria,
  COUNT(pm.id) as cantidad_precios,
  ROUND(AVG(pm.final_price), 2) as precio_promedio_pen
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name
ORDER BY pc.name;
