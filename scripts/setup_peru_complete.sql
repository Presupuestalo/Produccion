-- Script completo para configurar precios de Perú
-- 1. Verifica/crea la tabla price_master_peru
-- 2. Puebla con precios adaptados a Perú (sin marcas, modelos ni colores)

-- Primero, eliminar la tabla si existe para empezar limpio
DROP TABLE IF EXISTS price_master_peru CASCADE;

-- Crear tabla price_master_peru con la misma estructura que price_master
CREATE TABLE price_master_peru (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id TEXT REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 30,
  final_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Obtener los IDs de las categorías existentes
DO $$
DECLARE
  cat_derribo TEXT;
  cat_albanileria TEXT;
  cat_fontaneria TEXT;
  cat_carpinteria TEXT;
  cat_electricidad TEXT;
  cat_calefaccion TEXT;
  cat_limpieza TEXT;
  cat_materiales TEXT;
BEGIN
  -- Obtener IDs de categorías
  SELECT id INTO cat_derribo FROM price_categories WHERE name = 'DERRIBO' LIMIT 1;
  SELECT id INTO cat_albanileria FROM price_categories WHERE name = 'ALBAÑILERIA' LIMIT 1;
  SELECT id INTO cat_fontaneria FROM price_categories WHERE name = 'FONTANERIA' LIMIT 1;
  SELECT id INTO cat_carpinteria FROM price_categories WHERE name = 'CARPINTERIA' LIMIT 1;
  SELECT id INTO cat_electricidad FROM price_categories WHERE name = 'ELECTRICIDAD' LIMIT 1;
  SELECT id INTO cat_calefaccion FROM price_categories WHERE name = 'CALEFACCION' LIMIT 1;
  SELECT id INTO cat_limpieza FROM price_categories WHERE name = 'LIMPIEZA' LIMIT 1;
  SELECT id INTO cat_materiales FROM price_categories WHERE name = 'MATERIALES' LIMIT 1;

  -- Insertar precios adaptados a Perú (terminología peruana, precios en PEN)
  
  -- DERRIBO (Demolición)
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('DER001', cat_derribo, 'Tabiques', 'Demolición de muro de drywall incluyendo mano de obra y desescombro', 'm²', 8.50, 3.20, 14.86),
  ('DER002', cat_derribo, 'Pisos', 'Picado de piso de mayólica o cerámico existente', 'm²', 7.20, 2.80, 12.38),
  ('DER003', cat_derribo, 'Pisos', 'Picado de contrapiso de concreto', 'm²', 11.50, 4.30, 18.21),
  ('DER004', cat_derribo, 'Techos', 'Retiro de cielo raso de drywall', 'm²', 7.20, 2.80, 12.38),
  ('DER005', cat_derribo, 'Carpintería', 'Desmontaje de puerta de madera con marco', 'ud', 25.00, 5.00, 35.00);

  -- ALBAÑILERIA (Construcción)
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('ALB001', cat_albanileria, 'Muros', 'Construcción de muro de drywall con estructura metálica', 'm²', 18.50, 28.30, 58.00),
  ('ALB002', cat_albanileria, 'Muros', 'Muro de ladrillo King Kong con mortero', 'm²', 22.00, 35.50, 71.00),
  ('ALB003', cat_albanileria, 'Pisos', 'Contrapiso de concreto e=10cm', 'm²', 12.50, 18.20, 38.00),
  ('ALB004', cat_albanileria, 'Pisos', 'Instalación de mayólica en piso', 'm²', 15.00, 32.00, 58.00),
  ('ALB005', cat_albanileria, 'Revestimientos', 'Tarrajeo de muros interiores', 'm²', 8.50, 6.30, 18.50),
  ('ALB006', cat_albanileria, 'Revestimientos', 'Instalación de mayólica en pared', 'm²', 16.00, 34.00, 62.00),
  ('ALB007', cat_albanileria, 'Techos', 'Cielo raso de drywall con estructura', 'm²', 16.50, 25.30, 52.00);

  -- FONTANERIA (Gasfitería)
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('FON001', cat_fontaneria, 'Agua', 'Instalación de tubería PVC SAP 1/2"', 'm', 4.50, 3.80, 10.50),
  ('FON002', cat_fontaneria, 'Agua', 'Instalación de tubería PVC SAP 3/4"', 'm', 5.20, 4.50, 12.00),
  ('FON003', cat_fontaneria, 'Desagüe', 'Instalación de tubería PVC SAL 2"', 'm', 5.80, 5.20, 13.50),
  ('FON004', cat_fontaneria, 'Desagüe', 'Instalación de tubería PVC SAL 4"', 'm', 7.50, 8.30, 19.50),
  ('FON005', cat_fontaneria, 'Aparatos', 'Instalación de inodoro con accesorios', 'ud', 45.00, 15.00, 75.00),
  ('FON006', cat_fontaneria, 'Aparatos', 'Instalación de lavatorio con grifería', 'ud', 38.00, 12.00, 62.00);

  -- CARPINTERIA
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('CAR001', cat_carpinteria, 'Puertas', 'Puerta contraplacada de MDF con marco', 'ud', 85.00, 180.00, 330.00),
  ('CAR002', cat_carpinteria, 'Ventanas', 'Ventana de aluminio con vidrio', 'm²', 65.00, 120.00, 230.00),
  ('CAR003', cat_carpinteria, 'Muebles', 'Mueble de cocina en melamina', 'm', 95.00, 145.00, 300.00),
  ('CAR004', cat_carpinteria, 'Closets', 'Closet de melamina con puertas', 'm²', 110.00, 165.00, 345.00);

  -- ELECTRICIDAD
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('ELE001', cat_electricidad, 'Instalaciones', 'Salida de luz con cable y tubería', 'pto', 18.50, 12.30, 38.00),
  ('ELE002', cat_electricidad, 'Instalaciones', 'Salida de tomacorriente doble', 'pto', 22.00, 15.50, 46.50),
  ('ELE003', cat_electricidad, 'Tableros', 'Tablero eléctrico de 12 polos', 'ud', 85.00, 165.00, 310.00),
  ('ELE004', cat_electricidad, 'Artefactos', 'Instalación de luminaria LED', 'ud', 15.00, 8.00, 28.50);

  -- CALEFACCION
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('CAL001', cat_calefaccion, 'Agua Caliente', 'Instalación de terma eléctrica', 'ud', 95.00, 45.00, 175.00),
  ('CAL002', cat_calefaccion, 'Agua Caliente', 'Instalación de terma a gas', 'ud', 125.00, 55.00, 225.00);

  -- LIMPIEZA
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('LIM001', cat_limpieza, 'Final de Obra', 'Limpieza final de obra', 'm²', 2.80, 1.20, 5.00),
  ('LIM002', cat_limpieza, 'Escombros', 'Eliminación de desmonte', 'm³', 35.00, 25.00, 75.00);

  -- MATERIALES
  INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, final_price) VALUES
  ('MAT001', cat_materiales, 'Cemento', 'Cemento Portland Tipo I', 'bls', 0.00, 28.50, 28.50),
  ('MAT002', cat_materiales, 'Agregados', 'Arena gruesa', 'm³', 0.00, 45.00, 45.00),
  ('MAT003', cat_materiales, 'Agregados', 'Piedra chancada 1/2"', 'm³', 0.00, 52.00, 52.00),
  ('MAT004', cat_materiales, 'Ladrillos', 'Ladrillo King Kong 18 huecos', 'mll', 0.00, 850.00, 850.00);

END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_price_master_peru_category ON price_master_peru(category_id);
CREATE INDEX idx_price_master_peru_code ON price_master_peru(code);
CREATE INDEX idx_price_master_peru_active ON price_master_peru(is_active);

-- Mensaje de confirmación
DO $$
DECLARE
  total_prices INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_prices FROM price_master_peru;
  RAISE NOTICE 'Tabla price_master_peru creada y poblada con % precios', total_prices;
END $$;
