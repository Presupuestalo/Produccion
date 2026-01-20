DROP TABLE IF EXISTS price_master_el_salvador;

CREATE TABLE price_master_el_salvador (
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

DELETE FROM price_master_el_salvador;

INSERT INTO price_master_el_salvador (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de cualquier material, incluyendo mano de obra y retiro de escombros', 'm²', 4.50, 1.25, 5.75, 15.00, 6.61, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de cerámica o azulejo, incluyendo mano de obra y retiro de escombros', 'm²', 3.75, 1.00, 4.75, 15.00, 5.46, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS DEMOLICIÓN', 'Retirar azulejos de pared existentes, incluyendo mano de obra y retiro de escombros', 'm²', 3.50, 0.90, 4.40, 15.00, 5.06, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DEMOLICIÓN', 'Desmontar y retirar sanitarios existentes (inodoro, lavamanos), incluyendo mano de obra', 'ud', 7.00, 1.50, 8.50, 15.00, 9.78, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DEMOLICIÓN', 'Desmontar puerta existente con marco, incluyendo mano de obra y retiro', 'ud', 5.50, 1.15, 6.65, 15.00, 7.65, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DEMOLICIÓN', 'Desmontar ventana existente con marco, incluyendo mano de obra y retiro', 'ud', 5.00, 1.00, 6.00, 15.00, 6.90, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Desmontar cielo falso existente, incluyendo estructura y retiro de escombros', 'm²', 3.00, 0.75, 3.75, 15.00, 4.31, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES ELÉCTRICAS DEMOLICIÓN', 'Retirar instalaciones eléctricas existentes (cables, cajas, tomacorrientes)', 'm', 2.15, 0.50, 2.65, 15.00, 3.05, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES PLOMERÍA DEMOLICIÓN', 'Retirar tuberías de plomería existentes', 'm', 2.40, 0.65, 3.05, 15.00, 3.51, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO DEMOLICIÓN', 'Retirar zócalo existente de cualquier material', 'm', 1.65, 0.40, 2.05, 15.00, 2.36, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'REPELLO DEMOLICIÓN', 'Picar repello de pared existente', 'm²', 2.75, 0.70, 3.45, 15.00, 3.97, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS RETIRO', 'Carga y retiro de escombros a vertedero autorizado', 'm³', 10.50, 4.50, 15.00, 15.00, 17.25, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE LADRILLO', 'Construcción de tabique de ladrillo de 10cm, incluyendo materiales y mano de obra', 'm²', 7.00, 4.50, 11.50, 15.00, 13.23, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Construcción de tabique de drywall con estructura metálica', 'm²', 6.00, 4.00, 10.00, 15.00, 11.50, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Aplicación de repello en paredes interiores', 'm²', 4.50, 2.40, 6.90, 15.00, 7.94, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO FINO', 'Aplicación de repello fino para acabado liso', 'm²', 4.00, 2.15, 6.15, 15.00, 7.07, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO', 'Construcción de contrapiso de concreto de 8cm', 'm²', 5.50, 3.50, 9.00, 15.00, 10.35, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PISO', 'Colocación de azulejo en piso, incluyendo material y mano de obra', 'm²', 5.00, 8.00, 13.00, 15.00, 14.95, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PARED', 'Colocación de azulejo en pared, incluyendo material y mano de obra', 'm²', 5.50, 8.50, 14.00, 15.00, 16.10, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica', 'm', 2.15, 1.15, 3.30, 15.00, 3.80, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO DRYWALL', 'Instalación de cielo falso de drywall con estructura', 'm²', 6.50, 4.50, 11.00, 15.00, 12.65, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA INTERIOR', 'Aplicación de pintura látex en interiores, dos manos', 'm²', 2.40, 1.40, 3.80, 15.00, 4.37, false, true),

-- FONTANERÍA/PLOMERÍA
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO', 'Suministro e instalación de inodoro estándar con accesorios', 'ud', 8.00, 45.00, 53.00, 15.00, 60.95, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVAMANOS', 'Suministro e instalación de lavamanos con grifería', 'ud', 7.00, 30.00, 37.00, 15.00, 42.55, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DUCHA', 'Suministro e instalación de ducha completa con grifería', 'ud', 8.50, 40.00, 48.50, 15.00, 55.78, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC para agua fría', 'm', 1.65, 0.90, 2.55, 15.00, 2.93, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC para agua caliente', 'm', 1.90, 1.40, 3.30, 15.00, 3.80, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC para desagüe', 'm', 2.15, 1.15, 3.30, 15.00, 3.80, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN FREGADERO', 'Suministro e instalación de fregadero de cocina con grifería', 'ud', 7.50, 35.00, 42.50, 15.00, 48.88, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN CALENTADOR', 'Suministro e instalación de calentador de agua eléctrico', 'ud', 10.50, 70.00, 80.50, 15.00, 92.58, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE DE PASO', 'Instalación de llave de paso', 'ud', 1.40, 2.15, 3.55, 15.00, 4.08, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE PISO', 'Instalación de desagüe de piso', 'ud', 2.40, 3.00, 5.40, 15.00, 6.21, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera con marco y herrajes', 'ud', 9.50, 45.00, 54.50, 15.00, 62.68, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MDF', 'Suministro e instalación de puerta de MDF con marco y herrajes', 'ud', 8.00, 30.00, 38.00, 15.00, 43.70, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 10.50, 17.00, 27.50, 15.00, 31.63, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA MADERA', 'Suministro e instalación de ventana de madera con vidrio', 'm²', 12.00, 20.50, 32.50, 15.00, 37.38, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Construcción e instalación de closet de melamina', 'm²', 8.50, 14.00, 22.50, 15.00, 25.88, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA', 'Construcción e instalación de mueble de cocina en melamina', 'm', 10.50, 17.00, 27.50, 15.00, 31.63, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera', 'm', 1.15, 0.90, 2.05, 15.00, 2.36, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA BAÑO', 'Suministro e instalación de puerta para baño con marco', 'ud', 8.50, 35.00, 43.50, 15.00, 50.03, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con caja y cableado', 'ud', 3.00, 2.15, 5.15, 15.00, 5.92, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con caja y cableado', 'ud', 2.40, 1.65, 4.05, 15.00, 4.66, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR DOBLE', 'Instalación de interruptor doble con caja y cableado', 'ud', 2.75, 1.90, 4.65, 15.00, 5.35, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA TECHO', 'Instalación de punto de luz en techo con cableado', 'ud', 3.50, 2.40, 5.90, 15.00, 6.79, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cableado eléctrico calibre 12', 'm', 0.90, 0.70, 1.60, 15.00, 1.84, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico de 12 circuitos', 'ud', 12.00, 30.00, 42.00, 15.00, 48.30, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER CIRCUITO', 'Instalación de breaker para circuito', 'ud', 1.65, 3.00, 4.65, 15.00, 5.35, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Suministro e instalación de luminaria LED', 'ud', 2.40, 7.00, 9.40, 15.00, 10.81, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo', 'ud', 4.50, 17.00, 21.50, 15.00, 24.73, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE PUERTA', 'Instalación de timbre de puerta con cableado', 'ud', 2.15, 3.50, 5.65, 15.00, 6.50, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de aire acondicionado split', 'ud', 13.00, 80.00, 93.00, 15.00, 106.95, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Suministro e instalación de ventilador extractor para baño', 'ud', 3.50, 7.00, 10.50, 15.00, 12.08, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación', 'ud', 1.40, 1.15, 2.55, 15.00, 2.93, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto de ventilación', 'm', 2.15, 1.65, 3.80, 15.00, 4.37, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR AGUA GAS', 'Suministro e instalación de calentador de agua a gas', 'ud', 12.00, 85.00, 97.00, 15.00, 111.55, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra completa', 'm²', 0.70, 0.30, 1.00, 15.00, 1.15, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y vidrios', 'm²', 0.90, 0.40, 1.30, 15.00, 1.50, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_el_salvador pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
