DROP TABLE IF EXISTS price_master_paraguay;

CREATE TABLE price_master_paraguay (
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

-- Paraguay: Guaraní (PYG), ~7000 PYG = 1 USD
-- Terminología: Plomería, Cerámica, Cielorraso, Zócalo, Revoque, Contrapiso, Calentador, Lavamanos, Tomacorriente

INSERT INTO price_master_paraguay (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES

-- DERRIBOS
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DEMOLICIÓN', 'Demoler tabique existente de ladrillo o bloque, con retiro de escombros', 'm²', 35000, 10000, 45000, 15.00, 51750, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS DEMOLICIÓN', 'Picar piso existente de cerámica incluyendo mortero base', 'm²', 42000, 8000, 50000, 15.00, 57500, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTAS DESMONTAJE', 'Desmontar puerta con marco, conservando elementos', 'ud', 56000, 0, 56000, 15.00, 64400, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANAS DESMONTAJE', 'Desmontar ventana con marco de aluminio', 'ud', 49000, 0, 49000, 15.00, 56350, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DESMONTAJE', 'Desmontar inodoro, lavamanos y accesorios', 'ud', 42000, 0, 42000, 15.00, 48300, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CERÁMICA PARED DEMOLICIÓN', 'Picar cerámica de pared en baños o cocinas', 'm²', 39000, 7000, 46000, 15.00, 52900, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELORRASO DEMOLICIÓN', 'Demoler cielorraso de yeso con estructura', 'm²', 28000, 5000, 33000, 15.00, 37950, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIONES ELÉCTRICAS DESMONTAJE', 'Desmontar instalación eléctrica, cables y cajas', 'm', 8400, 0, 8400, 15.00, 9660, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TUBERÍAS DESMONTAJE', 'Desmontar tuberías de agua o desagüe', 'm', 11200, 0, 11200, 15.00, 12880, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBROS RETIRO', 'Carga y transporte de escombros a vertedero', 'm³', 84000, 42000, 126000, 15.00, 144900, false, true),

-- ALBAÑILERÍA
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES LADRILLO', 'Construcción de tabique de ladrillo hueco de 15cm', 'm²', 56000, 50000, 106000, 15.00, 121900, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PAREDES', 'Revoque de paredes con mortero de cemento, acabado liso', 'm²', 33600, 22400, 56000, 15.00, 64400, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO HORMIGÓN', 'Contrapiso de hormigón de 10cm con malla', 'm²', 50400, 61600, 112000, 15.00, 128800, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PISO', 'Colocación de cerámica de piso de 40x40cm', 'm²', 42000, 78400, 120400, 15.00, 138460, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CERÁMICA PARED', 'Colocación de cerámica de pared de 30x30cm', 'm²', 50400, 70000, 120400, 15.00, 138460, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Instalación de zócalo de cerámica de 10cm', 'm', 9800, 7000, 16800, 15.00, 19320, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELORRASO YESO', 'Instalación de cielorraso de yeso con estructura', 'm²', 56000, 50400, 106400, 15.00, 122360, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA INTERIOR', 'Pintura interior con látex acrílico, dos manos', 'm²', 16800, 11200, 28000, 15.00, 32200, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA EXTERIOR', 'Pintura exterior con acrílica resistente', 'm²', 22400, 16800, 39200, 15.00, 45080, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'IMPERMEABILIZACIÓN', 'Impermeabilización de losa con membrana', 'm²', 42000, 56000, 98000, 15.00, 112700, false, true),

-- PLOMERÍA
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA FRÍA', 'Instalación de tubería PVC agua fría 1/2"', 'm', 14000, 8400, 22400, 15.00, 25760, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA AGUA CALIENTE', 'Instalación de tubería CPVC agua caliente 1/2"', 'm', 16800, 12600, 29400, 15.00, 33810, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA DESAGÜE', 'Instalación de tubería PVC desagüe 4"', 'm', 19600, 14000, 33600, 15.00, 38640, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Suministro e instalación de inodoro con accesorios', 'ud', 70000, 504000, 574000, 15.00, 660100, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Suministro e instalación de lavamanos con grifería', 'ud', 56000, 336000, 392000, 15.00, 450800, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha con grifería cromada', 'ud', 50400, 224000, 274400, 15.00, 315560, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO COCINA', 'Suministro e instalación de fregadero acero inoxidable', 'ud', 61600, 392000, 453600, 15.00, 521640, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Suministro e instalación de calentador a gas 40L', 'ud', 112000, 1260000, 1372000, 15.00, 1577800, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO', 'Instalación de llave de paso 1/2"', 'ud', 11200, 22400, 33600, 15.00, 38640, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DESAGÜE INSTALACIÓN', 'Instalación de sifón y desagüe', 'ud', 16800, 28000, 44800, 15.00, 51520, false, true),

-- CARPINTERÍA
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA', 'Suministro e instalación de puerta madera maciza', 'ud', 112000, 784000, 896000, 15.00, 1030400, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA PLACA', 'Suministro e instalación de puerta placa con marco', 'ud', 84000, 504000, 588000, 15.00, 676200, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana aluminio con vidrio', 'm²', 98000, 182000, 280000, 15.00, 322000, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PLACARD MELAMINA', 'Fabricación e instalación de placard melamina', 'm²', 112000, 224000, 336000, 15.00, 386400, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA', 'Fabricación e instalación de mueble bajo cocina', 'm', 98000, 196000, 294000, 15.00, 338100, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalación de zócalo de madera 10cm', 'm', 8400, 11200, 19600, 15.00, 22540, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA CORREDERA', 'Suministro e instalación de puerta corredera', 'ud', 126000, 896000, 1022000, 15.00, 1175300, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CERRADURA INSTALACIÓN', 'Instalación de cerradura de pomo', 'ud', 22400, 70000, 92400, 15.00, 106260, false, true),

