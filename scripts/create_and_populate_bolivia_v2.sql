-- Corregido category_id de TEXT a UUID para compatibilidad con price_categories
DROP TABLE IF EXISTS price_master_bolivia CASCADE;

CREATE TABLE price_master_bolivia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT,
  long_description TEXT,
  unit TEXT NOT NULL,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  equipment_cost DECIMAL(10,2) DEFAULT 0,
  other_cost DECIMAL(10,2) DEFAULT 0,
  base_price DECIMAL(10,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_bolivia_category ON price_master_bolivia(category_id);
CREATE INDEX idx_bolivia_code ON price_master_bolivia(code);
CREATE INDEX idx_bolivia_active ON price_master_bolivia(is_active);

-- Habilitar RLS
ALTER TABLE price_master_bolivia ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer precios activos
CREATE POLICY "Todos pueden ver precios activos de Bolivia"
  ON price_master_bolivia FOR SELECT
  USING (is_active = true);

-- Política: solo usuarios autenticados pueden insertar/actualizar
CREATE POLICY "Usuarios autenticados pueden modificar precios de Bolivia"
  ON price_master_bolivia FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Insertar precios para Bolivia (Bolivianos - Bs.)
-- Precios ajustados al mercado boliviano

-- CATEGORÍA: DEMOLICIONES (01-D)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 55.20),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 46.80),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 68.40),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 46.80),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de cielos rasos.', 'ml', 5.04),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o de madera incluyendo los listones inferiores.', 'm²', 28.80),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 9.00),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 18.00),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 1680.00),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 58.80),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 561.60),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retiro.', 'Ud', 93.60),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 12.00),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidé, lavatorio o bañera.', 'Ud', 561.60),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 1123.20),
('01-D-16', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 1684.80);

-- CATEGORÍA: ALBAÑILERÍA (02-A)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 144.00),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 120.00),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado sobre perfilería.', 'm²', 189.60),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 117.60),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'm²', 216.00),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 144.00),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 160.80),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 163.20),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO ENCHAPES', 'Revoque de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 69.60),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO LEVANTES TABIQUERÍA', 'Revoque y enlucido de tabiquería nueva antes de pintar.', 'm²', 69.60),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en cielos rasos y paredes.', 'm²', 67.20),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 1872.00),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 69.60),
('02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CAJÓN PUERTA CORREDERA', 'Instalación y revoque del armazón metálico para puerta corredera.', 'Ud', 888.00),
('02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AYUDA A GREMIOS', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 1404.00),
('02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE CIELOS RASOS (Drywall)', 'Instalación de falso cielo raso en placa de yeso laminado.', 'm²', 125.52);

-- CATEGORÍA: FONTANERÍA (03-F)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 3084.00),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 2151.60),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 1005.60),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 532.80),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 841.20),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 234.00),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 468.00),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique.', 'Ud', 420.00),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 444.00),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 234.00),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio.', 'Ud', 234.00),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO Y ELECTRODOMÉSTICOS', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 304.20),
('03-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE CAMPANA EXTRACTORA COCINA', 'Instalación de campana extractora en cocina.', 'Ud', 234.00);

-- CATEGORÍA: CARPINTERÍA (04-C)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE PISOS CON TABLERO', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 163.20),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado o suelo laminado.', 'm²', 67.68),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 88.80),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO LACADO', 'Suministro y colocación de contrazócalo.', 'ml', 26.16),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 420.00),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN FORRO (MARCOS SIN PUERTA)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 930.00),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA', 'Instalación de puerta abatible en block.', 'Ud', 468.00),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajón.', 'Ud', 1074.00),
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (Blindada)', 'Instalación de puerta de seguridad.', 'Ud', 2106.00),
('04-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ACUCHILLADO PISO + BARNIZADO', 'Lijado y barnizado de piso de madera existente.', 'm²', 74.64),
('04-C-11', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'EMPLASTECIDO DE LAS LAMAS', 'Relleno de juntas de piso laminado.', 'm²', 23.40),
('04-C-12', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 74.64);

-- CATEGORÍA: ELECTRICIDAD (05-E)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 2568.00),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 816.00),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo.', 'Ud', 444.00),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 1284.00),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE TOMACORRIENTES MONOFÁSICA', 'Tendido de línea de tomacorrientes estándar.', 'Ud', 1098.00),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO', 'Tendido de línea de alumbrado general.', 'Ud', 1098.00),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 163.20),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 256.80),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 303.60),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 186.00),
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO TOMACORRIENTE INTEMPERIE', 'Mecanismo e instalación de tomacorriente apto para exterior.', 'Ud', 266.40),
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 298.80),
('05-E-13', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS TOMACORRIENTE APARATOS COCINA', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Ud', 186.00),
('05-E-14', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso cielo raso (focos no incluidos).', 'Ud', 140.40),
('05-E-15', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 210.00),
('05-E-16', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÍNEA PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 909.60),
('05-E-17', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CERTIFICACIÓN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 1134.00);

-- CATEGORÍA: CALEFACCIÓN (06-CAL)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 186.00),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RECOLOCAR CALENTADOR DE GAS', 'Desmontaje y montaje de calentador en el mismo sitio.', 'Ud', 186.00),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALENTADOR DE GAS', 'Mano de obra por la instalación completa de un nuevo calentador.', 'Ud', 1776.00),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 841.20),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 280.80),
('06-CAL-06', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'LEGALIZACIÓN INSTALACIÓN', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 1494.00),
('06-CAL-07', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN PISO RADIANTE HÚMEDO', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'm²', 295.20),
('06-CAL-08', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'ACOMETIDA DE GAS (Aprox.)', 'Costo estimado de conexión a la red de gas general.', 'Ud', 4668.00),
('06-CAL-09', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 210.00),
('06-CAL-10', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 901.20);

-- CATEGORÍA: LIMPIEZA (07-L)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 327.60),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retiro de restos menores.', 'Ud', 654.00);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmb.final_price) as precio_minimo,
  MAX(pmb.final_price) as precio_maximo,
  AVG(pmb.final_price)::DECIMAL(10,2) as precio_promedio
FROM price_master_bolivia pmb
JOIN price_categories pc ON pmb.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
