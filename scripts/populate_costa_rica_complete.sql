DROP TABLE IF EXISTS price_master_costarica;

CREATE TABLE price_master_costarica (
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

-- COSTA RICA - Precios en Colones Costarricenses (CRC)
-- Terminología: Plomería, Cerámica, Cielo falso, Zócalo, Repello, Contrapiso, Calentador, Lavamanos, Tomacorriente

INSERT INTO price_master_costarica (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros', 'm²', 2500, 800, 3300, 15.00, 3795, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS CERÁMICA DEMOLICIÓN', 'Picar piso existente de cerámica con maquinaria, incluye retiro', 'm²', 3200, 1000, 4200, 15.00, 4830, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DEMOLICIÓN', 'Desmontar y retirar sanitarios existentes (inodoro, lavamanos)', 'ud', 8500, 2500, 11000, 15.00, 12650, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DEMOLICIÓN', 'Desmontar puerta existente con marco, incluye retiro', 'ud', 6500, 1500, 8000, 15.00, 9200, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DEMOLICIÓN', 'Desmontar ventana existente con marco de aluminio', 'ud', 7000, 2000, 9000, 15.00, 10350, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS PARED DEMOLICIÓN', 'Picar azulejos de pared existentes, incluye retiro', 'm²', 3500, 1200, 4700, 15.00, 5405, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Desmontar cielo falso existente de fibra mineral', 'm²', 2800, 700, 3500, 15.00, 4025, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA DEMOLICIÓN', 'Retirar instalación eléctrica existente (cables, cajas)', 'm', 1200, 300, 1500, 15.00, 1725, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍA PLOMERÍA DEMOLICIÓN', 'Retirar tubería de plomería existente (PVC o cobre)', 'm', 1500, 400, 1900, 15.00, 2185, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO DEMOLICIÓN', 'Retirar zócalo existente de madera o cerámica', 'm', 800, 200, 1000, 15.00, 1150, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLES COCINA DEMOLICIÓN', 'Desmontar muebles de cocina existentes', 'm', 4500, 1000, 5500, 15.00, 6325, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS TRANSPORTE', 'Carga y transporte de escombros a vertedero autorizado', 'm³', 8000, 12000, 20000, 15.00, 23000, false, true),

-- ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOQUE CONCRETO', 'Construcción de tabique con bloque de concreto 15cm, incluye mortero', 'm²', 12000, 8500, 20500, 15.00, 23575, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Instalación de tabique de drywall con estructura metálica', 'm²', 9500, 7000, 16500, 15.00, 18975, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero cemento-arena, acabado fino', 'm²', 5500, 3000, 8500, 15.00, 9775, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO CONCRETO', 'Contrapiso de concreto 8cm de espesor, incluye malla electrosoldada', 'm²', 8000, 6500, 14500, 15.00, 16675, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PISO', 'Instalación de cerámica para piso, incluye material de pega', 'm²', 7500, 9500, 17000, 15.00, 19550, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PARED', 'Instalación de cerámica para pared de baño o cocina', 'm²', 8000, 10000, 18000, 15.00, 20700, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica h=10cm', 'm', 1800, 1200, 3000, 15.00, 3450, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO FIBRA MINERAL', 'Instalación de cielo falso con placas de fibra mineral', 'm²', 6500, 5500, 12000, 15.00, 13800, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA PAREDES', 'Pintura látex para paredes interiores, 2 manos', 'm²', 2500, 1500, 4000, 15.00, 4600, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'IMPERMEABILIZACIÓN', 'Impermeabilización de superficie con membrana asfáltica', 'm²', 5500, 7000, 12500, 15.00, 14375, false, true),

-- FONTANERÍA/PLOMERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Suministro e instalación de inodoro de porcelana blanco', 'ud', 15000, 45000, 60000, 15.00, 69000, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Suministro e instalación de lavamanos con pedestal', 'ud', 12000, 35000, 47000, 15.00, 54050, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha con grifería cromada', 'ud', 10000, 28000, 38000, 15.00, 43700, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Suministro e instalación de fregadero de acero inoxidable', 'ud', 11000, 32000, 43000, 15.00, 49450, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GRIFERÍA LAVAMANOS', 'Suministro e instalación de grifería cromada para lavamanos', 'ud', 8000, 22000, 30000, 15.00, 34500, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC AGUA', 'Instalación de tubería PVC para agua potable 1/2"', 'm', 2500, 1800, 4300, 15.00, 4945, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC DESAGÜE', 'Instalación de tubería PVC para desagüe 4"', 'm', 3000, 2200, 5200, 15.00, 5980, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR ELÉCTRICO', 'Suministro e instalación de calentador eléctrico 50 litros', 'ud', 18000, 85000, 103000, 15.00, 118450, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Suministro e instalación de calentador de gas instantáneo', 'ud', 20000, 95000, 115000, 15.00, 132250, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'VÁLVULA PASO', 'Instalación de válvula de paso de bronce 1/2"', 'ud', 3500, 4500, 8000, 15.00, 9200, false, true),

-- CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera maciza con marco', 'ud', 25000, 65000, 90000, 15.00, 103500, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA TAMBOR', 'Suministro e instalación de puerta tipo tambor con marco', 'ud', 18000, 45000, 63000, 15.00, 72450, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio', 'm²', 35000, 45000, 80000, 15.00, 92000, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Fabricación e instalación de closet en melamina', 'm', 28000, 42000, 70000, 15.00, 80500, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLES COCINA', 'Fabricación e instalación de muebles de cocina en melamina', 'm', 32000, 48000, 80000, 15.00, 92000, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera h=10cm', 'm', 2200, 1800, 4000, 15.00, 4600, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO LAMINADO', 'Instalación de piso laminado con espuma niveladora', 'm²', 6500, 12000, 18500, 15.00, 21275, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CERRADURA PUERTA', 'Suministro e instalación de cerradura de pomo', 'ud', 4500, 12000, 16500, 15.00, 18975, false, true),

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con placa', 'ud', 4500, 3500, 8000, 15.00, 9200, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa', 'ud', 3800, 2800, 6600, 15.00, 7590, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Suministro e instalación de luminaria LED empotrable', 'ud', 5500, 15000, 20500, 15.00, 23575, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cable eléctrico calibre 12 en tubería', 'm', 1800, 1200, 3000, 15.00, 3450, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Suministro e instalación de tablero eléctrico 12 circuitos', 'ud', 35000, 85000, 120000, 15.00, 138000, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER TERMOMAGNÉTICO', 'Instalación de breaker termomagnético 20A', 'ud', 3500, 6500, 10000, 15.00, 11500, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TUBERÍA CONDUIT', 'Instalación de tubería conduit PVC 3/4"', 'm', 1500, 1000, 2500, 15.00, 2875, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CAJA ELÉCTRICA', 'Instalación de caja eléctrica rectangular', 'ud', 2000, 800, 2800, 15.00, 3220, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo', 'ud', 8000, 35000, 43000, 15.00, 49450, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE PUERTA', 'Suministro e instalación de timbre inalámbrico', 'ud', 4000, 8000, 12000, 15.00, 13800, false, true),

-- CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de aire acondicionado split 12000 BTU', 'ud', 45000, 180000, 225000, 15.00, 258750, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'EXTRACTOR BAÑO', 'Suministro e instalación de extractor de aire para baño', 'ud', 8000, 18000, 26000, 15.00, 29900, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMPANA EXTRACTORA', 'Suministro e instalación de campana extractora para cocina', 'ud', 12000, 55000, 67000, 15.00, 77050, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación de aluminio', 'ud', 3500, 4500, 8000, 15.00, 9200, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto flexible para ventilación', 'm', 3000, 2500, 5500, 15.00, 6325, false, true),

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra, incluye retiro de polvo y residuos', 'm²', 1500, 800, 2300, 15.00, 2645, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y marcos por ambos lados', 'm²', 2000, 500, 2500, 15.00, 2875, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_costarica pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
