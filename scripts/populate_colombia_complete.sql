DROP TABLE IF EXISTS price_master_colombia CASCADE;

CREATE TABLE price_master_colombia (
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

-- Colombia: Peso Colombiano (COP) - Multiplier ~4200x from EUR
INSERT INTO price_master_colombia (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros', 'm²', 42000, 12600, 54600, 15.00, 62790, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de baldosa o cerámica, incluyendo retiro', 'm²', 50400, 16800, 67200, 15.00, 77280, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DESMONTAJE', 'Desmontar puerta existente con marco, incluyendo retiro', 'ud', 84000, 0, 84000, 15.00, 96600, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DESMONTAJE', 'Desmontar ventana existente con marco, incluyendo retiro', 'ud', 67200, 0, 67200, 15.00, 77280, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DESMONTAJE', 'Desmontar sanitario (inodoro, lavamanos, etc.) existente', 'ud', 50400, 0, 50400, 15.00, 57960, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJOS DEMOLICIÓN', 'Picar azulejos de pared existentes, incluyendo retiro', 'm²', 42000, 12600, 54600, 15.00, 62790, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELO RASO DEMOLICIÓN', 'Demoler cielo raso existente, incluyendo estructura y retiro', 'm²', 33600, 8400, 42000, 15.00, 48300, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA DESMONTAJE', 'Desmontar instalación eléctrica existente (cables, cajas, etc.)', 'm', 8400, 0, 8400, 15.00, 9660, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLES COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes', 'm', 67200, 0, 67200, 15.00, 77280, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS TRANSPORTE', 'Transporte de escombros a punto autorizado', 'm³', 126000, 42000, 168000, 15.00, 193200, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PARED LADRILLO DEMOLICIÓN', 'Demoler pared de ladrillo existente, incluyendo retiro', 'm²', 84000, 25200, 109200, 15.00, 125580, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Alquiler de contenedor para escombros (por día)', 'ud', 0, 168000, 168000, 15.00, 193200, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PARED LADRILLO', 'Construcción de pared de ladrillo con mortero, incluyendo materiales', 'm²', 84000, 126000, 210000, 15.00, 241500, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PAÑETE INTERIOR', 'Aplicación de pañete en paredes interiores, acabado liso', 'm²', 50400, 33600, 84000, 15.00, 96600, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PAÑETE EXTERIOR', 'Aplicación de pañete en paredes exteriores, acabado rugoso', 'm²', 58800, 42000, 100800, 15.00, 115920, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PLACA CONCRETO', 'Construcción de placa de concreto armado, incluyendo encofrado', 'm²', 168000, 210000, 378000, 15.00, 434700, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'GUARDA ESCOBA INSTALACIÓN', 'Instalación de guarda escoba de cerámica o madera', 'm', 16800, 25200, 42000, 15.00, 48300, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BALDOSA PISO', 'Instalación de baldosa en piso, incluyendo materiales y pegamento', 'm²', 67200, 126000, 193200, 15.00, 222180, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BALDOSA PARED', 'Instalación de baldosa en pared, incluyendo materiales y pegamento', 'm²', 75600, 134400, 210000, 15.00, 241500, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ESTUCO DECORATIVO', 'Aplicación de estuco decorativo en paredes', 'm²', 84000, 67200, 151200, 15.00, 173880, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'VENTANA INSTALACIÓN', 'Instalación de ventana de aluminio con vidrio', 'ud', 126000, 420000, 546000, 15.00, 627900, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PUERTA INSTALACIÓN', 'Instalación de puerta interior con marco', 'ud', 168000, 504000, 672000, 15.00, 772800, false, true),

-- PLOMERÍA
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro completo con accesorios', 'ud', 126000, 420000, 546000, 15.00, 627900, false, true),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con grifería', 'ud', 100800, 336000, 436800, 15.00, 502320, false, true),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha completa con grifería', 'ud', 134400, 504000, 638400, 15.00, 734160, false, true),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC INSTALACIÓN', 'Instalación de tubería PVC para agua, incluyendo materiales', 'm', 16800, 25200, 42000, 15.00, 48300, false, true),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA COBRE INSTALACIÓN', 'Instalación de tubería de cobre para agua caliente', 'm', 25200, 50400, 75600, 15.00, 86940, false, true),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS INSTALACIÓN', 'Instalación de calentador de gas con conexiones', 'ud', 210000, 840000, 1050000, 15.00, 1207500, false, true),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR ELÉCTRICO INSTALACIÓN', 'Instalación de calentador eléctrico con conexiones', 'ud', 168000, 672000, 840000, 15.00, 966000, false, true),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA INSTALACIÓN', 'Instalación de fregadero de cocina con grifería', 'ud', 126000, 420000, 546000, 15.00, 627900, false, true),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE INSTALACIÓN', 'Instalación de sistema de desagüe completo', 'm', 25200, 33600, 58800, 15.00, 67620, false, true),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO INSTALACIÓN', 'Instalación de llave de paso para agua', 'ud', 42000, 84000, 126000, 15.00, 144900, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA INSTALACIÓN', 'Instalación de puerta de madera maciza con herrajes', 'ud', 168000, 672000, 840000, 15.00, 966000, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ARMARIO EMPOTRADO', 'Construcción e instalación de armario empotrado', 'm', 252000, 504000, 756000, 15.00, 869400, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLES COCINA INSTALACIÓN', 'Instalación de muebles de cocina completos', 'm', 210000, 840000, 1050000, 15.00, 1207500, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ESTANTERÍA INSTALACIÓN', 'Instalación de estantería de madera', 'm', 84000, 168000, 252000, 15.00, 289800, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'TARIMA FLOTANTE', 'Instalación de tarima flotante, incluyendo materiales', 'm²', 84000, 168000, 252000, 15.00, 289800, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera', 'm', 16800, 25200, 42000, 15.00, 48300, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA CORREDERA', 'Instalación de puerta corredera con guías', 'ud', 210000, 756000, 966000, 15.00, 1110900, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA MADERA', 'Instalación de ventana de madera con vidrio', 'ud', 168000, 504000, 672000, 15.00, 772800, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO LUZ INSTALACIÓN', 'Instalación de punto de luz con cableado', 'ud', 84000, 67200, 151200, 15.00, 173880, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE INSTALACIÓN', 'Instalación de tomacorriente con cableado', 'ud', 67200, 50400, 117600, 15.00, 135240, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR INSTALACIÓN', 'Instalación de interruptor con cableado', 'ud', 50400, 33600, 84000, 15.00, 96600, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CUADRO ELÉCTRICO', 'Instalación de cuadro eléctrico con protecciones', 'ud', 252000, 504000, 756000, 15.00, 869400, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cableado eléctrico por metro', 'm', 12600, 16800, 29400, 15.00, 33810, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED INSTALACIÓN', 'Instalación de lámpara LED con conexión', 'ud', 42000, 126000, 168000, 15.00, 193200, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'FOCO EMPOTRADO', 'Instalación de foco empotrado en techo', 'ud', 50400, 84000, 134400, 15.00, 154560, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INSTALACIÓN', 'Instalación de timbre con cableado', 'ud', 42000, 67200, 109200, 15.00, 125580, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalación de ventilador de techo con conexión', 'ud', 84000, 252000, 336000, 15.00, 386400, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA TV INSTALACIÓN', 'Instalación de toma de TV con cableado', 'ud', 67200, 50400, 117600, 15.00, 135240, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RADIADOR INSTALACIÓN', 'Instalación de radiador con conexiones', 'ud', 168000, 504000, 672000, 15.00, 772800, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALDERA GAS', 'Instalación de caldera de gas para calefacción', 'ud', 420000, 1680000, 2100000, 15.00, 2415000, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'SUELO RADIANTE', 'Instalación de sistema de suelo radiante', 'm²', 126000, 210000, 336000, 15.00, 386400, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Instalación de aire acondicionado tipo split', 'ud', 252000, 1260000, 1512000, 15.00, 1738800, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'TERMOSTATO INSTALACIÓN', 'Instalación de termostato programable', 'ud', 67200, 168000, 235200, 15.00, 270480, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra', 'm²', 16800, 8400, 25200, 15.00, 28980, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA VENTANAS', 'Limpieza de ventanas y cristales', 'm²', 12600, 4200, 16800, 15.00, 19320, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  AVG(pm.final_price)::DECIMAL(10,2) as precio_promedio
FROM price_master_colombia pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name
ORDER BY pc.name;
