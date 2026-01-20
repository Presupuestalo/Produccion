DROP TABLE IF EXISTS price_master_mexico CASCADE;

CREATE TABLE price_master_mexico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  material_cost NUMERIC(10,2) DEFAULT 0,
  equipment_cost NUMERIC(10,2) DEFAULT 0,
  other_cost NUMERIC(10,2) DEFAULT 0,
  base_price NUMERIC(10,2) NOT NULL,
  margin_percentage NUMERIC(5,2) DEFAULT 15.00,
  final_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  color TEXT,
  brand TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- MÉXICO - Precios en Pesos Mexicanos (MXN)
-- Terminología: Plomería, Azulejo, Plafón, Zoclo, Aplanado, Firme, Boiler, Lavabo, Contacto

INSERT INTO price_master_mexico (code, category_id, subcategory, description, unit, labor_cost, material_cost, base_price, margin_percentage, final_price, is_custom, is_active) VALUES
-- DERRIBOS (12 conceptos)
('MX-01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y retiro de escombros.', 'm²', 80, 20, 100, 15.00, 115, false, true),
('MX-01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES LADRILLO DEMOLICIÓN', 'Demoler tabique de ladrillo o block, con retiro de escombros a punto autorizado.', 'm²', 120, 30, 150, 15.00, 172.50, false, true),
('MX-01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PISO CERÁMICA DEMOLICIÓN', 'Levantar piso de cerámica o azulejo existente, incluyendo retiro de escombros.', 'm²', 90, 25, 115, 15.00, 132.25, false, true),
('MX-01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PLAFÓN DEMOLICIÓN', 'Demoler plafón existente de yeso o drywall, con retiro de material.', 'm²', 70, 15, 85, 15.00, 97.75, false, true),
('MX-01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PUERTA DESMONTAJE', 'Desmontar puerta existente con marco, incluyendo retiro.', 'ud', 150, 0, 150, 15.00, 172.50, false, true),
('MX-01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'VENTANA DESMONTAJE', 'Desmontar ventana existente con marco, incluyendo retiro.', 'ud', 180, 0, 180, 15.00, 207, false, true),
('MX-01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'SANITARIO DESMONTAJE', 'Desmontar sanitario (WC, lavabo o regadera) existente.', 'ud', 200, 0, 200, 15.00, 230, false, true),
('MX-01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'MUEBLE COCINA DESMONTAJE', 'Desmontar muebles de cocina existentes, con retiro.', 'ml', 100, 0, 100, 15.00, 115, false, true),
('MX-01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'FIRME DEMOLICIÓN', 'Demoler firme de concreto existente, con retiro de escombros.', 'm²', 200, 50, 250, 15.00, 287.50, false, true),
('MX-01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'AZULEJO PARED DEMOLICIÓN', 'Quitar azulejo de pared existente, incluyendo retiro.', 'm²', 85, 20, 105, 15.00, 120.75, false, true),
('MX-01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ZOCLO DESMONTAJE', 'Desmontar zoclo o guarda polvo existente.', 'ml', 25, 0, 25, 15.00, 28.75, false, true),
('MX-01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ESCOMBRO CARGA Y RETIRO', 'Carga y retiro de escombros a tiradero autorizado.', 'm³', 350, 150, 500, 15.00, 575, false, true),

-- ALBAÑILERÍA (10 conceptos)
('MX-02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE BLOCK 15CM', 'Construcción de muro de block de 15cm, con aplanado ambas caras.', 'm²', 180, 120, 300, 15.00, 345, false, true),
('MX-02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL', 'Construcción de tabique de drywall con estructura metálica.', 'm²', 150, 180, 330, 15.00, 379.50, false, true),
('MX-02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FIRME CONCRETO 10CM', 'Firme de concreto de 10cm de espesor, acabado pulido.', 'm²', 120, 180, 300, 15.00, 345, false, true),
('MX-02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'APLANADO YESO', 'Aplanado de yeso en muros interiores, acabado fino.', 'm²', 80, 45, 125, 15.00, 143.75, false, true),
('MX-02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PLAFÓN DRYWALL', 'Plafón de drywall con estructura metálica, acabado listo para pintar.', 'm²', 140, 160, 300, 15.00, 345, false, true),
('MX-02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PISO CERÁMICA 40X40', 'Colocación de piso de cerámica 40x40cm, con junta.', 'm²', 120, 280, 400, 15.00, 460, false, true),
('MX-02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AZULEJO BAÑO 30X30', 'Colocación de azulejo en baño 30x30cm, hasta 2.20m altura.', 'm²', 130, 250, 380, 15.00, 437, false, true),
('MX-02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ZOCLO MADERA', 'Colocación de zoclo de madera de 10cm.', 'ml', 35, 45, 80, 15.00, 92, false, true),
('MX-02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'PINTURA VINÍLICA', 'Aplicación de pintura vinílica en muros, dos manos.', 'm²', 35, 25, 60, 15.00, 69, false, true),
('MX-02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'IMPERMEABILIZACIÓN AZOTEA', 'Impermeabilización de azotea con membrana asfáltica.', 'm²', 90, 160, 250, 15.00, 287.50, false, true),

-- PLOMERÍA (10 conceptos)
('MX-03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'WC INSTALACIÓN', 'Instalación de WC con tanque, incluyendo conexiones y accesorios.', 'ud', 300, 1800, 2100, 15.00, 2415, false, true),
('MX-03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LAVABO INSTALACIÓN', 'Instalación de lavabo con llave mezcladora cromada.', 'ud', 250, 1200, 1450, 15.00, 1667.50, false, true),
('MX-03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'REGADERA INSTALACIÓN', 'Instalación de regadera con mezcladora y accesorios.', 'ud', 280, 1400, 1680, 15.00, 1932, false, true),
('MX-03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'BOILER GAS 38L', 'Suministro e instalación de boiler de gas de 38 litros.', 'ud', 600, 4500, 5100, 15.00, 5865, false, true),
('MX-03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TINACO 1100L', 'Suministro e instalación de tinaco de 1100 litros con base.', 'ud', 800, 3200, 4000, 15.00, 4600, false, true),
('MX-03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA COBRE 1/2"', 'Instalación de tubería de cobre de 1/2" para agua.', 'ml', 45, 85, 130, 15.00, 149.50, false, true),
('MX-03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'TUBERÍA PVC 4"', 'Instalación de tubería PVC sanitaria de 4".', 'ml', 35, 55, 90, 15.00, 103.50, false, true),
('MX-03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FREGADERO INSTALACIÓN', 'Instalación de fregadero de acero inoxidable con llave.', 'ud', 280, 1600, 1880, 15.00, 2162, false, true),
('MX-03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'LLAVE PASO 1/2"', 'Suministro e instalación de llave de paso de 1/2".', 'ud', 80, 120, 200, 15.00, 230, false, true),
('MX-03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'HIDRONEUMÁTICO', 'Suministro e instalación de sistema hidroneumático 1/2 HP.', 'ud', 1200, 5800, 7000, 15.00, 8050, false, true),

-- CARPINTERÍA (8 conceptos)
('MX-04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA TAMBOR', 'Suministro e instalación de puerta de tambor con marco y chapa.', 'ud', 400, 1800, 2200, 15.00, 2530, false, true),
('MX-04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'PUERTA MADERA SÓLIDA', 'Suministro e instalación de puerta de madera sólida con herrajes.', 'ud', 500, 3500, 4000, 15.00, 4600, false, true),
('MX-04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'VENTANA ALUMINIO', 'Suministro e instalación de ventana de aluminio con vidrio.', 'm²', 450, 850, 1300, 15.00, 1495, false, true),
('MX-04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CLOSET MELAMINA', 'Fabricación e instalación de closet de melamina con entrepaños.', 'ml', 800, 1400, 2200, 15.00, 2530, false, true),
('MX-04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA BAJO', 'Fabricación e instalación de mueble bajo de cocina en melamina.', 'ml', 700, 1300, 2000, 15.00, 2300, false, true),
('MX-04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'MUEBLE COCINA ALTO', 'Fabricación e instalación de mueble alto de cocina en melamina.', 'ml', 600, 1100, 1700, 15.00, 1955, false, true),
('MX-04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CUBIERTA GRANITO', 'Suministro e instalación de cubierta de granito para cocina.', 'ml', 400, 1600, 2000, 15.00, 2300, false, true),
('MX-04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CANCEL BAÑO', 'Suministro e instalación de cancel de baño en aluminio y vidrio.', 'ud', 600, 2400, 3000, 15.00, 3450, false, true),

-- ELECTRICIDAD (10 conceptos)
('MX-05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CONTACTO DOBLE', 'Suministro e instalación de contacto doble polarizado.', 'ud', 80, 120, 200, 15.00, 230, false, true),
('MX-05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'APAGADOR SENCILLO', 'Suministro e instalación de apagador sencillo.', 'ud', 70, 80, 150, 15.00, 172.50, false, true),
('MX-05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÁMPARA LED EMPOTRAR', 'Suministro e instalación de lámpara LED para empotrar.', 'ud', 120, 280, 400, 15.00, 460, false, true),
('MX-05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CENTRO CARGA 12 POLOS', 'Suministro e instalación de centro de carga de 12 polos.', 'ud', 400, 1200, 1600, 15.00, 1840, false, true),
('MX-05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CABLE THHN 12 AWG', 'Suministro e instalación de cable THHN calibre 12.', 'ml', 15, 25, 40, 15.00, 46, false, true),
('MX-05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TUBO CONDUIT 3/4"', 'Suministro e instalación de tubo conduit de 3/4".', 'ml', 20, 30, 50, 15.00, 57.50, false, true),
('MX-05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'VENTILADOR TECHO', 'Suministro e instalación de ventilador de techo con luz.', 'ud', 250, 1250, 1500, 15.00, 1725, false, true),
('MX-05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE INALÁMBRICO', 'Suministro e instalación de timbre inalámbrico.', 'ud', 100, 300, 400, 15.00, 460, false, true),
('MX-05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ARBOTANTE EXTERIOR', 'Suministro e instalación de arbotante para exterior.', 'ud', 150, 450, 600, 15.00, 690, false, true),
('MX-05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIERRA FÍSICA', 'Instalación de sistema de tierra física con varilla.', 'ud', 600, 800, 1400, 15.00, 1610, false, true),

-- CALEFACCIÓN (5 conceptos)
('MX-06-H-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'MINISPLIT 1 TON', 'Suministro e instalación de minisplit de 1 tonelada.', 'ud', 1200, 6800, 8000, 15.00, 9200, false, true),
('MX-06-H-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'MINISPLIT 2 TON', 'Suministro e instalación de minisplit de 2 toneladas.', 'ud', 1500, 11500, 13000, 15.00, 14950, false, true),
('MX-06-H-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN RADIANTE', 'Instalación de sistema de calefacción radiante por m².', 'm²', 350, 650, 1000, 15.00, 1150, false, true),
('MX-06-H-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'EXTRACTOR BAÑO', 'Suministro e instalación de extractor de aire para baño.', 'ud', 180, 520, 700, 15.00, 805, false, true),
('MX-06-H-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMPANA EXTRACTORA', 'Suministro e instalación de campana extractora para cocina.', 'ud', 300, 2200, 2500, 15.00, 2875, false, true),

-- LIMPIEZA (2 conceptos)
('MX-07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA OBRA', 'Limpieza general de obra, retiro de polvo y residuos.', 'm²', 15, 10, 25, 15.00, 28.75, false, true),
('MX-07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA PROFUNDA', 'Limpieza profunda post-obra, incluyendo vidrios y detalles.', 'm²', 25, 15, 40, 15.00, 46, false, true);

-- Resumen
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  ROUND(AVG(pm.final_price), 2) as precio_promedio
FROM price_master_mexico pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
