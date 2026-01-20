DROP TABLE IF EXISTS price_master_ecuador CASCADE;

CREATE TABLE price_master_ecuador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2),
  material_cost DECIMAL(10,2),
  equipment_cost DECIMAL(10,2),
  other_cost DECIMAL(10,2),
  base_price DECIMAL(10,2) NOT NULL,
  margin_percentage DECIMAL(5,2) DEFAULT 15.00,
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

-- Ecuador: Dólar (USD) - Similar to Spain but slightly lower
INSERT INTO price_master_ecuador (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros', 'm²', 8.50, 2.50, 11.00, 15.00, 12.65, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de cerámica, incluyendo retiro', 'm²', 10.20, 3.40, 13.60, 15.00, 15.64, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DESMONTAJE', 'Desmontar puerta existente con marco, incluyendo retiro', 'ud', 17.00, 0.00, 17.00, 15.00, 19.55, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DESMONTAJE', 'Desmontar ventana existente con marco, incluyendo retiro', 'ud', 13.60, 0.00, 13.60, 15.00, 15.64, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DESMONTAJE', 'Desmontar sanitario (inodoro, lavamanos, etc.) existente', 'ud', 10.20, 0.00, 10.20, 15.00, 11.73, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CERÁMICA PARED DEMOLICIÓN', 'Picar cerámica de pared existente, incluyendo retiro', 'm²', 8.50, 2.50, 11.00, 15.00, 12.65, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO FALSO DEMOLICIÓN', 'Demoler cielo falso existente, incluyendo estructura y retiro', 'm²', 6.80, 1.70, 8.50, 15.00, 9.78, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA DESMONTAJE', 'Desmontar instalación eléctrica existente (cables, cajas, etc.)', 'm', 1.70, 0.00, 1.70, 15.00, 1.96, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLES COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes', 'm', 13.60, 0.00, 13.60, 15.00, 15.64, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS TRANSPORTE', 'Transporte de escombros a punto autorizado', 'm³', 25.50, 8.50, 34.00, 15.00, 39.10, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PARED LADRILLO DEMOLICIÓN', 'Demoler pared de ladrillo existente, incluyendo retiro', 'm²', 17.00, 5.10, 22.10, 15.00, 25.42, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Alquiler de contenedor para escombros (por día)', 'ud', 0.00, 34.00, 34.00, 15.00, 39.10, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PARED LADRILLO', 'Construcción de pared de ladrillo con mortero, incluyendo materiales', 'm²', 17.00, 25.50, 42.50, 15.00, 48.88, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO INTERIOR', 'Aplicación de enlucido en paredes interiores, acabado liso', 'm²', 10.20, 6.80, 17.00, 15.00, 19.55, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO EXTERIOR', 'Aplicación de enlucido en paredes exteriores, acabado rugoso', 'm²', 11.90, 8.50, 20.40, 15.00, 23.46, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO CONCRETO', 'Construcción de contrapiso de concreto armado, incluyendo encofrado', 'm²', 34.00, 42.50, 76.50, 15.00, 87.98, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO INSTALACIÓN', 'Instalación de zócalo de cerámica o madera', 'm', 3.40, 5.10, 8.50, 15.00, 9.78, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PISO', 'Instalación de cerámica en piso, incluyendo materiales y pegamento', 'm²', 13.60, 25.50, 39.10, 15.00, 44.97, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PARED', 'Instalación de cerámica en pared, incluyendo materiales y pegamento', 'm²', 15.30, 27.20, 42.50, 15.00, 48.88, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ESTUCO DECORATIVO', 'Aplicación de estuco decorativo en paredes', 'm²', 17.00, 13.60, 30.60, 15.00, 35.19, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'VENTANA INSTALACIÓN', 'Instalación de ventana de aluminio con vidrio', 'ud', 25.50, 85.00, 110.50, 15.00, 127.08, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PUERTA INSTALACIÓN', 'Instalación de puerta interior con marco', 'ud', 34.00, 102.00, 136.00, 15.00, 156.40, false, true),

-- PLOMERÍA
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro completo con accesorios', 'ud', 25.50, 85.00, 110.50, 15.00, 127.08, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con grifería', 'ud', 20.40, 68.00, 88.40, 15.00, 101.66, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha completa con grifería', 'ud', 27.20, 102.00, 129.20, 15.00, 148.58, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC INSTALACIÓN', 'Instalación de tubería PVC para agua, incluyendo materiales', 'm', 3.40, 5.10, 8.50, 15.00, 9.78, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA COBRE INSTALACIÓN', 'Instalación de tubería de cobre para agua caliente', 'm', 5.10, 10.20, 15.30, 15.00, 17.60, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALEFÓN GAS INSTALACIÓN', 'Instalación de calefón de gas con conexiones', 'ud', 42.50, 170.00, 212.50, 15.00, 244.38, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR ELÉCTRICO INSTALACIÓN', 'Instalación de calentador eléctrico con conexiones', 'ud', 34.00, 136.00, 170.00, 15.00, 195.50, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA INSTALACIÓN', 'Instalación de fregadero de cocina con grifería', 'ud', 25.50, 85.00, 110.50, 15.00, 127.08, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE INSTALACIÓN', 'Instalación de sistema de desagüe completo', 'm', 5.10, 6.80, 11.90, 15.00, 13.69, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO INSTALACIÓN', 'Instalación de llave de paso para agua', 'ud', 8.50, 17.00, 25.50, 15.00, 29.33, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA INSTALACIÓN', 'Instalación de puerta de madera maciza con herrajes', 'ud', 34.00, 136.00, 170.00, 15.00, 195.50, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ARMARIO EMPOTRADO', 'Construcción e instalación de armario empotrado', 'm', 51.00, 102.00, 153.00, 15.00, 175.95, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLES COCINA INSTALACIÓN', 'Instalación de muebles de cocina completos', 'm', 42.50, 170.00, 212.50, 15.00, 244.38, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ESTANTERÍA INSTALACIÓN', 'Instalación de estantería de madera', 'm', 17.00, 34.00, 51.00, 15.00, 58.65, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO FLOTANTE', 'Instalación de piso flotante, incluyendo materiales', 'm²', 17.00, 34.00, 51.00, 15.00, 58.65, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera', 'm', 3.40, 5.10, 8.50, 15.00, 9.78, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA CORREDERA', 'Instalación de puerta corredera con guías', 'ud', 42.50, 153.00, 195.50, 15.00, 224.83, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA MADERA', 'Instalación de ventana de madera con vidrio', 'ud', 34.00, 102.00, 136.00, 15.00, 156.40, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO LUZ INSTALACIÓN', 'Instalación de punto de luz con cableado', 'ud', 17.00, 13.60, 30.60, 15.00, 35.19, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE INSTALACIÓN', 'Instalación de tomacorriente con cableado', 'ud', 13.60, 10.20, 23.80, 15.00, 27.37, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR INSTALACIÓN', 'Instalación de interruptor con cableado', 'ud', 10.20, 6.80, 17.00, 15.00, 19.55, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CUADRO ELÉCTRICO', 'Instalación de cuadro eléctrico con protecciones', 'ud', 51.00, 102.00, 153.00, 15.00, 175.95, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cableado eléctrico por metro', 'm', 2.55, 3.40, 5.95, 15.00, 6.84, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED INSTALACIÓN', 'Instalación de lámpara LED con conexión', 'ud', 8.50, 25.50, 34.00, 15.00, 39.10, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'FOCO EMPOTRADO', 'Instalación de foco empotrado en techo', 'ud', 10.20, 17.00, 27.20, 15.00, 31.28, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INSTALACIÓN', 'Instalación de timbre con cableado', 'ud', 8.50, 13.60, 22.10, 15.00, 25.42, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalación de ventilador de techo con conexión', 'ud', 17.00, 51.00, 68.00, 15.00, 78.20, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA TV INSTALACIÓN', 'Instalación de toma de TV con cableado', 'ud', 13.60, 10.20, 23.80, 15.00, 27.37, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RADIADOR INSTALACIÓN', 'Instalación de radiador con conexiones', 'ud', 34.00, 102.00, 136.00, 15.00, 156.40, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALDERA GAS', 'Instalación de caldera de gas para calefacción', 'ud', 85.00, 340.00, 425.00, 15.00, 488.75, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'SUELO RADIANTE', 'Instalación de sistema de suelo radiante', 'm²', 25.50, 42.50, 68.00, 15.00, 78.20, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Instalación de aire acondicionado tipo split', 'ud', 51.00, 255.00, 306.00, 15.00, 351.90, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TERMOSTATO INSTALACIÓN', 'Instalación de termostato programable', 'ud', 13.60, 34.00, 47.60, 15.00, 54.74, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra', 'm²', 3.40, 1.70, 5.10, 15.00, 5.87, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y cristales', 'm²', 2.55, 0.85, 3.40, 15.00, 3.91, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  AVG(pm.final_price)::DECIMAL(10,2) as precio_promedio
FROM price_master_ecuador pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name
ORDER BY pc.name;
