-- República Dominicana - Precios completos adaptados
-- Moneda: Peso Dominicano (DOP)
-- Terminología: Plomería, Cerámica, Cielo raso, Zócalo, Repello, Contrapiso

DROP TABLE IF EXISTS price_master_republica_dominicana;

CREATE TABLE price_master_republica_dominicana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
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
  long_description TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM price_master_republica_dominicana;

-- DERRIBOS
INSERT INTO price_master_republica_dominicana (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de block o drywall, incluyendo mano de obra y retiro de escombros', 'm²', 420.00, 110.00, 530.00, 15.00, 609.50, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS PICADO', 'Picar piso existente de cerámica o concreto, incluye mano de obra y retiro', 'm²', 350.00, 75.00, 425.00, 15.00, 488.75, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CERÁMICA DEMOLICIÓN', 'Retirar cerámica de pared existente, incluye picado y limpieza', 'm²', 390.00, 95.00, 485.00, 15.00, 557.75, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTA DESMONTAJE', 'Desmontar puerta existente con marco, incluye retiro', 'ud', 780.00, 140.00, 920.00, 15.00, 1058.00, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANA DESMONTAJE', 'Desmontar ventana existente con marco de aluminio o madera', 'ud', 690.00, 110.00, 800.00, 15.00, 920.00, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIO DESMONTAJE', 'Desmontar inodoro, lavamanos o similar, incluye desconexión', 'ud', 600.00, 75.00, 675.00, 15.00, 776.25, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO RASO DEMOLICIÓN', 'Demoler cielo raso existente de cualquier material', 'm²', 295.00, 55.00, 350.00, 15.00, 402.50, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO RETIRO', 'Retirar zócalo existente de madera o cerámica', 'ml', 110.00, 18.00, 128.00, 15.00, 147.20, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLE COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes, incluye retiro', 'ml', 880.00, 165.00, 1045.00, 15.00, 1201.75, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA RETIRO', 'Retirar instalación eléctrica antigua, cables y cajas', 'ml', 260.00, 45.00, 305.00, 15.00, 350.75, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍA RETIRO', 'Retirar tubería de agua o desagüe existente', 'ml', 320.00, 55.00, 375.00, 15.00, 431.25, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBRO CARGA Y RETIRO', 'Cargar y retirar escombros a vertedero autorizado', 'm³', 1650.00, 410.00, 2060.00, 15.00, 2369.00, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOCK', 'Construcción de tabique con block de concreto 15x20x40 cm, incluye mortero', 'm²', 880.00, 625.00, 1505.00, 15.00, 1730.75, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Instalación de tabique de drywall con estructura metálica', 'm²', 780.00, 660.00, 1440.00, 15.00, 1656.00, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero cemento-arena, acabado fino', 'm²', 480.00, 260.00, 740.00, 15.00, 851.00, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO', 'Contrapiso de concreto para piso, espesor 8 cm, incluye malla', 'm²', 625.00, 535.00, 1160.00, 15.00, 1334.00, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PARED', 'Instalación de cerámica en pared 30x30 cm, incluye pegamento', 'm²', 690.00, 875.00, 1565.00, 15.00, 1799.75, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO CERÁMICA', 'Instalación de piso cerámico 40x40 cm, incluye pegamento', 'm²', 660.00, 810.00, 1470.00, 15.00, 1690.50, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica 10 cm altura', 'ml', 165.00, 110.00, 275.00, 15.00, 316.25, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'VENTANA INSTALACIÓN', 'Instalación de ventana de aluminio con vidrio', 'm²', 1150.00, 2625.00, 3775.00, 15.00, 4341.25, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PUERTA INSTALACIÓN', 'Instalación de puerta de madera con marco y chapa', 'ud', 1335.00, 3915.00, 5250.00, 15.00, 6037.50, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO RASO DRYWALL', 'Instalación de cielo raso de drywall con estructura', 'm²', 720.00, 600.00, 1320.00, 15.00, 1518.00, false, true),

-- PLOMERÍA
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro completo con accesorios', 'ud', 875.00, 3545.00, 4420.00, 15.00, 5083.00, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con grifería y desagüe', 'ud', 780.00, 2715.00, 3495.00, 15.00, 4019.25, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha completa con grifería', 'ud', 845.00, 2995.00, 3840.00, 15.00, 4416.00, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC para agua fría 1/2"', 'ml', 200.00, 140.00, 340.00, 15.00, 391.00, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC para agua caliente 1/2"', 'ml', 230.00, 200.00, 430.00, 15.00, 494.50, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC para desagüe 4"', 'ml', 260.00, 295.00, 555.00, 15.00, 638.25, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Instalación de calentador de gas de paso', 'ud', 1705.00, 6315.00, 8020.00, 15.00, 9223.00, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Instalación de fregadero de cocina con grifería', 'ud', 810.00, 2625.00, 3435.00, 15.00, 3950.25, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO', 'Instalación de llave de paso 1/2"', 'ud', 320.00, 260.00, 580.00, 15.00, 667.00, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TINACO INSTALACIÓN', 'Instalación de tinaco de agua con base y conexiones', 'ud', 1520.00, 4470.00, 5990.00, 15.00, 6888.50, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Fabricación e instalación de mueble bajo de cocina', 'ml', 1705.00, 3915.00, 5620.00, 15.00, 6463.00, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Fabricación e instalación de mueble alto de cocina', 'ml', 1520.00, 3545.00, 5065.00, 15.00, 5824.75, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET EMPOTRADO', 'Fabricación e instalación de closet empotrado con puertas', 'ml', 2715.00, 6315.00, 9030.00, 15.00, 10384.50, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera maciza', 'ud', 1150.00, 4470.00, 5620.00, 15.00, 6463.00, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera 10 cm', 'ml', 165.00, 200.00, 365.00, 15.00, 419.75, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ESTANTERÍA', 'Fabricación e instalación de estantería de madera', 'ml', 875.00, 1705.00, 2580.00, 15.00, 2967.00, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MARCO PUERTA', 'Instalación de marco de puerta de madera', 'ud', 690.00, 1150.00, 1840.00, 15.00, 2116.00, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REPISA FLOTANTE', 'Instalación de repisa flotante de madera', 'ml', 415.00, 780.00, 1195.00, 15.00, 1374.25, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con placa', 'ud', 320.00, 260.00, 580.00, 15.00, 667.00, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa', 'ud', 295.00, 200.00, 495.00, 15.00, 569.25, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA TECHO', 'Instalación de punto de luz en techo', 'ud', 385.00, 320.00, 705.00, 15.00, 810.75, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE ELÉCTRICO', 'Instalación de cable eléctrico calibre 12', 'ml', 110.00, 75.00, 185.00, 15.00, 212.75, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico 12 circuitos', 'ud', 1705.00, 3545.00, 5250.00, 15.00, 6037.50, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER', 'Instalación de breaker termomagnético', 'ud', 260.00, 415.00, 675.00, 15.00, 776.25, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Instalación de luminaria LED empotrable', 'ud', 350.00, 780.00, 1130.00, 15.00, 1299.50, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalación de ventilador de techo con luz', 'ud', 690.00, 2625.00, 3315.00, 15.00, 3812.25, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE', 'Instalación de timbre inalámbrico', 'ud', 295.00, 600.00, 895.00, 15.00, 1029.25, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALETA ELÉCTRICA', 'Instalación de canaleta para cables', 'ml', 140.00, 110.00, 250.00, 15.00, 287.50, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO', 'Instalación de aire acondicionado split', 'ud', 2625.00, 11835.00, 14460.00, 15.00, 16629.00, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Instalación de ventilador extractor de baño', 'ud', 505.00, 1150.00, 1655.00, 15.00, 1903.25, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR ELÉCTRICO', 'Instalación de calentador eléctrico de agua', 'ud', 875.00, 4470.00, 5345.00, 15.00, 6146.75, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TUBERÍA GAS', 'Instalación de tubería de cobre para gas', 'ml', 320.00, 415.00, 735.00, 15.00, 845.25, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación', 'ud', 230.00, 320.00, 550.00, 15.00, 632.50, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra', 'm²', 75.00, 45.00, 120.00, 15.00, 138.00, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y vidrios', 'm²', 110.00, 28.00, 138.00, 15.00, 158.70, false, true);
