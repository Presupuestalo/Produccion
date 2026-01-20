-- Script para crear tabla de precios maestros para Perú
-- Adaptado con terminología y precios del mercado peruano

-- Crear tabla de precios para Perú
CREATE TABLE IF NOT EXISTS price_master_peru (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + material_cost + equipment_cost + other_cost) STORED,
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 + margin_percentage / 100)) STORED,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_price_master_peru_category ON price_master_peru(category_id);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_active ON price_master_peru(is_active);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_code ON price_master_peru(code);

-- Habilitar RLS
ALTER TABLE price_master_peru ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Todos pueden ver precios activos Peru" ON price_master_peru;
DROP POLICY IF EXISTS "Master puede insertar precios Peru" ON price_master_peru;
DROP POLICY IF EXISTS "Master puede actualizar precios Peru" ON price_master_peru;
DROP POLICY IF EXISTS "Master puede eliminar precios Peru" ON price_master_peru;

CREATE POLICY "Todos pueden ver precios activos Peru"
  ON price_master_peru FOR SELECT
  USING (is_active = true);

CREATE POLICY "Master puede insertar precios Peru"
  ON price_master_peru FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

CREATE POLICY "Master puede actualizar precios Peru"
  ON price_master_peru FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

CREATE POLICY "Master puede eliminar precios Peru"
  ON price_master_peru FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Insertar precios adaptados al mercado peruano
-- Nota: Los precios están en Soles Peruanos (PEN)
-- Terminología adaptada: "drywall" en lugar de "tabique", "tarrajeo" en lugar de "enlucido", etc.

