-- Crear tabla de precios para Venezuela con schema completo
DROP TABLE IF EXISTS price_master_venezuela CASCADE;

CREATE TABLE price_master_venezuela (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES price_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  
  -- Costos base
  material_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  
  -- Márgenes y precio final
  profit_margin DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  
  -- Campos específicos para materiales
  color TEXT,
  brand TEXT,
  model TEXT,
  
  -- Metadatos
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_price_master_venezuela_category ON price_master_venezuela(category_id);
CREATE INDEX idx_price_master_venezuela_code ON price_master_venezuela(code);
CREATE INDEX idx_price_master_venezuela_user ON price_master_venezuela(user_id);
CREATE INDEX idx_price_master_venezuela_active ON price_master_venezuela(is_active);

-- Habilitar RLS
ALTER TABLE price_master_venezuela ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver precios base y propios venezuela"
  ON price_master_venezuela FOR SELECT
  USING (is_custom = false OR (is_custom = true AND user_id = auth.uid()));

CREATE POLICY "Usuarios pueden crear precios personalizados venezuela"
  ON price_master_venezuela FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Usuarios pueden editar sus precios personalizados venezuela"
  ON price_master_venezuela FOR UPDATE
  USING (is_custom = true AND user_id = auth.uid())
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus precios personalizados venezuela"
  ON price_master_venezuela FOR DELETE
  USING (is_custom = true AND user_id = auth.uid());

-- Poblar con precios adaptados a Venezuela (terminología venezolana y precios en Bolívares)

-- DERRIBOS (12 conceptos)
INSERT INTO price_master_venezuela (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, profit_margin, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros a punto autorizado.', 'm²', 25, 8, 33, 15.00, 38, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO CERÁMICA PAREDES', 'Picar revestimiento cerámico en paredes, incluyendo mano de obra y retiro de escombros.', 'm²', 22, 6, 28, 15.00, 32, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS CERÁMICA', 'Picar piso cerámico existente, incluyendo mano de obra y retiro de escombros.', 'm²', 35, 8, 43, 15.00, 49, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO CIELO RASO', 'Retirar cielo raso existente, incluyendo estructura y limpieza.', 'm²', 22, 6, 28, 15.00, 32, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retirar molduras decorativas de techo o paredes.', 'ml', 2.5, 0.5, 3, 15.00, 3.5, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO PISO LAMINADO', 'Retirar piso laminado y listones de madera.', 'm²', 14, 4, 18, 15.00, 21, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO ZÓCALO MADERA', 'Retirar zócalo o guarda escoba de madera.', 'ml', 4, 1, 5, 15.00, 6, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN MESÓN COCINA', 'Demoler mesón de cocina existente, incluyendo retiro.', 'ml', 35, 10, 45, 15.00, 52, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO SANITARIOS', 'Retirar sanitarios (inodoro, lavamanos) existentes.', 'ud', 28, 7, 35, 15.00, 40, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO PUERTAS', 'Retirar puerta existente con marco.', 'ud', 18, 5, 23, 15.00, 26, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO VENTANAS', 'Retirar ventana existente con marco.', 'ud', 22, 6, 28, 15.00, 32, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN TABIQUE BLOQUES', 'Demoler tabique de bloques de concreto, incluyendo retiro de escombros.', 'm²', 850, 150, 1000, 15.00, 1150, false, true),

-- ALBAÑILERÍA (10 conceptos)
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FRISO INTERIOR PAREDES', 'Aplicar friso liso en paredes interiores, incluyendo materiales y mano de obra.', 'm²', 35, 28, 63, 15.00, 72, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FRISO EXTERIOR PAREDES', 'Aplicar friso texturizado en paredes exteriores, resistente a intemperie.', 'm²', 42, 35, 77, 15.00, 89, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PLATABANDA CONCRETO', 'Construir platabanda de concreto armado, incluyendo encofrado y materiales.', 'm²', 95, 85, 180, 15.00, 207, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOQUES 10CM', 'Construir tabique de bloques de concreto de 10cm, incluyendo materiales.', 'm²', 55, 45, 100, 15.00, 115, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOQUES 15CM', 'Construir tabique de bloques de concreto de 15cm, incluyendo materiales.', 'm²', 65, 55, 120, 15.00, 138, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO CERÁMICA ESTÁNDAR', 'Instalar piso cerámico estándar 40x40cm, incluyendo pegamento y fragüe.', 'm²', 45, 85, 130, 15.00, 150, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO CERÁMICA PREMIUM', 'Instalar piso cerámico premium 60x60cm, incluyendo materiales.', 'm²', 55, 145, 200, 15.00, 230, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVESTIMIENTO CERÁMICA BAÑO', 'Revestir paredes de baño con cerámica, incluyendo materiales y mano de obra.', 'm²', 48, 92, 140, 15.00, 161, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'MESÓN GRANITO COCINA', 'Instalar mesón de cocina en granito natural, incluyendo cortes y pulido.', 'ml', 280, 520, 800, 15.00, 920, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELO RASO DRYWALL', 'Instalar cielo raso en drywall con estructura metálica.', 'm²', 42, 38, 80, 15.00, 92, false, true),

-- FONTANERÍA/PLOMERÍA (10 conceptos)
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO', 'Instalar inodoro completo con accesorios y conexiones.', 'ud', 45, 280, 325, 15.00, 374, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN LAVAMANOS', 'Instalar lavamanos con grifería y sifón cromado.', 'ud', 38, 180, 218, 15.00, 251, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DUCHA', 'Instalar ducha completa con grifería mezcladora.', 'ud', 42, 220, 262, 15.00, 301, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN TINA BAÑO', 'Instalar tina de baño con grifería y desagüe.', 'ud', 85, 650, 735, 15.00, 845, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GRIFERÍA COCINA', 'Instalar grifería de cocina tipo cuello de ganso.', 'ud', 28, 120, 148, 15.00, 170, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR GAS', 'Instalar calentador de agua a gas, incluyendo conexiones.', 'ud', 95, 850, 945, 15.00, 1087, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CALENTADOR ELÉCTRICO', 'Instalar calentador de agua eléctrico 50 litros.', 'ud', 55, 420, 475, 15.00, 546, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC AGUA', 'Instalar tubería PVC para agua potable, incluyendo accesorios.', 'ml', 8, 12, 20, 15.00, 23, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC DESAGÜE', 'Instalar tubería PVC para desagüe, incluyendo accesorios.', 'ml', 9, 14, 23, 15.00, 26, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TANQUE AGUA ELEVADO', 'Instalar tanque de agua elevado 1000 litros con estructura.', 'ud', 180, 520, 700, 15.00, 805, false, true),

