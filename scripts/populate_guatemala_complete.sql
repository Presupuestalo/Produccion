-- Guatemala - Precios completos adaptados
-- Moneda: Quetzal (GTQ)
-- Terminología: Plomería, Azulejo, Cielo falso, Zócalo, Repello, Torta, Calentador

DROP TABLE IF EXISTS price_master_guatemala;

CREATE TABLE price_master_guatemala (
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

DELETE FROM price_master_guatemala;

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_guatemala (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de mampostería o drywall, incluyendo mano de obra y retiro de escombros', 'm²', 45.00, 12.00, 57.00, 15.00, 65.55, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS PICADO', 'Picar piso existente de cerámica o concreto, incluye mano de obra y retiro', 'm²', 38.00, 8.00, 46.00, 15.00, 52.90, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJO DEMOLICIÓN', 'Retirar azulejo de pared existente, incluye picado y limpieza', 'm²', 42.00, 10.00, 52.00, 15.00, 59.80, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTA DESMONTAJE', 'Desmontar puerta existente con marco, incluye retiro', 'ud', 85.00, 15.00, 100.00, 15.00, 115.00, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANA DESMONTAJE', 'Desmontar ventana existente con marco de aluminio o madera', 'ud', 75.00, 12.00, 87.00, 15.00, 100.05, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIO DESMONTAJE', 'Desmontar inodoro, lavamanos o similar, incluye desconexión', 'ud', 65.00, 8.00, 73.00, 15.00, 83.95, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Demoler cielo falso existente de cualquier material', 'm²', 32.00, 6.00, 38.00, 15.00, 43.70, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO RETIRO', 'Retirar zócalo existente de madera o cerámica', 'ml', 12.00, 2.00, 14.00, 15.00, 16.10, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLE COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes, incluye retiro', 'ml', 95.00, 18.00, 113.00, 15.00, 129.95, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA RETIRO', 'Retirar instalación eléctrica antigua, cables y cajas', 'ml', 28.00, 5.00, 33.00, 15.00, 37.95, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍA RETIRO', 'Retirar tubería de agua o desagüe existente', 'ml', 35.00, 6.00, 41.00, 15.00, 47.15, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBRO CARGA Y RETIRO', 'Cargar y retirar escombros a vertedero autorizado', 'm³', 180.00, 45.00, 225.00, 15.00, 258.75, false, true),

-- ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOCK', 'Construcción de tabique con block de concreto 15x20x40 cm, incluye mortero', 'm²', 95.00, 68.00, 163.00, 15.00, 187.45, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Instalación de tabique de drywall con estructura metálica', 'm²', 85.00, 72.00, 157.00, 15.00, 180.55, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero cemento-arena, acabado fino', 'm²', 52.00, 28.00, 80.00, 15.00, 92.00, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TORTA PISO', 'Torta de concreto para piso, espesor 8 cm, incluye malla', 'm²', 68.00, 58.00, 126.00, 15.00, 144.90, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO PARED', 'Instalación de azulejo en pared 30x30 cm, incluye pegamento', 'm²', 75.00, 95.00, 170.00, 15.00, 195.50, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO CERÁMICA', 'Instalación de piso cerámico 40x40 cm, incluye pegamento', 'm²', 72.00, 88.00, 160.00, 15.00, 184.00, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica 10 cm altura', 'ml', 18.00, 12.00, 30.00, 15.00, 34.50, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'VENTANA INSTALACIÓN', 'Instalación de ventana de aluminio con vidrio', 'm²', 125.00, 285.00, 410.00, 15.00, 471.50, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PUERTA INSTALACIÓN', 'Instalación de puerta de madera con marco y chapa', 'ud', 145.00, 425.00, 570.00, 15.00, 655.50, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO FALSO DRYWALL', 'Instalación de cielo falso de drywall con estructura', 'm²', 78.00, 65.00, 143.00, 15.00, 164.45, false, true),

-- PLOMERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro completo con accesorios', 'ud', 95.00, 385.00, 480.00, 15.00, 552.00, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con grifería y desagüe', 'ud', 85.00, 295.00, 380.00, 15.00, 437.00, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha completa con grifería', 'ud', 92.00, 325.00, 417.00, 15.00, 479.55, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC para agua fría 1/2"', 'ml', 22.00, 15.00, 37.00, 15.00, 42.55, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC para agua caliente 1/2"', 'ml', 25.00, 22.00, 47.00, 15.00, 54.05, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC para desagüe 4"', 'ml', 28.00, 32.00, 60.00, 15.00, 69.00, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Instalación de calentador de gas de paso', 'ud', 185.00, 685.00, 870.00, 15.00, 1000.50, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Instalación de fregadero de cocina con grifería', 'ud', 88.00, 285.00, 373.00, 15.00, 428.95, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO', 'Instalación de llave de paso 1/2"', 'ud', 35.00, 28.00, 63.00, 15.00, 72.45, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TINACO INSTALACIÓN', 'Instalación de tinaco de agua con base y conexiones', 'ud', 165.00, 485.00, 650.00, 15.00, 747.50, false, true),

-- CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Fabricación e instalación de mueble bajo de cocina', 'ml', 185.00, 425.00, 610.00, 15.00, 701.50, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Fabricación e instalación de mueble alto de cocina', 'ml', 165.00, 385.00, 550.00, 15.00, 632.50, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET EMPOTRADO', 'Fabricación e instalación de closet empotrado con puertas', 'ml', 295.00, 685.00, 980.00, 15.00, 1127.00, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta de madera maciza', 'ud', 125.00, 485.00, 610.00, 15.00, 701.50, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera 10 cm', 'ml', 18.00, 22.00, 40.00, 15.00, 46.00, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ESTANTERÍA', 'Fabricación e instalación de estantería de madera', 'ml', 95.00, 185.00, 280.00, 15.00, 322.00, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MARCO PUERTA', 'Instalación de marco de puerta de madera', 'ud', 75.00, 125.00, 200.00, 15.00, 230.00, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REPISA FLOTANTE', 'Instalación de repisa flotante de madera', 'ml', 45.00, 85.00, 130.00, 15.00, 149.50, false, true),

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con placa', 'ud', 35.00, 28.00, 63.00, 15.00, 72.45, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa', 'ud', 32.00, 22.00, 54.00, 15.00, 62.10, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA TECHO', 'Instalación de punto de luz en techo', 'ud', 42.00, 35.00, 77.00, 15.00, 88.55, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE ELÉCTRICO', 'Instalación de cable eléctrico calibre 12', 'ml', 12.00, 8.00, 20.00, 15.00, 23.00, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico 12 circuitos', 'ud', 185.00, 385.00, 570.00, 15.00, 655.50, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER', 'Instalación de breaker termomagnético', 'ud', 28.00, 45.00, 73.00, 15.00, 83.95, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Instalación de luminaria LED empotrable', 'ud', 38.00, 85.00, 123.00, 15.00, 141.45, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalación de ventilador de techo con luz', 'ud', 75.00, 285.00, 360.00, 15.00, 414.00, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE', 'Instalación de timbre inalámbrico', 'ud', 32.00, 65.00, 97.00, 15.00, 111.55, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALETA ELÉCTRICA', 'Instalación de canaleta para cables', 'ml', 15.00, 12.00, 27.00, 15.00, 31.05, false, true),

-- CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO', 'Instalación de aire acondicionado split', 'ud', 285.00, 1285.00, 1570.00, 15.00, 1805.50, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Instalación de ventilador extractor de baño', 'ud', 55.00, 125.00, 180.00, 15.00, 207.00, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR ELÉCTRICO', 'Instalación de calentador eléctrico de agua', 'ud', 95.00, 485.00, 580.00, 15.00, 667.00, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TUBERÍA GAS', 'Instalación de tubería de cobre para gas', 'ml', 35.00, 45.00, 80.00, 15.00, 92.00, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación', 'ud', 25.00, 35.00, 60.00, 15.00, 69.00, false, true),

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra', 'm²', 8.00, 5.00, 13.00, 15.00, 14.95, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y vidrios', 'm²', 12.00, 3.00, 15.00, 15.00, 17.25, false, true);

-- Resumen
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_guatemala pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.id
ORDER BY pc.id;