-- ELECTRICIDAD
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalación de cable calibre 12 AWG', 'm', 7000, 5600, 12600, 15.00, 14490, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTE DOBLE', 'Instalación de tomacorriente doble con placa', 'ud', 16800, 22400, 39200, 15.00, 45080, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con placa', 'ud', 14000, 16800, 30800, 15.00, 35420, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED', 'Suministro e instalación de lámpara LED techo', 'ud', 22400, 84000, 106400, 15.00, 122360, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PANEL ELÉCTRICO', 'Instalación de panel eléctrico 12 circuitos', 'ud', 140000, 504000, 644000, 15.00, 740600, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BREAKER INSTALACIÓN', 'Instalación de breaker termomagnético 20A', 'ud', 11200, 33600, 44800, 15.00, 51520, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TUBERÍA CONDUIT', 'Instalación de tubería conduit PVC 3/4"', 'm', 5600, 4200, 9800, 15.00, 11270, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CAJA ELÉCTRICA', 'Instalación de caja eléctrica rectangular', 'ud', 8400, 7000, 15400, 15.00, 17710, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador con luz', 'ud', 42000, 224000, 266000, 15.00, 305900, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INSTALACIÓN', 'Instalación de timbre inalámbrico', 'ud', 16800, 56000, 72800, 15.00, 83720, false, true),

-- CALEFACCIÓN
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'AIRE ACONDICIONADO SPLIT', 'Suministro e instalación de AC split 12000 BTU', 'ud', 168000, 1540000, 1708000, 15.00, 1964200, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'VENTILADOR EXTRACTOR', 'Instalación de extractor para baño', 'ud', 28000, 98000, 126000, 15.00, 144900, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'REJILLA VENTILACIÓN', 'Instalación de rejilla ventilación aluminio', 'ud', 11200, 22400, 33600, 15.00, 38640, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'DUCTO VENTILACIÓN', 'Instalación de ducto flexible ventilación', 'm', 14000, 16800, 30800, 15.00, 35420, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALENTADOR ELÉCTRICO', 'Suministro e instalación de calentador eléctrico 50L', 'ud', 84000, 980000, 1064000, 15.00, 1223600, false, true),

-- LIMPIEZA
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa de obra terminada', 'm²', 4200, 2800, 7000, 15.00, 8050, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA ESCOMBROS', 'Limpieza y barrido de escombros', 'm²', 2240, 1400, 3640, 15.00, 4186, false, true);

SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmp.final_price) as precio_minimo,
  MAX(pmp.final_price) as precio_maximo,
  ROUND(AVG(pmp.final_price), 2) as precio_promedio
FROM price_master_paraguay pmp
JOIN price_categories pc ON pmp.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
