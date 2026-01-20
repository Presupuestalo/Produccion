DROP TABLE IF EXISTS price_master_usa;

CREATE TABLE price_master_usa (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  material_cost NUMERIC(10,2) DEFAULT 0,
  equipment_cost NUMERIC(10,2) DEFAULT 0,
  other_cost NUMERIC(10,2) DEFAULT 0,
  base_price NUMERIC(10,2) NOT NULL,
  margin_percentage NUMERIC(5,2) DEFAULT 15.00,
  final_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  color TEXT,
  brand TEXT,
  model TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_price_master_usa_category ON price_master_usa(category_id);
CREATE INDEX idx_price_master_usa_user ON price_master_usa(user_id);
CREATE INDEX idx_price_master_usa_active ON price_master_usa(is_active);

-- DERRIBOS (Demolition)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN TABIQUES DRYWALL', 'Demoler tabique de drywall existente, incluyendo mano de obra y disposición de escombros', 'sq ft', 1.50, 0.30, 1.80, 15.00, 2.07, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN PISO CERÁMICO', 'Demoler piso de cerámica o baldosa existente con martillo neumático', 'sq ft', 2.20, 0.40, 2.60, 15.00, 2.99, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN PISO MADERA', 'Demoler piso de madera o laminado existente', 'sq ft', 1.80, 0.25, 2.05, 15.00, 2.36, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN ALFOMBRA', 'Remover alfombra y base existente', 'sq ft', 0.80, 0.10, 0.90, 15.00, 1.04, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN AZULEJO PARED', 'Demoler azulejo de pared en baños o cocinas', 'sq ft', 2.50, 0.35, 2.85, 15.00, 3.28, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN GABINETES COCINA', 'Remover gabinetes de cocina superiores e inferiores', 'linear ft', 8.50, 1.50, 10.00, 15.00, 11.50, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN COUNTERTOP', 'Remover encimera de cocina o baño', 'sq ft', 3.20, 0.50, 3.70, 15.00, 4.26, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN PUERTA INTERIOR', 'Remover puerta interior con marco', 'unit', 45.00, 5.00, 50.00, 15.00, 57.50, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN VENTANA', 'Remover ventana con marco', 'unit', 65.00, 8.00, 73.00, 15.00, 83.95, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN CIELO RASO', 'Demoler cielo raso suspendido o drywall', 'sq ft', 1.20, 0.20, 1.40, 15.00, 1.61, false, true);

-- ALBAÑILERÍA (Masonry)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN DRYWALL PARED', 'Instalación de drywall 1/2" en paredes, incluyendo cinta y compuesto', 'sq ft', 1.80, 0.60, 2.40, 15.00, 2.76, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN DRYWALL TECHO', 'Instalación de drywall 5/8" en techos, incluyendo cinta y compuesto', 'sq ft', 2.20, 0.70, 2.90, 15.00, 3.34, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TEXTURA PARED', 'Aplicación de textura en paredes (orange peel o knockdown)', 'sq ft', 0.80, 0.25, 1.05, 15.00, 1.21, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA INTERIOR PARED', 'Pintura interior de paredes, 2 capas, incluyendo imprimación', 'sq ft', 1.20, 0.40, 1.60, 15.00, 1.84, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA EXTERIOR', 'Pintura exterior de paredes, 2 capas, pintura resistente al clima', 'sq ft', 1.80, 0.60, 2.40, 15.00, 2.76, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN MOLDURA BASE', 'Instalación de moldura base (baseboard) de madera o MDF', 'linear ft', 3.50, 1.20, 4.70, 15.00, 5.41, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN CROWN MOLDING', 'Instalación de moldura decorativa superior (crown molding)', 'linear ft', 5.50, 2.00, 7.50, 15.00, 8.63, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN PISO CERÁMICO', 'Instalación de piso de cerámica o porcelanato, incluyendo mortero y lechada', 'sq ft', 5.50, 3.50, 9.00, 15.00, 10.35, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN PISO LAMINADO', 'Instalación de piso laminado flotante con underlayment', 'sq ft', 3.20, 2.00, 5.20, 15.00, 5.98, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN PISO VINILO', 'Instalación de piso de vinilo de lujo (LVP)', 'sq ft', 3.50, 2.50, 6.00, 15.00, 6.90, false, true);

-- PLOMERÍA (Plumbing)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO', 'Instalación de inodoro estándar con tanque, incluyendo conexiones', 'unit', 180.00, 250.00, 430.00, 15.00, 494.50, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVABO BAÑO', 'Instalación de lavabo de baño con grifería', 'unit', 150.00, 200.00, 350.00, 15.00, 402.50, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN FREGADERO COCINA', 'Instalación de fregadero de cocina de acero inoxidable con grifería', 'unit', 180.00, 280.00, 460.00, 15.00, 529.00, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DUCHA', 'Instalación de conjunto de ducha con válvula mezcladora', 'unit', 280.00, 350.00, 630.00, 15.00, 724.50, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN BAÑERA', 'Instalación de bañera estándar de fibra de vidrio', 'unit', 450.00, 550.00, 1000.00, 15.00, 1150.00, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN CALENTADOR AGUA', 'Instalación de calentador de agua de 40-50 galones', 'unit', 350.00, 650.00, 1000.00, 15.00, 1150.00, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVAVAJILLAS', 'Instalación de lavavajillas empotrado con conexiones', 'unit', 180.00, 80.00, 260.00, 15.00, 299.00, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DISPOSER', 'Instalación de triturador de basura (garbage disposal)', 'unit', 120.00, 150.00, 270.00, 15.00, 310.50, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'REPARACIÓN FUGA TUBERÍA', 'Reparación de fuga en tubería de agua', 'unit', 150.00, 50.00, 200.00, 15.00, 230.00, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN TUBERÍA PEX', 'Instalación de tubería PEX para agua', 'linear ft', 4.50, 2.00, 6.50, 15.00, 7.48, false, true);

