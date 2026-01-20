-- Crear tabla de precios específica para Perú
-- Adaptada con terminología y precios del mercado peruano

-- Eliminar tabla si existe
DROP TABLE IF EXISTS price_master_peru CASCADE;

-- Crear tabla de precios para Perú
CREATE TABLE price_master_peru (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  category_id UUID REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  margin_percentage DECIMAL(5,2) DEFAULT 15.00,
  final_price DECIMAL(10,2) NOT NULL,
  currency_code TEXT DEFAULT 'PEN',
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE price_master_peru ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: todos pueden ver precios activos
CREATE POLICY "Anyone can view active Peru prices"
  ON price_master_peru
  FOR SELECT
  USING (is_active = true);

-- Políticas RLS: solo usuarios master pueden modificar
CREATE POLICY "Master users can insert Peru prices"
  ON price_master_peru
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

CREATE POLICY "Master users can update Peru prices"
  ON price_master_peru
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

CREATE POLICY "Master users can delete Peru prices"
  ON price_master_peru
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Insertar precios adaptados para Perú
-- Categoría: DERRIBOS (01-D)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('01-D-01-PE', 'DEMOLICION TABIQUES', (SELECT id FROM price_categories WHERE code = '01-D'), 'Demolición de tabique de drywall existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 35.00, 15.00, 50.00, 57.50),
('01-D-02-PE', 'PICADO MAYOLICA PAREDES', (SELECT id FROM price_categories WHERE code = '01-D'), 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en paramentos verticales.', 'm²', 29.00, 12.50, 41.50, 47.73),
('01-D-03-PE', 'PICADO PISOS', (SELECT id FROM price_categories WHERE code = '01-D'), 'Picado de piso y posterior desescombro.', 'm²', 43.00, 18.50, 61.50, 70.73),
('01-D-04-PE', 'RETIRO CIELO RASO', (SELECT id FROM price_categories WHERE code = '01-D'), 'Retirada y desescombro de cielo raso falso de drywall o superboard.', 'm²', 29.00, 12.50, 41.50, 47.73),
('01-D-05-PE', 'RETIRO MOLDURAS', (SELECT id FROM price_categories WHERE code = '01-D'), 'Retiro de molduras de drywall o madera en el perímetro de techos.', 'ml', 2.90, 1.25, 4.15, 4.77),
('01-D-06-PE', 'DESMONTAJE PISO MADERA', (SELECT id FROM price_categories WHERE code = '01-D'), 'Desmontaje de piso flotante o entablado de madera incluyendo los rastreles inferiores.', 'm²', 17.50, 7.50, 25.00, 28.75),
('01-D-07-PE', 'RETIRO ZOCALO MADERA', (SELECT id FROM price_categories WHERE code = '01-D'), 'Retiro de zócalo de madera y acopio para desescombro.', 'ml', 5.20, 2.25, 7.45, 8.57);

-- Categoría: ALBAÑILERIA (02-A)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('02-A-01-PE', 'TABIQUE DRYWALL', (SELECT id FROM price_categories WHERE code = '02-A'), 'Construcción de tabique de drywall con estructura metálica y placa de 12.5mm en ambas caras.', 'm²', 43.50, 29.00, 72.50, 83.38),
('02-A-02-PE', 'TARRAJEO PAREDES', (SELECT id FROM price_categories WHERE code = '02-A'), 'Tarrajeo de paredes con mortero cemento-arena, acabado frotachado.', 'm²', 26.00, 17.50, 43.50, 50.03),
('02-A-03-PE', 'INSTALACION MAYOLICA', (SELECT id FROM price_categories WHERE code = '02-A'), 'Instalación de mayólica en paredes con pegamento y fragua.', 'm²', 34.80, 23.20, 58.00, 66.70),
('02-A-04-PE', 'CONTRAPISO', (SELECT id FROM price_categories WHERE code = '02-A'), 'Vaciado de contrapiso de concreto de 5cm de espesor.', 'm²', 26.00, 17.50, 43.50, 50.03),
('02-A-05-PE', 'INSTALACION CERAMICO PISO', (SELECT id FROM price_categories WHERE code = '02-A'), 'Instalación de cerámico en pisos con pegamento y fragua.', 'm²', 34.80, 23.20, 58.00, 66.70),
('02-A-06-PE', 'CIELO RASO DRYWALL', (SELECT id FROM price_categories WHERE code = '02-A'), 'Instalación de cielo raso de drywall con estructura metálica.', 'm²', 39.00, 26.00, 65.00, 74.75),
('02-A-07-PE', 'INSTALACION ZOCALO', (SELECT id FROM price_categories WHERE code = '02-A'), 'Instalación de zócalo de cerámico o porcelanato.', 'ml', 8.70, 5.80, 14.50, 16.68);

-- Categoría: FONTANERIA (03-F)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('03-F-01-PE', 'PUNTO AGUA FRIA', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de punto de agua fría con tubería PVC SAP de 1/2".', 'pto', 43.50, 43.50, 87.00, 100.05),
('03-F-02-PE', 'PUNTO AGUA CALIENTE', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de punto de agua caliente con tubería CPVC de 1/2".', 'pto', 50.75, 50.75, 101.50, 116.73),
('03-F-03-PE', 'PUNTO DESAGUE', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de punto de desagüe con tubería PVC SAL de 2".', 'pto', 50.75, 50.75, 101.50, 116.73),
('03-F-04-PE', 'INSTALACION INODORO', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de inodoro con accesorios y conexiones.', 'ud', 72.50, 72.50, 145.00, 166.75),
('03-F-05-PE', 'INSTALACION LAVATORIO', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de lavatorio con grifería y accesorios.', 'ud', 65.25, 65.25, 130.50, 150.08),
('03-F-06-PE', 'INSTALACION DUCHA', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de ducha con grifería mezcladora.', 'ud', 72.50, 72.50, 145.00, 166.75),
('03-F-07-PE', 'INSTALACION TERMA', (SELECT id FROM price_categories WHERE code = '03-F'), 'Instalación de terma eléctrica con conexiones.', 'ud', 87.00, 87.00, 174.00, 200.10);

-- Categoría: ELECTRICIDAD (04-E)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('04-E-01-PE', 'PUNTO LUZ SIMPLE', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de punto de luz simple con cable TW 2.5mm y caja octogonal.', 'pto', 36.25, 36.25, 72.50, 83.38),
('04-E-02-PE', 'PUNTO TOMACORRIENTE', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de punto de tomacorriente doble con línea a tierra.', 'pto', 43.50, 43.50, 87.00, 100.05),
('04-E-03-PE', 'PUNTO TOMACORRIENTE ESPECIAL', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de tomacorriente especial para cocina o lavadora.', 'pto', 58.00, 58.00, 116.00, 133.40),
('04-E-04-PE', 'INSTALACION INTERRUPTOR', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de interruptor simple o doble.', 'ud', 21.75, 21.75, 43.50, 50.03),
('04-E-05-PE', 'INSTALACION LUMINARIA', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de luminaria LED empotrada o adosada.', 'ud', 29.00, 29.00, 58.00, 66.70),
('04-E-06-PE', 'INSTALACION RADIADOR', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación y conexión a la línea eléctrica de radiador.', 'ud', 50.75, 50.75, 101.50, 116.73),
('04-E-07-PE', 'TABLERO ELECTRICO', (SELECT id FROM price_categories WHERE code = '04-E'), 'Instalación de tablero eléctrico con interruptores termomagnéticos.', 'ud', 145.00, 145.00, 290.00, 333.50);

-- Categoría: CARPINTERIA (05-C)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('05-C-01-PE', 'PUERTA CONTRAPLACADA', (SELECT id FROM price_categories WHERE code = '05-C'), 'Suministro e instalación de puerta contraplacada con marco y chapa.', 'ud', 87.00, 130.50, 217.50, 250.13),
('05-C-02-PE', 'PUERTA MDF', (SELECT id FROM price_categories WHERE code = '05-C'), 'Suministro e instalación de puerta de MDF con marco y chapa.', 'ud', 72.50, 108.75, 181.25, 208.44),
('05-C-03-PE', 'CLOSET MELAMINA', (SELECT id FROM price_categories WHERE code = '05-C'), 'Fabricación e instalación de closet en melamina con puertas corredizas.', 'ml', 217.50, 326.25, 543.75, 625.31),
('05-C-04-PE', 'MUEBLE COCINA BAJO', (SELECT id FROM price_categories WHERE code = '05-C'), 'Fabricación e instalación de mueble bajo de cocina en melamina.', 'ml', 145.00, 217.50, 362.50, 416.88),
('05-C-05-PE', 'MUEBLE COCINA ALTO', (SELECT id FROM price_categories WHERE code = '05-C'), 'Fabricación e instalación de mueble alto de cocina en melamina.', 'ml', 116.00, 174.00, 290.00, 333.50),
('05-C-06-PE', 'INSTALACION PISO LAMINADO', (SELECT id FROM price_categories WHERE code = '05-C'), 'Instalación de piso laminado flotante con espuma niveladora.', 'm²', 21.75, 32.63, 54.38, 62.54),
('05-C-07-PE', 'INSTALACION ZOCALO MADERA', (SELECT id FROM price_categories WHERE code = '05-C'), 'Instalación de zócalo de madera o MDF.', 'ml', 5.80, 8.70, 14.50, 16.68);

-- Categoría: CALEFACCION (06-H)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('06-H-01-PE', 'INSTALACION AIRE ACONDICIONADO', (SELECT id FROM price_categories WHERE code = '06-H'), 'Instalación de equipo de aire acondicionado split con tubería y conexiones.', 'ud', 217.50, 217.50, 435.00, 500.25),
('06-H-02-PE', 'INSTALACION EXTRACTOR', (SELECT id FROM price_categories WHERE code = '06-H'), 'Instalación de extractor de aire en baño o cocina.', 'ud', 43.50, 43.50, 87.00, 100.05);

-- Categoría: LIMPIEZA (07-L)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('07-L-01-PE', 'LIMPIEZA FINAL OBRA', (SELECT id FROM price_categories WHERE code = '07-L'), 'Limpieza final de obra incluyendo retiro de escombros y limpieza profunda.', 'm²', 5.80, 2.90, 8.70, 10.01),
('07-L-02-PE', 'LIMPIEZA VIDRIOS', (SELECT id FROM price_categories WHERE code = '07-L'), 'Limpieza de ventanas y mamparas de vidrio.', 'm²', 4.35, 2.18, 6.53, 7.51);

-- Categoría: MATERIALES (08-M)
INSERT INTO price_master_peru (id, code, category_id, description, unit, labor_cost, material_cost, base_price, final_price) VALUES
('08-M-01-PE', 'CEMENTO PORTLAND', (SELECT id FROM price_categories WHERE code = '08-M'), 'Cemento Portland Tipo I bolsa de 42.5kg.', 'bls', 5.80, 23.20, 29.00, 33.35),
('08-M-02-PE', 'ARENA FINA', (SELECT id FROM price_categories WHERE code = '08-M'), 'Arena fina para tarrajeo y acabados.', 'm³', 14.50, 58.00, 72.50, 83.38),
('08-M-03-PE', 'ARENA GRUESA', (SELECT id FROM price_categories WHERE code = '08-M'), 'Arena gruesa para concreto y contrapisos.', 'm³', 14.50, 58.00, 72.50, 83.38),
('08-M-04-PE', 'PIEDRA CHANCADA', (SELECT id FROM price_categories WHERE code = '08-M'), 'Piedra chancada de 1/2" para concreto.', 'm³', 17.40, 69.60, 87.00, 100.05),
('08-M-05-PE', 'LADRILLO KING KONG', (SELECT id FROM price_categories WHERE code = '08-M'), 'Ladrillo King Kong de arcilla 18 huecos.', 'und', 0.58, 2.32, 2.90, 3.34),
('08-M-06-PE', 'PLACA DRYWALL', (SELECT id FROM price_categories WHERE code = '08-M'), 'Placa de drywall estándar de 1.22x2.44m x 12.5mm.', 'pza', 8.70, 34.80, 43.50, 50.03),
('08-M-07-PE', 'MAYOLICA 30X30', (SELECT id FROM price_categories WHERE code = '08-M'), 'Mayólica de 30x30cm para paredes.', 'm²', 5.80, 23.20, 29.00, 33.35),
('08-M-08-PE', 'CERAMICO 45X45', (SELECT id FROM price_categories WHERE code = '08-M'), 'Cerámico de 45x45cm para pisos.', 'm²', 8.70, 34.80, 43.50, 50.03),
('08-M-09-PE', 'PORCELANATO 60X60', (SELECT id FROM price_categories WHERE code = '08-M'), 'Porcelanato de 60x60cm para pisos.', 'm²', 17.40, 69.60, 87.00, 100.05),
('08-M-10-PE', 'PINTURA LATEX', (SELECT id FROM price_categories WHERE code = '08-M'), 'Pintura látex para interiores, galón.', 'gln', 8.70, 34.80, 43.50, 50.03);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_price_master_peru_category ON price_master_peru(category_id);
CREATE INDEX idx_price_master_peru_code ON price_master_peru(code);
CREATE INDEX idx_price_master_peru_active ON price_master_peru(is_active);

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Tabla price_master_peru creada exitosamente con % precios', (SELECT COUNT(*) FROM price_master_peru);
END $$;
