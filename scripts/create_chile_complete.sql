-- =====================================================
-- CREAR TABLA PRICE_MASTER_CHILE CON SCHEMA COMPLETO
-- =====================================================

DROP TABLE IF EXISTS price_master_chile CASCADE;

CREATE TABLE price_master_chile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES price_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  
  -- Precios base
  material_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  
  -- Márgenes y precio final
  profit_margin DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  
  -- Campos específicos para materiales
  color TEXT,
  brand TEXT,
  model TEXT,
  
  -- Metadatos
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_custom_has_user_chile CHECK (
    (is_custom = false) OR (is_custom = true AND user_id IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_price_master_chile_category ON price_master_chile(category_id);
CREATE INDEX idx_price_master_chile_code ON price_master_chile(code);
CREATE INDEX idx_price_master_chile_user ON price_master_chile(user_id);
CREATE INDEX idx_price_master_chile_active ON price_master_chile(is_active);

-- =====================================================
-- POBLAR CON DATOS ADAPTADOS A CHILE
-- Terminología chilena: Calefont, Radier, Palmeta, Guardapolvo, Grifería
-- Precios en Pesos Chilenos (CLP) - Aproximadamente 850x precios EUR
-- =====================================================

-- CATEGORÍA: DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
-- Añadiendo is_custom y is_active a cada INSERT
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall (volcanita), incluyendo mano de obra y retiro de escombros a punto autorizado.', 'm²', 50000, 15000, 65000, 15.00, 74750, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO CERÁMICA MUROS', 'Picar cerámica o palmeta existente en muros, incluyendo mano de obra y retiro de escombros.', 'm²', 42000, 10000, 52000, 20.00, 62400, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picar piso existente (cerámica, palmeta o radier), incluyendo mano de obra y retiro de escombros.', 'm²', 65000, 20000, 85000, 20.00, 102000, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CIELO FALSO', 'Retirar cielo falso existente, incluyendo estructura y retiro de escombros.', 'm²', 45000, 15000, 60000, 15.00, 69000, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retirar molduras decorativas existentes, incluyendo mano de obra.', 'ml', 5000, 1000, 6000, 15.00, 6900, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO FLOTANTE', 'Retirar piso flotante o laminado existente con sus listones, incluyendo retiro de escombros.', 'm²', 28000, 8000, 36000, 15.00, 41400, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE GUARDAPOLVO MADERA', 'Retirar guardapolvo o zócalo de madera existente, incluyendo mano de obra.', 'ml', 8500, 2000, 10500, 10.00, 11550, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE GUARDAPOLVO CERÁMICO', 'Retirar guardapolvo o zócalo cerámico existente, incluyendo mano de obra.', 'ml', 18000, 5000, 23000, 10.00, 25300, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Arriendo de contenedor para escombros, incluye transporte y disposición final en vertedero autorizado.', 'Ud', 150000, 1700000, 1850000, 15.00, 2127500, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA ESCOMBROS', 'Hora de trabajo para bajada de escombros desde pisos superiores, incluye mano de obra.', 'H', 45000, 10000, 55000, 10.00, 60500, false, true);

-- CATEGORÍA: ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'RADIER HORMIGÓN', 'Ejecución de radier de hormigón H20 de 10cm de espesor, incluye malla acma, polietileno y mano de obra.', 'm²', 35000, 45000, 80000, 20.00, 96000, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL SIMPLE', 'Construcción de tabique de drywall (volcanita) simple con estructura metálica, incluye materiales y mano de obra.', 'm²', 28000, 32000, 60000, 20.00, 72000, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL DOBLE', 'Construcción de tabique de drywall (volcanita) doble con aislación acústica, incluye materiales y mano de obra.', 'm²', 38000, 48000, 86000, 20.00, 103200, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE CERÁMICA MUROS', 'Instalación de cerámica o palmeta en muros, incluye adhesivo, fragüe y mano de obra. No incluye cerámica.', 'm²', 32000, 18000, 50000, 20.00, 60000, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'INSTALACIÓN CERÁMICA PISOS', 'Instalación de cerámica o palmeta en pisos, incluye adhesivo, fragüe y mano de obra. No incluye cerámica.', 'm²', 28000, 15000, 43000, 20.00, 51600, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ESTUCO MUROS INTERIORES', 'Aplicación de estuco o enlucido en muros interiores, incluye materiales y mano de obra.', 'm²', 22000, 13000, 35000, 20.00, 42000, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ESTUCO CIELOS', 'Aplicación de estuco o enlucido en cielos, incluye materiales y mano de obra.', 'm²', 25000, 15000, 40000, 20.00, 48000, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'MOLDURA DECORATIVA', 'Instalación de moldura decorativa en cielos o muros, incluye materiales y mano de obra.', 'ml', 8500, 6500, 15000, 20.00, 18000, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO DRYWALL', 'Construcción de cielo falso de drywall (volcanita) con estructura metálica, incluye materiales y mano de obra.', 'm²', 32000, 28000, 60000, 20.00, 72000, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA LÁTEX MUROS', 'Aplicación de pintura látex en muros interiores, 2 manos, incluye materiales y mano de obra.', 'm²', 12000, 8000, 20000, 20.00, 24000, false, true);

-- CATEGORÍA: FONTANERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED AGUA FRÍA BAÑO', 'Instalación de red de agua fría para baño completo, incluye cañerías de cobre, fittings y mano de obra.', 'Ud', 180000, 120000, 300000, 20.00, 360000, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED AGUA CALIENTE BAÑO', 'Instalación de red de agua caliente para baño completo, incluye cañerías de cobre, fittings y mano de obra.', 'Ud', 200000, 140000, 340000, 20.00, 408000, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DESAGÜE BAÑO', 'Instalación de red de desagüe para baño completo, incluye cañerías PVC, fittings y mano de obra.', 'Ud', 220000, 100000, 320000, 20.00, 384000, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN WC', 'Instalación de WC (inodoro) con estanque, incluye conexiones y mano de obra. No incluye artefacto.', 'Ud', 65000, 35000, 100000, 20.00, 120000, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVAMANOS', 'Instalación de lavamanos con pedestal, incluye grifería, sifón y mano de obra. No incluye artefacto.', 'Ud', 55000, 30000, 85000, 20.00, 102000, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN TINA', 'Instalación de tina de baño, incluye grifería, desagüe y mano de obra. No incluye artefacto.', 'Ud', 120000, 80000, 200000, 20.00, 240000, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DUCHA', 'Instalación de ducha con receptáculo, incluye grifería, desagüe y mano de obra. No incluye artefacto.', 'Ud', 95000, 65000, 160000, 20.00, 192000, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GRIFERÍA LAVAPLATOS', 'Instalación de grifería para lavaplatos de cocina, incluye conexiones y mano de obra. No incluye grifería.', 'Ud', 35000, 20000, 55000, 20.00, 66000, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CAÑERÍA COBRE 1/2"', 'Suministro e instalación de cañería de cobre de 1/2", incluye fittings y mano de obra.', 'ml', 12000, 8000, 20000, 20.00, 24000, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CAÑERÍA PVC DESAGÜE 110mm', 'Suministro e instalación de cañería PVC para desagüe de 110mm, incluye fittings y mano de obra.', 'ml', 15000, 10000, 25000, 20.00, 30000, false, true);

