-- Crear tabla de precios maestros para Perú
CREATE TABLE IF NOT EXISTS price_master_peru (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  category_id TEXT REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 20,
  -- Calculando final_price directamente sin referenciar base_price
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (
    (labor_cost + material_cost + equipment_cost + other_cost) * (1 + margin_percentage / 100)
  ) STORED,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE price_master_peru ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Ver precios maestros Perú" ON price_master_peru
  FOR SELECT USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Crear precios personalizados Perú" ON price_master_peru
  FOR INSERT WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precios Perú" ON price_master_peru
  FOR UPDATE USING (user_id = auth.uid() OR is_custom = false);

CREATE POLICY "Eliminar precios Perú" ON price_master_peru
  FOR DELETE USING (user_id = auth.uid());

-- Insertar precios adaptados a Perú (en Soles PEN)
-- DERRIBOS
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-01-D-01', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'DEMOLICIÓN DRYWALL', 'Demolición de tabique de drywall existente, incluyendo mano de obra y eliminación de escombros.', 'm²', 25.00, 10.00),
('PE-01-D-02', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para retirada de mayólica o revestimiento cerámico existente.', 'm²', 20.00, 8.00),
('PE-01-D-03', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'PICADO PISOS', 'Picado de piso cerámico y posterior eliminación de escombros.', 'm²', 30.00, 12.00),
('PE-01-D-04', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'RETIRO CIELO RASO', 'Retiro y eliminación de cielo raso de drywall o superboard.', 'm²', 20.00, 8.00),
('PE-01-D-05', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'RETIRO CONTRAZÓCALO', 'Retiro de contrazócalo de madera o cerámico.', 'ml', 3.00, 1.50),
('PE-01-D-06', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'RETIRO PISO LAMINADO', 'Desmontaje de piso laminado flotante incluyendo base niveladora.', 'm²', 12.00, 5.00),
('PE-01-D-07', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'DESMONTAJE PUERTA', 'Desmontaje de hoja de puerta y marco existente.', 'Ud', 40.00, 15.00),
('PE-01-D-08', (SELECT id FROM price_categories WHERE name = 'DERRIBO'), 'CONTENEDOR DESMONTE', 'Alquiler de contenedor para eliminación de desmonte a relleno sanitario.', 'Ud', 200.00, 800.00);

-- ALBAÑILERÍA
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-02-A-01', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'CONTRAPISO NIVELADO', 'Formación de contrapiso de concreto para nivelación (espesor hasta 7cm).', 'm²', 35.00, 25.00),
('PE-02-A-02', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'CAPA AUTONIVELANTE', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 30.00, 20.00),
('PE-02-A-03', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUE DRYWALL', 'Levantamiento de tabique de drywall con estructura metálica.', 'm²', 45.00, 30.00),
('PE-02-A-04', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUE LADRILLO PANDERETA', 'Levantamiento de tabique de ladrillo pandereta.', 'm²', 35.00, 25.00),
('PE-02-A-05', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'ENCHAPE MAYÓLICA PARED', 'Colocación de mayólica en paredes (mano de obra, no incluye material).', 'm²', 40.00, 25.00),
('PE-02-A-06', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'ENCHAPE CERÁMICO PISO', 'Colocación de cerámico o porcelanato en pisos (mano de obra).', 'm²', 45.00, 30.00),
('PE-02-A-07', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TARRAJEO PRIMARIO', 'Tarrajeo de paredes para obtener superficie lisa.', 'm²', 20.00, 12.00),
('PE-02-A-08', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TARRAJEO FINO', 'Tarrajeo fino de acabado en paredes y techos.', 'm²', 25.00, 15.00),
('PE-02-A-09', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'CIELO RASO DRYWALL', 'Instalación de cielo raso en drywall con estructura metálica.', 'm²', 35.00, 25.00);

-- GASFITERÍA (Fontanería en Perú)
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-03-F-01', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'RED AGUA BAÑO COMPLETO', 'Renovación completa de red de agua fría y caliente del baño.', 'Ud', 800.00, 800.00),
('PE-03-F-02', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'RED AGUA COCINA', 'Renovación completa de red de agua fría y caliente de cocina.', 'Ud', 550.00, 550.00),
('PE-03-F-03', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'MONTANTE DESAGÜE PVC 4"', 'Sustitución de tramo de montante de desagüe.', 'Ud', 250.00, 250.00),
('PE-03-F-04', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN INODORO', 'Montaje e instalación de inodoro.', 'Ud', 60.00, 60.00),
('PE-03-F-05', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN DUCHA', 'Instalación de ducha eléctrica o mezcladora.', 'Ud', 80.00, 80.00),
('PE-03-F-06', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN LAVATORIO', 'Instalación de lavatorio con mueble.', 'Ud', 100.00, 100.00),
('PE-03-F-07', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN LAVADERO COCINA', 'Instalación de lavadero de cocina.', 'Ud', 80.00, 80.00);

-- CARPINTERÍA
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-04-C-01', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'INSTALACIÓN PISO LAMINADO', 'Colocación de piso laminado flotante (mano de obra).', 'm²', 15.00, 22.00),
('PE-04-C-02', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'INSTALACIÓN PISO VINÍLICO', 'Colocación de piso vinílico tipo click (mano de obra).', 'm²', 18.00, 27.00),
('PE-04-C-03', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'CONTRAZÓCALO MDF', 'Suministro y colocación de contrazócalo de MDF.', 'ml', 5.00, 8.00),
('PE-04-C-04', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'PUERTA CONTRAPLACADA', 'Suministro e instalación de puerta contraplacada.', 'Ud', 100.00, 150.00),
('PE-04-C-05', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'PUERTA PRINCIPAL SEGURIDAD', 'Suministro e instalación de puerta de seguridad.', 'Ud', 450.00, 675.00),
('PE-04-C-06', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'CLOSET MELAMINA', 'Fabricación e instalación de closet en melamina.', 'ml', 180.00, 270.00);

-- ELECTRICIDAD
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-05-E-01', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'TABLERO ELÉCTRICO 18 POLOS', 'Instalación de tablero eléctrico con elementos de protección.', 'Ud', 650.00, 650.00),
('PE-05-E-02', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'LÍNEA TOMACORRIENTES', 'Tendido de línea de tomacorrientes.', 'Ud', 280.00, 280.00),
('PE-05-E-03', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'LÍNEA ALUMBRADO', 'Tendido de línea de alumbrado general.', 'Ud', 280.00, 280.00),
('PE-05-E-04', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTO LUZ SIMPLE', 'Instalación de punto de luz simple (interruptor + luminaria).', 'Ud', 42.00, 42.00),
('PE-05-E-05', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble.', 'Ud', 48.00, 48.00),
('PE-05-E-06', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'SPOT EMPOTRADO', 'Instalación de spot empotrado en cielo raso.', 'Ud', 36.00, 36.00);

-- CALEFACCIÓN (Adaptado a clima peruano - termas)
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-06-CAL-01', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'TERMA ELÉCTRICA 50L', 'Suministro e instalación de terma eléctrica.', 'Ud', 180.00, 270.00),
('PE-06-CAL-02', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'TERMA A GAS', 'Suministro e instalación de terma a gas.', 'Ud', 450.00, 675.00),
('PE-06-CAL-03', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'DUCHA ELÉCTRICA', 'Suministro e instalación de ducha eléctrica.', 'Ud', 80.00, 120.00);

-- LIMPIEZA
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-07-L-01', (SELECT id FROM price_categories WHERE name = 'LIMPIEZA'), 'LIMPIEZA PERIÓDICA OBRA', 'Limpieza diaria/semanal de obra.', 'Ud', 85.00, 85.00),
('PE-07-L-02', (SELECT id FROM price_categories WHERE name = 'LIMPIEZA'), 'LIMPIEZA FINAL OBRA', 'Limpieza exhaustiva de fin de obra.', 'Ud', 250.00, 250.00);

-- MATERIALES (Precios en Soles)
INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost) VALUES
('PE-08-M-01', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'MAYÓLICA PARED 20X30', 'Mayólica para pared (precio por m²).', 'm²', 8.00, 32.00),
('PE-08-M-02', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'CERÁMICO PISO 45X45', 'Cerámico para piso (precio por m²).', 'm²', 12.00, 48.00),
('PE-08-M-03', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PORCELANATO 60X60', 'Porcelanato para piso (precio por m²).', 'm²', 25.00, 100.00),
('PE-08-M-04', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PISO LAMINADO', 'Piso laminado flotante (precio por m²).', 'm²', 15.00, 60.00),
('PE-08-M-05', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'INODORO TANQUE BAJO', 'Inodoro de tanque bajo.', 'Ud', 100.00, 400.00),
('PE-08-M-06', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'LAVATORIO CON MUEBLE', 'Lavatorio con mueble.', 'Ud', 130.00, 520.00),
('PE-08-M-07', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'DUCHA ELÉCTRICA', 'Ducha eléctrica.', 'Ud', 40.00, 160.00),
('PE-08-M-08', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PUERTA CONTRAPLACADA', 'Puerta contraplacada con marco.', 'Ud', 120.00, 480.00);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_price_master_peru_category ON price_master_peru(category_id);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_code ON price_master_peru(code);
CREATE INDEX IF NOT EXISTS idx_price_master_peru_active ON price_master_peru(is_active);
