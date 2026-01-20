-- Cuba - Precios completos adaptados
-- Moneda: Peso Cubano (CUP)
-- Terminología: Plomería, Baldosa, Falso techo, Zócalo, Repello, Contrapiso, Calentador

DROP TABLE IF EXISTS price_master_cuba;

CREATE TABLE price_master_cuba (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
  color TEXT,
  brand TEXT,
  model TEXT,
  user_id UUID REFERENCES auth.users(id),
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DERRIBOS
INSERT INTO price_master_cuba (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de mampostería, incluyendo mano de obra y retiro de escombros', 'm²', 180.00, 45.00, 225.00, 15.00, 258.75, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS PICADO', 'Picar piso existente de baldosa o concreto, incluye mano de obra y retiro', 'm²', 155.00, 32.00, 187.00, 15.00, 215.05, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'BALDOSA DEMOLICIÓN', 'Retirar baldosa de pared existente, incluye picado y limpieza', 'm²', 165.00, 38.00, 203.00, 15.00, 233.45, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTA DESMONTAJE', 'Desmontar puerta existente con marco, incluye retiro', 'ud', 325.00, 55.00, 380.00, 15.00, 437.00, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANA DESMONTAJE', 'Desmontar ventana existente con marco', 'ud', 285.00, 45.00, 330.00, 15.00, 379.50, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIO DESMONTAJE', 'Desmontar inodoro, lavamanos o similar', 'ud', 245.00, 28.00, 273.00, 15.00, 313.95, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'FALSO TECHO DEMOLICIÓN', 'Demoler falso techo existente', 'm²', 125.00, 22.00, 147.00, 15.00, 169.05, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZÓCALO RETIRO', 'Retirar zócalo existente', 'ml', 45.00, 8.00, 53.00, 15.00, 60.95, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLE COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes', 'ml', 365.00, 65.00, 430.00, 15.00, 494.50, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA RETIRO', 'Retirar instalación eléctrica antigua', 'ml', 105.00, 18.00, 123.00, 15.00, 141.45, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍA RETIRO', 'Retirar tubería existente', 'ml', 135.00, 22.00, 157.00, 15.00, 180.55, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBRO CARGA Y RETIRO', 'Cargar y retirar escombros', 'm³', 685.00, 165.00, 850.00, 15.00, 977.50, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOCK', 'Construcción de tabique con block de concreto', 'm²', 365.00, 255.00, 620.00, 15.00, 713.00, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REPELLO PAREDES', 'Repello de paredes con mortero cemento-arena', 'm²', 195.00, 105.00, 300.00, 15.00, 345.00, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO', 'Contrapiso de concreto para piso', 'm²', 255.00, 215.00, 470.00, 15.00, 540.50, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BALDOSA PARED', 'Instalación de baldosa en pared', 'm²', 285.00, 355.00, 640.00, 15.00, 736.00, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO BALDOSA', 'Instalación de piso de baldosa', 'm²', 275.00, 325.00, 600.00, 15.00, 690.00, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO BALDOSA', 'Instalación de zócalo de baldosa', 'ml', 68.00, 45.00, 113.00, 15.00, 129.95, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'VENTANA INSTALACIÓN', 'Instalación de ventana de aluminio', 'm²', 475.00, 1065.00, 1540.00, 15.00, 1771.00, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PUERTA INSTALACIÓN', 'Instalación de puerta de madera', 'ud', 545.00, 1585.00, 2130.00, 15.00, 2449.50, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FALSO TECHO', 'Instalación de falso techo', 'm²', 295.00, 245.00, 540.00, 15.00, 621.00, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA PAREDES', 'Pintura de paredes interiores', 'm²', 85.00, 45.00, 130.00, 15.00, 149.50, false, true),

-- PLOMERÍA
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro completo', 'ud', 365.00, 1435.00, 1800.00, 15.00, 2070.00, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con grifería', 'ud', 325.00, 1105.00, 1430.00, 15.00, 1644.50, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha completa', 'ud', 345.00, 1215.00, 1560.00, 15.00, 1794.00, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC agua fría', 'ml', 85.00, 55.00, 140.00, 15.00, 161.00, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería agua caliente', 'ml', 95.00, 82.00, 177.00, 15.00, 203.55, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC desagüe', 'ml', 105.00, 118.00, 223.00, 15.00, 256.45, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Instalación de calentador de gas', 'ud', 685.00, 2555.00, 3240.00, 15.00, 3726.00, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Instalación de fregadero de cocina', 'ud', 335.00, 1065.00, 1400.00, 15.00, 1610.00, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO', 'Instalación de llave de paso', 'ud', 135.00, 105.00, 240.00, 15.00, 276.00, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TANQUE AGUA', 'Instalación de tanque de agua', 'ud', 625.00, 1805.00, 2430.00, 15.00, 2794.50, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Fabricación e instalación de mueble bajo', 'ml', 685.00, 1585.00, 2270.00, 15.00, 2610.50, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Fabricación e instalación de mueble alto', 'ml', 625.00, 1435.00, 2060.00, 15.00, 2369.00, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET EMPOTRADO', 'Fabricación e instalación de closet', 'ml', 1105.00, 2555.00, 3660.00, 15.00, 4209.00, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta', 'ud', 475.00, 1805.00, 2280.00, 15.00, 2622.00, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera', 'ml', 68.00, 82.00, 150.00, 15.00, 172.50, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ESTANTERÍA', 'Fabricación e instalación de estantería', 'ml', 365.00, 685.00, 1050.00, 15.00, 1207.50, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MARCO PUERTA', 'Instalación de marco de puerta', 'ud', 285.00, 465.00, 750.00, 15.00, 862.50, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REPISA FLOTANTE', 'Instalación de repisa flotante', 'ml', 175.00, 315.00, 490.00, 15.00, 563.50, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble', 'ud', 135.00, 105.00, 240.00, 15.00, 276.00, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple', 'ud', 125.00, 82.00, 207.00, 15.00, 238.05, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA TECHO', 'Instalación de punto de luz en techo', 'ud', 165.00, 135.00, 300.00, 15.00, 345.00, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE ELÉCTRICO', 'Instalación de cable eléctrico', 'ml', 45.00, 32.00, 77.00, 15.00, 88.55, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico', 'ud', 685.00, 1435.00, 2120.00, 15.00, 2438.00, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER', 'Instalación de breaker', 'ud', 105.00, 165.00, 270.00, 15.00, 310.50, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LUMINARIA LED', 'Instalación de luminaria LED', 'ud', 145.00, 315.00, 460.00, 15.00, 529.00, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalación de ventilador de techo', 'ud', 285.00, 1065.00, 1350.00, 15.00, 1552.50, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE', 'Instalación de timbre', 'ud', 125.00, 245.00, 370.00, 15.00, 425.50, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALETA ELÉCTRICA', 'Instalación de canaleta para cables', 'ml', 55.00, 45.00, 100.00, 15.00, 115.00, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO', 'Instalación de aire acondicionado', 'ud', 1065.00, 4805.00, 5870.00, 15.00, 6750.50, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Instalación de ventilador extractor', 'ud', 205.00, 465.00, 670.00, 15.00, 770.50, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR ELÉCTRICO', 'Instalación de calentador eléctrico', 'ud', 365.00, 1805.00, 2170.00, 15.00, 2495.50, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TUBERÍA GAS', 'Instalación de tubería de gas', 'ml', 135.00, 165.00, 300.00, 15.00, 345.00, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla de ventilación', 'ud', 95.00, 135.00, 230.00, 15.00, 264.50, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra', 'm²', 32.00, 18.00, 50.00, 15.00, 57.50, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y vidrios', 'm²', 45.00, 12.00, 57.00, 15.00, 65.55, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_cuba pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.id
ORDER BY pc.id;
