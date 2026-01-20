-- Script completo para Argentina con terminología argentina y precios en Pesos Argentinos (ARS)
-- Incluye todas las columnas necesarias desde el inicio

-- Eliminar tabla si existe
DROP TABLE IF EXISTS price_master_argentina CASCADE;

-- Crear tabla con schema completo
CREATE TABLE price_master_argentina (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) NOT NULL,
  margin_percentage DECIMAL(5,2) DEFAULT 15.00,
  final_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  color TEXT,
  brand TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_price_master_argentina_category ON price_master_argentina(category_id);
CREATE INDEX idx_price_master_argentina_user ON price_master_argentina(user_id);
CREATE INDEX idx_price_master_argentina_active ON price_master_argentina(is_active);

-- Poblar con precios adaptados a Argentina (terminología argentina y precios en ARS)
-- Precios aproximados: 1 EUR ≈ 1100 ARS (ajustado por poder adquisitivo)

-- DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_argentina (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros a punto autorizado.', 'm²', 8500, 2500, 11000, 15.00, 12650, false, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES MAMPOSTERÍA DEMOLICIÓN', 'Demoler tabique de mampostería (ladrillo común o hueco), incluyendo mano de obra y retiro de escombros.', 'm²', 12000, 3500, 15500, 15.00, 17825, false, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS CERÁMICA PICADO', 'Picar piso de cerámica o porcelanato existente, incluyendo contrapiso y retiro de escombros.', 'm²', 9500, 2800, 12300, 15.00, 14145, false, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISOS MADERA DESMONTAJE', 'Desmontar piso de madera (parquet o entablonado), incluyendo retiro de material.', 'm²', 7500, 2000, 9500, 15.00, 10925, false, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'REVESTIMIENTO PARED PICADO', 'Picar revestimiento de pared (cerámica o azulejo), incluyendo revoque y retiro de escombros.', 'm²', 10500, 3000, 13500, 15.00, 15525, false, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CIELORRASO DEMOLICIÓN', 'Demoler cielorraso existente (yeso o durlock), incluyendo estructura y retiro de escombros.', 'm²', 8000, 2200, 10200, 15.00, 11730, false, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTA DESMONTAJE', 'Desmontar puerta existente con marco, incluyendo retiro de herrajes y material.', 'ud', 6500, 1500, 8000, 15.00, 9200, false, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANA DESMONTAJE', 'Desmontar ventana existente con marco, incluyendo retiro de vidrios y herrajes.', 'ud', 7000, 1800, 8800, 15.00, 10120, false, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIOS DESMONTAJE', 'Desmontar sanitarios (inodoro, bidet, lavamanos), incluyendo grifería y retiro.', 'ud', 5500, 1200, 6700, 15.00, 7705, false, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLE COCINA DESMONTAJE', 'Desmontar muebles de cocina, incluyendo mesada y retiro de material.', 'ml', 4500, 1000, 5500, 15.00, 6325, false, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'INSTALACIÓN ELÉCTRICA RETIRO', 'Retirar instalación eléctrica existente (cables, caños, cajas), incluyendo mano de obra.', 'm', 1800, 500, 2300, 15.00, 2645, false, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Alquiler de contenedor para escombros (incluye transporte y disposición final).', 'ud', 0, 85000, 85000, 15.00, 97750, false, true),

-- ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE LADRILLO HUECO', 'Construcción de tabique de ladrillo hueco de 12cm, con revoque grueso ambas caras.', 'm²', 18000, 12000, 30000, 15.00, 34500, false, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Construcción de tabique de drywall con estructura metálica y placa estándar.', 'm²', 15000, 10500, 25500, 15.00, 29325, false, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO HORMIGÓN', 'Ejecución de contrapiso de hormigón armado de 8cm de espesor, nivelado.', 'm²', 12000, 8500, 20500, 15.00, 23575, false, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE INTERIOR COMPLETO', 'Revoque completo interior (grueso y fino) sobre mampostería, terminación alisada.', 'm²', 14000, 9000, 23000, 15.00, 26450, false, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE EXTERIOR IMPERMEABLE', 'Revoque exterior impermeable con hidrófugo, terminación rayada o alisada.', 'm²', 16000, 11000, 27000, 15.00, 31050, false, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELORRASO YESO', 'Cielorraso suspendido de yeso con estructura metálica, terminación alisada.', 'm²', 13500, 9500, 23000, 15.00, 26450, false, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CIELORRASO DURLOCK', 'Cielorraso suspendido de durlock con estructura metálica y placa estándar.', 'm²', 12500, 8800, 21300, 15.00, 24495, false, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZÓCALO CERÁMICA', 'Colocación de zócalo de cerámica de 7-10cm de altura, con pegamento y pastina.', 'ml', 2800, 1800, 4600, 15.00, 5290, false, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'DINTEL HORMIGÓN', 'Ejecución de dintel de hormigón armado para vano de puerta o ventana.', 'ml', 8500, 6000, 14500, 15.00, 16675, false, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'MOCHETA REVOQUE', 'Revoque de mocheta (lateral de vano) con terminación alisada.', 'ml', 3500, 2200, 5700, 15.00, 6555, false, true),

-- FONTANERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INODORO INSTALACIÓN', 'Instalación de inodoro con mochila, incluyendo conexiones y accesorios.', 'ud', 18000, 95000, 113000, 15.00, 129950, false, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'BIDET INSTALACIÓN', 'Instalación de bidet con grifería monocomando, incluyendo conexiones.', 'ud', 16000, 75000, 91000, 15.00, 104650, false, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVAMANOS INSTALACIÓN', 'Instalación de lavamanos con pedestal y grifería, incluyendo desagüe.', 'ud', 15000, 65000, 80000, 15.00, 92000, false, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'PILETA COCINA INSTALACIÓN', 'Instalación de pileta de cocina de acero inoxidable con grifería y desagüe.', 'ud', 14000, 55000, 69000, 15.00, 79350, false, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCHA INSTALACIÓN', 'Instalación de ducha con grifería monocomando y duchador, incluyendo conexiones.', 'ud', 16500, 48000, 64500, 15.00, 74175, false, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'BAÑERA INSTALACIÓN', 'Instalación de bañera acrílica con grifería y desagüe, incluyendo conexiones.', 'ud', 28000, 125000, 153000, 15.00, 175950, false, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TERMOTANQUE ELÉCTRICO', 'Instalación de termotanque eléctrico de 50-80 litros, incluyendo conexiones.', 'ud', 22000, 145000, 167000, 15.00, 192050, false, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TERMOTANQUE GAS', 'Instalación de termotanque a gas de 50-80 litros, incluyendo conexión de gas.', 'ud', 25000, 165000, 190000, 15.00, 218500, false, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CAÑERÍA AGUA FRÍA', 'Instalación de cañería de agua fría (termofusión o PPR), incluyendo accesorios.', 'm', 2800, 1900, 4700, 15.00, 5405, false, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CAÑERÍA AGUA CALIENTE', 'Instalación de cañería de agua caliente (termofusión o PPR), incluyendo accesorios.', 'm', 3200, 2400, 5600, 15.00, 6440, false, true),

-- CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA PLACA INSTALACIÓN', 'Instalación de puerta placa con marco de madera, incluyendo herrajes y cerradura.', 'ud', 18000, 65000, 83000, 15.00, 95450, false, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA MACIZA', 'Instalación de puerta de madera maciza con marco, incluyendo herrajes y cerradura.', 'ud', 22000, 125000, 147000, 15.00, 169050, false, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Instalación de ventana de aluminio con vidrio simple, incluyendo herrajes.', 'm²', 28000, 85000, 113000, 15.00, 129950, false, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA PVC DVH', 'Instalación de ventana de PVC con doble vidriado hermético (DVH), incluyendo herrajes.', 'm²', 35000, 145000, 180000, 15.00, 207000, false, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PLACARD MELAMINA', 'Instalación de placard de melamina con puertas corredizas, estantes y barral.', 'ml', 45000, 95000, 140000, 15.00, 161000, false, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Instalación de mueble bajo de cocina de melamina con mesada de granito.', 'ml', 38000, 85000, 123000, 15.00, 141450, false, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Instalación de mueble alto de cocina de melamina con puertas.', 'ml', 28000, 55000, 83000, 15.00, 95450, false, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ZÓCALO MADERA', 'Colocación de zócalo de madera de 7-10cm de altura, con clavos y masilla.', 'ml', 1800, 1200, 3000, 15.00, 3450, false, true),

-- ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA SIMPLE INSTALACIÓN', 'Instalación de tomacorriente simple con caño y cable, incluyendo caja y tapa.', 'ud', 4500, 2800, 7300, 15.00, 8395, false, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DOBLE INSTALACIÓN', 'Instalación de tomacorriente doble con caño y cable, incluyendo caja y tapa.', 'ud', 5200, 3500, 8700, 15.00, 10005, false, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR SIMPLE', 'Instalación de interruptor simple con caño y cable, incluyendo caja y tapa.', 'ud', 4200, 2500, 6700, 15.00, 7705, false, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INTERRUPTOR DOBLE', 'Instalación de interruptor doble con caño y cable, incluyendo caja y tapa.', 'ud', 4800, 3200, 8000, 15.00, 9200, false, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO LUZ TECHO', 'Instalación de punto de luz en techo con caño y cable, incluyendo caja.', 'ud', 5500, 3800, 9300, 15.00, 10695, false, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ARTEFACTO LED EMPOTRAR', 'Instalación de artefacto LED empotrable en cielorraso, incluyendo conexión.', 'ud', 3500, 8500, 12000, 15.00, 13800, false, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO', 'Instalación de tablero eléctrico con térmicas y disyuntor, incluyendo conexiones.', 'ud', 28000, 95000, 123000, 15.00, 141450, false, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLEADO GENERAL', 'Instalación de cableado general con caños de PVC, incluyendo cajas de paso.', 'm', 1500, 1100, 2600, 15.00, 2990, false, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA TV/DATOS', 'Instalación de toma para TV o datos con caño y cable, incluyendo caja y tapa.', 'ud', 4800, 3200, 8000, 15.00, 9200, false, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INSTALACIÓN', 'Instalación de timbre con pulsador y cableado, incluyendo conexiones.', 'ud', 3500, 4500, 8000, 15.00, 9200, false, true),

-- CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
('06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RADIADOR INSTALACIÓN', 'Instalación de radiador de chapa con válvulas y conexiones, incluyendo fijación.', 'ud', 18000, 75000, 93000, 15.00, 106950, false, true),
('06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALDERA MURAL GAS', 'Instalación de caldera mural a gas para calefacción, incluyendo conexiones.', 'ud', 45000, 285000, 330000, 15.00, 379500, false, true),
('06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'PISO RADIANTE', 'Instalación de sistema de piso radiante por m², incluyendo cañerías y colector.', 'm²', 12000, 18000, 30000, 15.00, 34500, false, true),
('06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'SPLIT FRÍO/CALOR', 'Instalación de equipo split frío/calor de 2500-3000 frigorías, incluyendo conexiones.', 'ud', 28000, 185000, 213000, 15.00, 244950, false, true),
('06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'ESTUFA TIRO BALANCEADO', 'Instalación de estufa de tiro balanceado a gas, incluyendo salida de gases.', 'ud', 22000, 125000, 147000, 15.00, 169050, false, true),

-- LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL OBRA', 'Limpieza final de obra completa, incluyendo retiro de restos y lavado de superficies.', 'm²', 1800, 1200, 3000, 15.00, 3450, false, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA DIARIA OBRA', 'Limpieza diaria durante la obra, retiro de escombros y orden general.', 'día', 15000, 5000, 20000, 15.00, 23000, false, true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_price_master_argentina_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_price_master_argentina_updated_at
BEFORE UPDATE ON price_master_argentina
FOR EACH ROW
EXECUTE FUNCTION update_price_master_argentina_updated_at();

-- Verificar resultados
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_argentina pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