-- CARPINTERÍA (Carpentry)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PUERTA INTERIOR', 'Instalación de puerta interior pre-colgada con marco', 'unit', 180.00, 250.00, 430.00, 15.00, 494.50, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PUERTA EXTERIOR', 'Instalación de puerta exterior de acero con marco', 'unit', 350.00, 550.00, 900.00, 15.00, 1035.00, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN VENTANA VINILO', 'Instalación de ventana de vinilo de doble panel', 'unit', 250.00, 350.00, 600.00, 15.00, 690.00, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN GABINETES COCINA', 'Instalación de gabinetes de cocina superiores e inferiores', 'linear ft', 85.00, 180.00, 265.00, 15.00, 304.75, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN COUNTERTOP GRANITO', 'Instalación de encimera de granito con backsplash', 'sq ft', 45.00, 65.00, 110.00, 15.00, 126.50, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN COUNTERTOP CUARZO', 'Instalación de encimera de cuarzo con backsplash', 'sq ft', 45.00, 75.00, 120.00, 15.00, 138.00, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN DECK MADERA', 'Instalación de deck exterior de madera tratada', 'sq ft', 12.00, 8.00, 20.00, 15.00, 23.00, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN CLOSET ORGANIZER', 'Instalación de sistema organizador de closet', 'linear ft', 35.00, 45.00, 80.00, 15.00, 92.00, false, true),
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REPARACIÓN ESTRUCTURA MADERA', 'Reparación de estructura de madera dañada', 'hour', 75.00, 25.00, 100.00, 15.00, 115.00, false, true),
('04-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN TRIM VENTANAS', 'Instalación de moldura decorativa alrededor de ventanas', 'unit', 85.00, 35.00, 120.00, 15.00, 138.00, false, true);

-- ELECTRICIDAD (Electrical)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN TOMACORRIENTE', 'Instalación de tomacorriente doble estándar 110V', 'unit', 65.00, 15.00, 80.00, 15.00, 92.00, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN TOMACORRIENTE GFCI', 'Instalación de tomacorriente GFCI para baños y cocinas', 'unit', 85.00, 35.00, 120.00, 15.00, 138.00, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN INTERRUPTOR LUZ', 'Instalación de interruptor de luz simple', 'unit', 55.00, 12.00, 67.00, 15.00, 77.05, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN INTERRUPTOR 3-WAY', 'Instalación de interruptor de 3 vías', 'unit', 95.00, 25.00, 120.00, 15.00, 138.00, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN LÁMPARA TECHO', 'Instalación de lámpara de techo con caja eléctrica', 'unit', 120.00, 30.00, 150.00, 15.00, 172.50, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN VENTILADOR TECHO', 'Instalación de ventilador de techo con luz', 'unit', 180.00, 45.00, 225.00, 15.00, 258.75, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN PANEL ELÉCTRICO', 'Instalación de panel eléctrico de 200 amp', 'unit', 850.00, 650.00, 1500.00, 15.00, 1725.00, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN CIRCUITO 220V', 'Instalación de circuito dedicado 220V para secadora o estufa', 'unit', 280.00, 120.00, 400.00, 15.00, 460.00, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN DETECTOR HUMO', 'Instalación de detector de humo cableado', 'unit', 75.00, 35.00, 110.00, 15.00, 126.50, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN LUCES RECESSED', 'Instalación de luces empotradas (recessed lights) LED', 'unit', 95.00, 45.00, 140.00, 15.00, 161.00, false, true);

-- CALEFACCIÓN/HVAC (Heating/Cooling)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN AC CENTRAL', 'Instalación de sistema de aire acondicionado central 3 toneladas', 'unit', 1800.00, 3200.00, 5000.00, 15.00, 5750.00, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN FURNACE GAS', 'Instalación de calefacción de gas (furnace) 80,000 BTU', 'unit', 1500.00, 2500.00, 4000.00, 15.00, 4600.00, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN MINI-SPLIT', 'Instalación de sistema mini-split sin ductos', 'unit', 850.00, 1650.00, 2500.00, 15.00, 2875.00, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMOSTATO', 'Instalación de termostato programable digital', 'unit', 120.00, 80.00, 200.00, 15.00, 230.00, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DUCTOS', 'Instalación de ductos de HVAC', 'linear ft', 18.00, 12.00, 30.00, 15.00, 34.50, false, true);

-- LIMPIEZA (Cleaning)
INSERT INTO price_master_usa (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA POST-CONSTRUCCIÓN', 'Limpieza profunda después de construcción o remodelación', 'sq ft', 0.35, 0.10, 0.45, 15.00, 0.52, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'REMOCIÓN ESCOMBROS', 'Remoción y disposición de escombros de construcción', 'cubic yard', 85.00, 45.00, 130.00, 15.00, 149.50, false, true);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  AVG(pm.final_price)::NUMERIC(10,2) as precio_promedio
FROM price_master_usa pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
