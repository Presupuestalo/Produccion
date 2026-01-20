DROP TABLE IF EXISTS price_master_honduras;

CREATE TABLE price_master_honduras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  profit_margin DECIMAL(5,2) DEFAULT 15.00,
  final_price DECIMAL(10,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  long_description TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Honduras: Lempira (HNL), ~25 HNL = 1 USD
-- Terminología: Plomería, Azulejo, Cielo falso, Zócalo, Repello, Contrapiso, Calentador, Lavamanos, Tomacorriente

INSERT INTO price_master_honduras (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de cualquier material, incluyendo mano de obra y retiro de escombros', 'm²', 125, 40, 165, 15.00, 190, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de cerámica o azulejo, incluyendo mortero base', 'm²', 150, 30, 180, 15.00, 207, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DESMONTAJE', 'Desmontar puerta existente con marco, conservando elementos reutilizables', 'ud', 200, 0, 200, 15.00, 230, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DESMONTAJE', 'Desmontar ventana existente con marco de aluminio o madera', 'ud', 175, 0, 175, 15.00, 201, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DESMONTAJE', 'Desmontar inodoro, lavamanos y accesorios de baño', 'ud', 150, 0, 150, 15.00, 173, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS DEMOLICIÓN', 'Picar azulejos de pared en baños o cocinas', 'm²', 140, 25, 165, 15.00, 190, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Demoler cielo falso de yeso o fibra mineral con estructura', 'm²', 100, 20, 120, 15.00, 138, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES ELÉCTRICAS DESMONTAJE', 'Desmontar instalación eléctrica existente, cables y cajas', 'm', 30, 0, 30, 15.00, 35, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍAS DESMONTAJE', 'Desmontar tuberías de agua o desagüe existentes', 'm', 40, 0, 40, 15.00, 46, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS RETIRO', 'Carga, transporte y descarga de escombros a vertedero autorizado', 'm³', 300, 150, 450, 15.00, 518, false, true),

-- ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES BLOQUE', 'Construcción de tabique de bloque de concreto de 15cm, con mortero', 'm²', 200, 180, 380, 15.00, 437, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero de cemento y arena, acabado liso', 'm²', 120, 80, 200, 15.00, 230, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO CONCRETO', 'Contrapiso de concreto de 10cm de espesor con malla electrosoldada', 'm²', 180, 220, 400, 15.00, 460, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PISO', 'Colocación de azulejo de piso de 40x40cm con mortero adhesivo', 'm²', 150, 280, 430, 15.00, 495, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PARED', 'Colocación de azulejo de pared de 30x30cm en baños o cocinas', 'm²', 180, 250, 430, 15.00, 495, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica de 10cm de altura', 'm', 35, 25, 60, 15.00, 69, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO YESO', 'Instalación de cielo falso de paneles de yeso con estructura metálica', 'm²', 200, 180, 380, 15.00, 437, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA INTERIOR', 'Pintura interior de paredes con látex acrílico, dos manos', 'm²', 60, 40, 100, 15.00, 115, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA EXTERIOR', 'Pintura exterior de fachadas con pintura acrílica resistente', 'm²', 80, 60, 140, 15.00, 161, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'IMPERMEABILIZACIÓN', 'Impermeabilización de losa o terraza con membrana asfáltica', 'm²', 150, 200, 350, 15.00, 403, false, true),

-- FONTANERÍA/PLOMERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC para agua fría de 1/2 pulgada', 'm', 50, 30, 80, 15.00, 92, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC para agua caliente de 1/2 pulgada', 'm', 60, 45, 105, 15.00, 121, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC para desagüe de 4 pulgadas', 'm', 70, 50, 120, 15.00, 138, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Suministro e instalación de inodoro de porcelana con accesorios', 'ud', 250, 1800, 2050, 15.00, 2358, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Suministro e instalación de lavamanos de porcelana con grifería', 'ud', 200, 1200, 1400, 15.00, 1610, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha con grifería mezcladora cromada', 'ud', 180, 800, 980, 15.00, 1127, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Suministro e instalación de fregadero de acero inoxidable con grifería', 'ud', 220, 1400, 1620, 15.00, 1863, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Suministro e instalación de calentador de agua a gas de 40 litros', 'ud', 400, 4500, 4900, 15.00, 5635, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO', 'Instalación de llave de paso de 1/2 pulgada', 'ud', 40, 80, 120, 15.00, 138, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE INSTALACIÓN', 'Instalación de sifón y desagüe para lavamanos o fregadero', 'ud', 60, 100, 160, 15.00, 184, false, true),

-- CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera maciza con marco', 'ud', 400, 2800, 3200, 15.00, 3680, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA TAMBOR', 'Suministro e instalación de puerta tipo tambor con marco de madera', 'ud', 300, 1800, 2100, 15.00, 2415, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 350, 650, 1000, 15.00, 1150, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Fabricación e instalación de closet de melamina con puertas corredizas', 'm²', 400, 800, 1200, 15.00, 1380, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA', 'Fabricación e instalación de mueble bajo de cocina en melamina', 'm', 350, 700, 1050, 15.00, 1208, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera de 10cm de altura', 'm', 30, 40, 70, 15.00, 81, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA CORREDERA', 'Suministro e instalación de puerta corredera con riel y accesorios', 'ud', 450, 3200, 3650, 15.00, 4198, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CERRADURA INSTALACIÓN', 'Instalación de cerradura de pomo o manija', 'ud', 80, 250, 330, 15.00, 380, false, true),

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cable eléctrico calibre 12 AWG en tubería', 'm', 25, 20, 45, 15.00, 52, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble polarizado con placa', 'ud', 60, 80, 140, 15.00, 161, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa decorativa', 'ud', 50, 60, 110, 15.00, 127, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED', 'Suministro e instalación de lámpara LED de techo', 'ud', 80, 300, 380, 15.00, 437, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PANEL ELÉCTRICO', 'Instalación de panel eléctrico de 12 circuitos con breakers', 'ud', 500, 1800, 2300, 15.00, 2645, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER INSTALACIÓN', 'Instalación de breaker termomagnético de 20A', 'ud', 40, 120, 160, 15.00, 184, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TUBERÍA CONDUIT', 'Instalación de tubería conduit PVC de 3/4 pulgada', 'm', 20, 15, 35, 15.00, 40, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CAJA ELÉCTRICA', 'Instalación de caja eléctrica rectangular o cuadrada', 'ud', 30, 25, 55, 15.00, 63, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo con luz', 'ud', 150, 800, 950, 15.00, 1093, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INSTALACIÓN', 'Instalación de timbre inalámbrico con pulsador', 'ud', 60, 200, 260, 15.00, 299, false, true),

-- CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de aire acondicionado split de 12000 BTU', 'ud', 600, 5500, 6100, 15.00, 7015, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Instalación de ventilador extractor para baño o cocina', 'ud', 100, 350, 450, 15.00, 518, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación de aluminio', 'ud', 40, 80, 120, 15.00, 138, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto flexible para ventilación', 'm', 50, 60, 110, 15.00, 127, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR ELÉCTRICO', 'Suministro e instalación de calentador eléctrico de 50 litros', 'ud', 300, 3500, 3800, 15.00, 4370, false, true),

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa de obra terminada, incluyendo ventanas y pisos', 'm²', 15, 10, 25, 15.00, 29, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA ESCOMBROS', 'Limpieza y barrido de escombros durante la obra', 'm²', 8, 5, 13, 15.00, 15, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmh.final_price) as precio_minimo,
  MAX(pmh.final_price) as precio_maximo,
  ROUND(AVG(pmh.final_price), 2) as precio_promedio
FROM price_master_honduras pmh
JOIN price_categories pc ON pmh.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