-- CATEGORÍA: CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO FLOTANTE 7MM', 'Instalación de piso flotante laminado de 7mm, incluye espuma niveladora y mano de obra. No incluye piso.', 'm²', 18000, 12000, 30000, 20.00, 36000, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO FLOTANTE 12MM', 'Instalación de piso flotante laminado de 12mm, incluye espuma niveladora y mano de obra. No incluye piso.', 'm²', 22000, 15000, 37000, 20.00, 44400, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA INTERIOR MDF', 'Suministro e instalación de puerta interior de MDF con marco, incluye chapa y bisagras.', 'Ud', 85000, 165000, 250000, 20.00, 300000, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA EXTERIOR MADERA', 'Suministro e instalación de puerta exterior de madera sólida con marco, incluye chapa de seguridad.', 'Ud', 120000, 380000, 500000, 20.00, 600000, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'GUARDAPOLVO MDF', 'Suministro e instalación de guardapolvo o zócalo de MDF, incluye fijaciones y mano de obra.', 'ml', 6500, 4500, 11000, 20.00, 13200, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'GUARDAPOLVO MADERA', 'Suministro e instalación de guardapolvo o zócalo de madera sólida, incluye fijaciones y mano de obra.', 'ml', 8500, 6500, 15000, 20.00, 18000, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Suministro e instalación de mueble bajo de cocina en melamina, incluye bisagras y tiradores.', 'ml', 95000, 155000, 250000, 20.00, 300000, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Suministro e instalación de mueble alto de cocina en melamina, incluye bisagras y tiradores.', 'ml', 75000, 125000, 200000, 20.00, 240000, false, true);

