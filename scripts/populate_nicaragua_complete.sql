DROP TABLE IF EXISTS price_master_nicaragua;

CREATE TABLE price_master_nicaragua (
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

DELETE FROM price_master_nicaragua;

INSERT INTO price_master_nicaragua (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de cualquier material, incluyendo mano de obra y retiro de escombros', 'm²', 180, 50, 230, 15.00, 264.50, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de cerámica o azulejo, incluyendo mano de obra y retiro de escombros', 'm²', 150, 40, 190, 15.00, 218.50, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS DEMOLICIÓN', 'Retirar azulejos de pared existentes, incluyendo mano de obra y retiro de escombros', 'm²', 140, 35, 175, 15.00, 201.25, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DEMOLICIÓN', 'Desmontar y retirar sanitarios existentes (inodoro, lavamanos), incluyendo mano de obra', 'ud', 280, 60, 340, 15.00, 391.00, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DEMOLICIÓN', 'Desmontar puerta existente con marco, incluyendo mano de obra y retiro', 'ud', 220, 45, 265, 15.00, 304.75, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DEMOLICIÓN', 'Desmontar ventana existente con marco, incluyendo mano de obra y retiro', 'ud', 200, 40, 240, 15.00, 276.00, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Desmontar cielo falso existente, incluyendo estructura y retiro de escombros', 'm²', 120, 30, 150, 15.00, 172.50, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES ELÉCTRICAS DEMOLICIÓN', 'Retirar instalaciones eléctricas existentes (cables, cajas, tomacorrientes)', 'm', 85, 20, 105, 15.00, 120.75, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES PLOMERÍA DEMOLICIÓN', 'Retirar tuberías de plomería existentes', 'm', 95, 25, 120, 15.00, 138.00, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO DEMOLICIÓN', 'Retirar zócalo existente de cualquier material', 'm', 65, 15, 80, 15.00, 92.00, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'REPELLO DEMOLICIÓN', 'Picar repello de pared existente', 'm²', 110, 28, 138, 15.00, 158.70, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS RETIRO', 'Carga y retiro de escombros a vertedero autorizado', 'm³', 420, 180, 600, 15.00, 690.00, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE LADRILLO', 'Construcción de tabique de ladrillo de 10cm, incluyendo materiales y mano de obra', 'm²', 280, 180, 460, 15.00, 529.00, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Construcción de tabique de drywall con estructura metálica', 'm²', 240, 160, 400, 15.00, 460.00, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Aplicación de repello en paredes interiores', 'm²', 180, 95, 275, 15.00, 316.25, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO FINO', 'Aplicación de repello fino para acabado liso', 'm²', 160, 85, 245, 15.00, 281.75, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO', 'Construcción de contrapiso de concreto de 8cm', 'm²', 220, 140, 360, 15.00, 414.00, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PISO', 'Colocación de azulejo en piso, incluyendo material y mano de obra', 'm²', 200, 320, 520, 15.00, 598.00, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PARED', 'Colocación de azulejo en pared, incluyendo material y mano de obra', 'm²', 220, 340, 560, 15.00, 644.00, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica', 'm', 85, 45, 130, 15.00, 149.50, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO DRYWALL', 'Instalación de cielo falso de drywall con estructura', 'm²', 260, 180, 440, 15.00, 506.00, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA INTERIOR', 'Aplicación de pintura látex en interiores, dos manos', 'm²', 95, 55, 150, 15.00, 172.50, false, true),

-- FONTANERÍA/PLOMERÍA
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO', 'Suministro e instalación de inodoro estándar con accesorios', 'ud', 320, 1800, 2120, 15.00, 2438.00, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVAMANOS', 'Suministro e instalación de lavamanos con grifería', 'ud', 280, 1200, 1480, 15.00, 1702.00, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DUCHA', 'Suministro e instalación de ducha completa con grifería', 'ud', 340, 1600, 1940, 15.00, 2231.00, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC para agua fría', 'm', 65, 35, 100, 15.00, 115.00, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC para agua caliente', 'm', 75, 55, 130, 15.00, 149.50, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC para desagüe', 'm', 85, 45, 130, 15.00, 149.50, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN FREGADERO', 'Suministro e instalación de fregadero de cocina con grifería', 'ud', 300, 1400, 1700, 15.00, 1955.00, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN CALENTADOR', 'Suministro e instalación de calentador de agua eléctrico', 'ud', 420, 2800, 3220, 15.00, 3703.00, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE DE PASO', 'Instalación de llave de paso', 'ud', 55, 85, 140, 15.00, 161.00, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE PISO', 'Instalación de desagüe de piso', 'ud', 95, 120, 215, 15.00, 247.25, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera con marco y herrajes', 'ud', 380, 1800, 2180, 15.00, 2507.00, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MDF', 'Suministro e instalación de puerta de MDF con marco y herrajes', 'ud', 320, 1200, 1520, 15.00, 1748.00, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 420, 680, 1100, 15.00, 1265.00, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA MADERA', 'Suministro e instalación de ventana de madera con vidrio', 'm²', 480, 820, 1300, 15.00, 1495.00, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Construcción e instalación de closet de melamina', 'm²', 340, 560, 900, 15.00, 1035.00, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA', 'Construcción e instalación de mueble de cocina en melamina', 'm', 420, 680, 1100, 15.00, 1265.00, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera', 'm', 45, 35, 80, 15.00, 92.00, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA BAÑO', 'Suministro e instalación de puerta para baño con marco', 'ud', 340, 1400, 1740, 15.00, 2001.00, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con caja y cableado', 'ud', 120, 85, 205, 15.00, 235.75, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con caja y cableado', 'ud', 95, 65, 160, 15.00, 184.00, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR DOBLE', 'Instalación de interruptor doble con caja y cableado', 'ud', 110, 75, 185, 15.00, 212.75, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA TECHO', 'Instalación de punto de luz en techo con cableado', 'ud', 140, 95, 235, 15.00, 270.25, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cableado eléctrico calibre 12', 'm', 35, 28, 63, 15.00, 72.45, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico de 12 circuitos', 'ud', 480, 1200, 1680, 15.00, 1932.00, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER CIRCUITO', 'Instalación de breaker para circuito', 'ud', 65, 120, 185, 15.00, 212.75, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Suministro e instalación de luminaria LED', 'ud', 95, 280, 375, 15.00, 431.25, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo', 'ud', 180, 680, 860, 15.00, 989.00, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE PUERTA', 'Instalación de timbre de puerta con cableado', 'ud', 85, 140, 225, 15.00, 258.75, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de aire acondicionado split', 'ud', 520, 3200, 3720, 15.00, 4278.00, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Suministro e instalación de ventilador extractor para baño', 'ud', 140, 280, 420, 15.00, 483.00, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación', 'ud', 55, 45, 100, 15.00, 115.00, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto de ventilación', 'm', 85, 65, 150, 15.00, 172.50, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR AGUA GAS', 'Suministro e instalación de calentador de agua a gas', 'ud', 480, 3400, 3880, 15.00, 4462.00, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra completa', 'm²', 28, 12, 40, 15.00, 46.00, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y vidrios', 'm²', 35, 15, 50, 15.00, 57.50, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_nicaragua pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