-- CARPINTERÍA (8 conceptos)
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA MACIZA', 'Suministrar e instalar puerta de madera maciza con marco y bisagras.', 'ud', 85, 420, 505, 15.00, 581, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MDF ENCHAPADA', 'Suministrar e instalar puerta MDF enchapada con marco.', 'ud', 65, 280, 345, 15.00, 397, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministrar e instalar ventana de aluminio con vidrio.', 'm²', 95, 180, 275, 15.00, 316, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Fabricar e instalar closet en melamina con puertas corredizas.', 'ml', 180, 320, 500, 15.00, 575, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Fabricar e instalar mueble bajo de cocina en melamina.', 'ml', 120, 220, 340, 15.00, 391, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Fabricar e instalar mueble alto de cocina en melamina.', 'ml', 95, 180, 275, 15.00, 316, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Instalar zócalo o guarda escoba de madera.', 'ml', 8, 12, 20, 15.00, 23, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PISO LAMINADO', 'Instalar piso laminado tipo madera con espuma niveladora.', 'm²', 28, 65, 93, 15.00, 107, false, true),

-- ELECTRICIDAD (10 conceptos)
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO TOMACORRIENTE', 'Instalar punto de tomacorriente doble con cableado.', 'ud', 18, 22, 40, 15.00, 46, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO ILUMINACIÓN', 'Instalar punto de iluminación con interruptor y cableado.', 'ud', 22, 28, 50, 15.00, 58, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED EMPOTRADA', 'Instalar lámpara LED empotrada en cielo raso.', 'ud', 15, 45, 60, 15.00, 69, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA DECORATIVA', 'Instalar lámpara decorativa colgante.', 'ud', 22, 85, 107, 15.00, 123, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalar interruptor simple con placa decorativa.', 'ud', 12, 15, 27, 15.00, 31, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR DOBLE', 'Instalar interruptor doble con placa decorativa.', 'ud', 14, 18, 32, 15.00, 37, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO 12 CIRCUITOS', 'Instalar tablero eléctrico de 12 circuitos con breakers.', 'ud', 85, 280, 365, 15.00, 420, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO ELÉCTRICO', 'Instalar cableado eléctrico en tubería PVC.', 'ml', 5, 8, 13, 15.00, 15, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'AIRE ACONDICIONADO SPLIT', 'Instalar aire acondicionado tipo split 12000 BTU.', 'ud', 120, 1200, 1320, 15.00, 1518, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Instalar ventilador de techo con control remoto.', 'ud', 35, 95, 130, 15.00, 150, false, true),

-- CALEFACCIÓN (5 conceptos)
('06-CA-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'SPLIT FRÍO/CALOR 12000BTU', 'Instalar equipo split frío/calor 12000 BTU con tubería.', 'ud', 140, 1400, 1540, 15.00, 1771, false, true),
('06-CA-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'SPLIT FRÍO/CALOR 18000BTU', 'Instalar equipo split frío/calor 18000 BTU con tubería.', 'ud', 165, 1800, 1965, 15.00, 2260, false, true),
('06-CA-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACTOR ELÉCTRICO', 'Instalar calefactor eléctrico de pared 2000W.', 'ud', 28, 180, 208, 15.00, 239, false, true),
('06-CA-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'EXTRACTOR BAÑO', 'Instalar extractor de aire para baño.', 'ud', 22, 65, 87, 15.00, 100, false, true),
('06-CA-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMPANA EXTRACTORA COCINA', 'Instalar campana extractora de cocina con ducto.', 'ud', 55, 320, 375, 15.00, 431, false, true),

-- LIMPIEZA (2 conceptos)
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza completa final de obra, incluyendo ventanas y pisos.', 'm²', 3, 2, 5, 15.00, 6, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'RETIRO ESCOMBROS', 'Retiro y transporte de escombros a vertedero autorizado.', 'm³', 35, 45, 80, 15.00, 92, false, true);

-- Consulta de verificación
SELECT 
  c.name as categoria,
  COUNT(*) as total_precios,
  MIN(p.final_price) as precio_minimo,
  MAX(p.final_price) as precio_maximo,
  ROUND(AVG(p.final_price), 2) as precio_promedio
FROM price_master_venezuela p
JOIN price_categories c ON p.category_id = c.id
GROUP BY c.name, c.display_order
ORDER BY c.display_order;
