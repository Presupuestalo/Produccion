DROP TABLE IF EXISTS price_master_panama;

CREATE TABLE price_master_panama (
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
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  long_description TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PANAMÁ - Precios en Balboas/Dólares (PAB/USD)
-- Terminología: Plomería, Cerámica, Cielo raso, Zócalo, Repello, Contrapiso, Calentador, Lavamanos, Tomacorriente

INSERT INTO price_master_panama (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES

-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros', 'm²', 8, 3, 11, 15.00, 12.65, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS CERÁMICA DEMOLICIÓN', 'Picar piso existente de cerámica con maquinaria, incluye retiro', 'm²', 10, 4, 14, 15.00, 16.10, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DEMOLICIÓN', 'Desmontar y retirar sanitarios existentes (inodoro, lavamanos)', 'ud', 25, 8, 33, 15.00, 37.95, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DEMOLICIÓN', 'Desmontar puerta existente con marco, incluye retiro', 'ud', 20, 5, 25, 15.00, 28.75, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DEMOLICIÓN', 'Desmontar ventana existente con marco de aluminio', 'ud', 22, 6, 28, 15.00, 32.20, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS PARED DEMOLICIÓN', 'Picar azulejos de pared existentes, incluye retiro', 'm²', 11, 4, 15, 15.00, 17.25, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO RASO DEMOLICIÓN', 'Desmontar cielo raso existente de fibra mineral', 'm²', 9, 2, 11, 15.00, 12.65, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA DEMOLICIÓN', 'Retirar instalación eléctrica existente (cables, cajas)', 'm', 4, 1, 5, 15.00, 5.75, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍA PLOMERÍA DEMOLICIÓN', 'Retirar tubería de plomería existente (PVC o cobre)', 'm', 5, 1.5, 6.5, 15.00, 7.48, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO DEMOLICIÓN', 'Retirar zócalo existente de madera o cerámica', 'm', 2.5, 0.5, 3, 15.00, 3.45, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLES COCINA DEMOLICIÓN', 'Desmontar muebles de cocina existentes', 'm', 15, 3, 18, 15.00, 20.70, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS TRANSPORTE', 'Carga y transporte de escombros a vertedero autorizado', 'm³', 25, 40, 65, 15.00, 74.75, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOQUE CONCRETO', 'Construcción de tabique con bloque de concreto 15cm, incluye mortero', 'm²', 38, 27, 65, 15.00, 74.75, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Instalación de tabique de drywall con estructura metálica', 'm²', 30, 22, 52, 15.00, 59.80, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero cemento-arena, acabado fino', 'm²', 17, 9, 26, 15.00, 29.90, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO CONCRETO', 'Contrapiso de concreto 8cm de espesor, incluye malla electrosoldada', 'm²', 25, 20, 45, 15.00, 51.75, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PISO', 'Instalación de cerámica para piso, incluye material de pega', 'm²', 24, 30, 54, 15.00, 62.10, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PARED', 'Instalación de cerámica para pared de baño o cocina', 'm²', 25, 32, 57, 15.00, 65.55, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica h=10cm', 'm', 5.5, 3.5, 9, 15.00, 10.35, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO RASO FIBRA MINERAL', 'Instalación de cielo raso con placas de fibra mineral', 'm²', 20, 17, 37, 15.00, 42.55, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA PAREDES', 'Pintura látex para paredes interiores, 2 manos', 'm²', 8, 5, 13, 15.00, 14.95, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'IMPERMEABILIZACIÓN', 'Impermeabilización de superficie con membrana asfáltica', 'm²', 17, 22, 39, 15.00, 44.85, false, true),

-- PLOMERÍA
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Suministro e instalación de inodoro de porcelana blanco', 'ud', 45, 140, 185, 15.00, 212.75, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Suministro e instalación de lavamanos con pedestal', 'ud', 38, 110, 148, 15.00, 170.20, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha con grifería cromada', 'ud', 32, 88, 120, 15.00, 138.00, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Suministro e instalación de fregadero de acero inoxidable', 'ud', 35, 100, 135, 15.00, 155.25, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GRIFERÍA LAVAMANOS', 'Suministro e instalación de grifería cromada para lavamanos', 'ud', 25, 70, 95, 15.00, 109.25, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC AGUA', 'Instalación de tubería PVC para agua potable 1/2"', 'm', 8, 5.5, 13.5, 15.00, 15.53, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC DESAGÜE', 'Instalación de tubería PVC para desagüe 4"', 'm', 9.5, 7, 16.5, 15.00, 18.98, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR ELÉCTRICO', 'Suministro e instalación de calentador eléctrico 50 litros', 'ud', 55, 265, 320, 15.00, 368.00, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Suministro e instalación de calentador de gas instantáneo', 'ud', 62, 295, 357, 15.00, 410.55, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'VÁLVULA PASO', 'Instalación de válvula de paso de bronce 1/2"', 'ud', 11, 14, 25, 15.00, 28.75, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera maciza con marco', 'ud', 78, 205, 283, 15.00, 325.45, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA TAMBOR', 'Suministro e instalación de puerta tipo tambor con marco', 'ud', 56, 142, 198, 15.00, 227.70, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 110, 142, 252, 15.00, 289.80, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Fabricación e instalación de closet en melamina', 'm', 88, 132, 220, 15.00, 253.00, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLES COCINA', 'Fabricación e instalación de muebles de cocina en melamina', 'm', 100, 150, 250, 15.00, 287.50, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera h=10cm', 'm', 7, 5.5, 12.5, 15.00, 14.38, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO LAMINADO', 'Instalación de piso laminado con espuma niveladora', 'm²', 20, 38, 58, 15.00, 66.70, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CERRADURA PUERTA', 'Suministro e instalación de cerradura de pomo', 'ud', 14, 38, 52, 15.00, 59.80, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con placa', 'ud', 14, 11, 25, 15.00, 28.75, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa', 'ud', 12, 9, 21, 15.00, 24.15, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Suministro e instalación de luminaria LED empotrable', 'ud', 17, 47, 64, 15.00, 73.60, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cable eléctrico calibre 12 en tubería', 'm', 5.5, 3.8, 9.3, 15.00, 10.70, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Suministro e instalación de tablero eléctrico 12 circuitos', 'ud', 110, 265, 375, 15.00, 431.25, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER TERMOMAGNÉTICO', 'Instalación de breaker termomagnético 20A', 'ud', 11, 20, 31, 15.00, 35.65, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TUBERÍA CONDUIT', 'Instalación de tubería conduit PVC 3/4"', 'm', 4.7, 3.2, 7.9, 15.00, 9.09, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CAJA ELÉCTRICA', 'Instalación de caja eléctrica rectangular', 'ud', 6.2, 2.5, 8.7, 15.00, 10.01, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo', 'ud', 25, 110, 135, 15.00, 155.25, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE PUERTA', 'Suministro e instalación de timbre inalámbrico', 'ud', 12, 25, 37, 15.00, 42.55, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de aire acondicionado split 12000 BTU', 'ud', 140, 565, 705, 15.00, 810.75, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'EXTRACTOR BAÑO', 'Suministro e instalación de extractor de aire para baño', 'ud', 25, 56, 81, 15.00, 93.15, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMPANA EXTRACTORA', 'Suministro e instalación de campana extractora para cocina', 'ud', 38, 172, 210, 15.00, 241.50, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación de aluminio', 'ud', 11, 14, 25, 15.00, 28.75, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto flexible para ventilación', 'm', 9.5, 7.8, 17.3, 15.00, 19.90, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra, incluye retiro de polvo y residuos', 'm²', 4.7, 2.5, 7.2, 15.00, 8.28, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y marcos por ambos lados', 'm²', 6.2, 1.5, 7.7, 15.00, 8.86, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_panama pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