-- CATEGORÍA: ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO 12 POLOS', 'Suministro e instalación de tablero eléctrico de 12 polos con automáticos, incluye materiales y mano de obra.', 'Ud', 180000, 220000, 400000, 20.00, 480000, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO ENCHUFE SIMPLE', 'Instalación de punto de enchufe simple, incluye caja, enchufe, cableado y mano de obra.', 'Ud', 18000, 12000, 30000, 20.00, 36000, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO ENCHUFE DOBLE', 'Instalación de punto de enchufe doble, incluye caja, enchufe, cableado y mano de obra.', 'Ud', 22000, 15000, 37000, 20.00, 44400, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO LUZ SIMPLE', 'Instalación de punto de luz simple con interruptor, incluye caja, interruptor, cableado y mano de obra.', 'Ud', 20000, 13000, 33000, 20.00, 39600, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO LUZ CONMUTADO', 'Instalación de punto de luz conmutado (dos interruptores), incluye cajas, interruptores, cableado y mano de obra.', 'Ud', 28000, 18000, 46000, 20.00, 55200, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED EMPOTRADA', 'Suministro e instalación de luminaria LED empotrada en cielo, incluye conexión y mano de obra.', 'Ud', 25000, 35000, 60000, 20.00, 72000, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED SUPERFICIE', 'Suministro e instalación de luminaria LED de superficie, incluye conexión y mano de obra.', 'Ud', 20000, 30000, 50000, 20.00, 60000, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE ELÉCTRICO 2.5mm²', 'Suministro e instalación de cable eléctrico de 2.5mm², incluye canalización y mano de obra.', 'ml', 3500, 2500, 6000, 20.00, 7200, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE ELÉCTRICO 4mm²', 'Suministro e instalación de cable eléctrico de 4mm², incluye canalización y mano de obra.', 'ml', 4500, 3500, 8000, 20.00, 9600, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CERTIFICACIÓN ELÉCTRICA SEC', 'Certificación eléctrica ante la Superintendencia de Electricidad y Combustibles (SEC), incluye trámites.', 'Ud', 120000, 80000, 200000, 20.00, 240000, false, true);

-- CATEGORÍA: CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFONT GAS 14 LITROS', 'Suministro e instalación de calefont a gas de 14 litros/minuto, incluye conexiones y mano de obra.', 'Ud', 95000, 305000, 400000, 20.00, 480000, false, true),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TERMO ELÉCTRICO 50 LITROS', 'Suministro e instalación de termo eléctrico de 50 litros, incluye conexiones eléctricas y mano de obra.', 'Ud', 75000, 225000, 300000, 20.00, 360000, false, true),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TERMO ELÉCTRICO 80 LITROS', 'Suministro e instalación de termo eléctrico de 80 litros, incluye conexiones eléctricas y mano de obra.', 'Ud', 85000, 265000, 350000, 20.00, 420000, false, true),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RADIADOR ELÉCTRICO MURAL', 'Suministro e instalación de radiador eléctrico mural, incluye conexión eléctrica y mano de obra.', 'Ud', 45000, 155000, 200000, 20.00, 240000, false, true),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'ESTUFA PARAFINA', 'Suministro e instalación de estufa a parafina, incluye conexión de salida de gases y mano de obra.', 'Ud', 65000, 235000, 300000, 20.00, 360000, false, true);

-- CATEGORÍA: LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
INSERT INTO price_master_chile (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA PERIÓDICA OBRA', 'Limpieza periódica durante la obra, incluye retiro de escombros menores y barrido.', 'H', 12000, 3000, 15000, 20.00, 18000, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra, incluye lavado de ventanas, pisos, retiro de protecciones y limpieza profunda.', 'm²', 8500, 3500, 12000, 20.00, 14400, false, true);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_chile pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