-- CATEGORÍA: DERRIBOS (Demoliciones)
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-D-01', '01-D-01', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'DEMOLICIÓN DE DRYWALL', 'Demolición de muro de drywall existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 42.00, 18.00),
('PE-D-02', '01-D-02', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'PICADO DE MAYÓLICA EN PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 33.60, 14.40),
('PE-D-03', '01-D-03', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'PICADO DE PISOS', 'Picado de piso y posterior desescombro.', 'm²', 56.00, 24.00),
('PE-D-04', '01-D-04', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'DEMOLICIÓN DE FALSO CIELO RASO', 'Retirada y desescombro de falso cielo raso de drywall o similar.', 'm²', 33.60, 14.40),
('PE-D-05', '01-D-05', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'DEMOLICIÓN DE MOLDURAS', 'Retirada de molduras de drywall o madera en el perímetro de techos.', 'ml', 2.80, 1.20),
('PE-D-06', '01-D-06', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'DEMOLICIÓN DE CONTRAPISO Y RASTRELES', 'Desmontaje de contrapiso flotante o piso de madera incluyendo los rastreles inferiores.', 'm²', 16.80, 7.20),
('PE-D-07', '01-D-07', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'DEMOLICIÓN DE ZÓCALO DE MADERA', 'Retirada de zócalo de madera y acopio para desescombro.', 'ml', 5.00, 2.20);

-- CATEGORÍA: ALBAÑILERÍA
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-A-01', '02-A-01', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'LEVANTAMIENTO DE MURO DE DRYWALL', 'Construcción de muro divisorio con sistema drywall estándar.', 'm²', 74.00, 52.00),
('PE-A-02', '02-A-02', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'LEVANTAMIENTO DE MURO DE LADRILLO', 'Construcción de muro de ladrillo King Kong de 18 huecos con mortero.', 'm²', 62.00, 43.00),
('PE-A-03', '02-A-03', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'INSTALACIÓN DE MAYÓLICA EN PAREDES', 'Colocación de mayólica o cerámica en paredes de baños y cocinas.', 'm²', 98.00, 69.00),
('PE-A-04', '02-A-04', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'INSTALACIÓN DE PORCELANATO EN PISOS', 'Colocación de porcelanato en pisos con pegamento y fragua.', 'm²', 60.00, 42.00),
('PE-A-05', '02-A-05', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'TARRAJEO DE PAREDES', 'Tarrajeo fino de paredes con mezcla de cemento y arena.', 'm²', 28.00, 20.00),
('PE-A-06', '02-A-06', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'TARRAJEO DE CIELO RASO', 'Tarrajeo de techo con mezcla especial.', 'm²', 74.00, 52.00),
('PE-A-07', '02-A-07', (SELECT id FROM price_categories WHERE name = 'Albañilería'), 'CONTRAPISO DE CONCRETO', 'Vaciado de contrapiso de concreto nivelado.', 'm²', 83.00, 58.00);

-- CATEGORÍA: FONTANERÍA (Gasfitería en Perú)
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-F-01', '03-F-01', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'INSTALACIÓN COMPLETA DE BAÑO', 'Instalación completa de gasfitería para baño incluyendo agua fría y caliente.', 'Ud', 1580.00, 1106.00),
('PE-F-02', '03-F-02', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'INSTALACIÓN DE COCINA', 'Red de gasfitería para cocina con agua fría y caliente.', 'Ud', 1100.00, 770.00),
('PE-F-03', '03-F-03', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'INSTALACIÓN DE LAVADERO', 'Punto de agua para lavadero o área de servicio.', 'Ud', 515.00, 360.00),
('PE-F-04', '03-F-04', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'PUNTO DE AGUA FRÍA', 'Instalación de punto de agua fría con tubería PVC.', 'Ud', 273.00, 191.00),
('PE-F-05', '03-F-05', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'PUNTO DE AGUA CALIENTE', 'Instalación de punto de agua caliente con tubería CPVC.', 'Ud', 431.00, 302.00),
('PE-F-06', '03-F-06', (SELECT id FROM price_categories WHERE name = 'Fontanería'), 'PUNTO DE DESAGÜE', 'Instalación de punto de desagüe con tubería PVC.', 'Ud', 120.00, 84.00);

-- CATEGORÍA: ELECTRICIDAD
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-E-01', '05-E-01', (SELECT id FROM price_categories WHERE name = 'Electricidad'), 'TABLERO ELÉCTRICO 18 POLOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 660.00, 660.00),
('PE-E-02', '05-E-02', (SELECT id FROM price_categories WHERE name = 'Electricidad'), 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y datos.', 'Ud', 210.00, 210.00),
('PE-E-03', '05-E-03', (SELECT id FROM price_categories WHERE name = 'Electricidad'), 'PUNTO DE LUZ SIMPLE', 'Mecanismo e instalación de un punto de luz simple (interruptor + luminaria).', 'Ud', 42.00, 42.00),
('PE-E-04', '05-E-04', (SELECT id FROM price_categories WHERE name = 'Electricidad'), 'PUNTO DE TOMACORRIENTE', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 48.00, 48.00),
('PE-E-05', '05-E-05', (SELECT id FROM price_categories WHERE name = 'Electricidad'), 'LÍNEA DE TOMACORRIENTES', 'Tendido de línea de tomacorrientes con cable 2.5mm².', 'Ud', 282.00, 282.00);

-- CATEGORÍA: CARPINTERÍA
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-C-01', '04-C-01', (SELECT id FROM price_categories WHERE name = 'Carpintería'), 'INSTALACIÓN DE PISO LAMINADO', 'Colocación de piso laminado flotante con espuma niveladora.', 'm²', 84.00, 59.00),
('PE-C-02', '04-C-02', (SELECT id FROM price_categories WHERE name = 'Carpintería'), 'INSTALACIÓN DE ZÓCALO', 'Colocación de zócalo de madera o MDF.', 'ml', 35.00, 24.00),
('PE-C-03', '04-C-03', (SELECT id FROM price_categories WHERE name = 'Carpintería'), 'PUERTA CONTRAPLACADA', 'Suministro e instalación de puerta contraplacada con marco.', 'Ud', 455.00, 318.00),
('PE-C-04', '04-C-04', (SELECT id FROM price_categories WHERE name = 'Carpintería'), 'PUERTA DE SEGURIDAD', 'Instalación de puerta de seguridad reforzada.', 'Ud', 433.00, 867.00);

-- CATEGORÍA: MATERIALES
INSERT INTO price_master_peru (id, code, category_id, description, long_description, unit, labor_cost, material_cost) VALUES
('PE-M-01', '08-M-01', (SELECT id FROM price_categories WHERE name = 'Materiales'), 'INODORO', 'Costo de inodoro de porcelana estándar.', 'Ud', 123.00, 493.00),
('PE-M-02', '08-M-02', (SELECT id FROM price_categories WHERE name = 'Materiales'), 'LAVATORIO', 'Costo de lavatorio de porcelana con pedestal.', 'Ud', 84.00, 336.00),
('PE-M-03', '08-M-03', (SELECT id FROM price_categories WHERE name = 'Materiales'), 'DUCHA ELÉCTRICA', 'Costo de ducha eléctrica instantánea.', 'Ud', 70.00, 280.00),
('PE-M-04', '08-M-04', (SELECT id FROM price_categories WHERE name = 'Materiales'), 'MAYÓLICA', 'Costo por metro cuadrado de mayólica estándar.', 'm²', 32.00, 128.00),
('PE-M-05', '08-M-05', (SELECT id FROM price_categories WHERE name = 'Materiales'), 'PORCELANATO', 'Costo por metro cuadrado de porcelanato.', 'm²', 56.00, 224.00);

-- Mostrar resumen
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM price_master_peru;
  RAISE NOTICE 'Tabla price_master_peru creada exitosamente';
  RAISE NOTICE 'Total de precios insertados: %', total_count;
  RAISE NOTICE 'Precios en Soles Peruanos (PEN)';
  RAISE NOTICE 'Terminología adaptada al mercado peruano';
END $$;
