-- Crear tabla para Bolivia con precios adaptados al mercado local
-- Moneda: Bolivianos (Bs.)

-- Eliminar tabla si existe
DROP TABLE IF EXISTS price_master_bolivia CASCADE;

-- Crear tabla con la misma estructura que price_master
CREATE TABLE price_master_bolivia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL DEFAULT 'm²',
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

-- Crear índices para mejor rendimiento
CREATE INDEX idx_bolivia_category ON price_master_bolivia(category_id);
CREATE INDEX idx_bolivia_code ON price_master_bolivia(code);
CREATE INDEX idx_bolivia_active ON price_master_bolivia(is_active);

-- Insertar precios para DERRIBOS (Demoliciones)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 38.50),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 32.00),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 42.00),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 32.00),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de cielos rasos.', 'ml', 3.20),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o de madera incluyendo los listones inferiores.', 'm²', 19.00),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 5.80),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 12.50),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 1050.00),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 38.00),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas de electricidad o fontanería.', 'Ud', 360.00),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retiro.', 'Ud', 60.00),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 8.00);

-- Insertar precios para ALBAÑILERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 95.00),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor para nivelar pisos.', 'm²', 80.00),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado sobre perfilería metálica.', 'm²', 125.00),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 75.00),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'm²', 140.00),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 95.00),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 105.00),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 45.00),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO LEVANTES TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 45.00),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en cielos rasos y paredes.', 'm²', 43.00),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 1200.00),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 45.00),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE CIELOS RASOS (Drywall)', 'Instalación de falso cielo raso en placa de yeso laminado.', 'm²', 82.00);

-- Insertar precios para FONTANERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 1980.00),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 1380.00),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de aguas residuales.', 'Ud', 645.00),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 342.00),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos en cocina.', 'Ud', 540.00),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro con sus accesorios.', 'Ud', 150.00),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 300.00),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique.', 'Ud', 270.00),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 285.00),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 150.00),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio.', 'Ud', 150.00),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO Y ELECTRODOMÉSTICOS (MO)', 'Instalación y conexionado de fregadero, lavadora y lavavajillas.', 'Ud', 195.00);

-- Insertar precios para CARPINTERÍA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE PISOS CON TABLERO', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 105.00),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado flotante.', 'm²', 43.50),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 57.00),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO (MO y Materiales)', 'Suministro y colocación de contrazócalo de madera.', 'ml', 16.80),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco para puertas.', 'Ud', 270.00),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block con bisagras y manija.', 'Ud', 300.00),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 690.00),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad blindada.', 'Ud', 1350.00),
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 48.00);

-- Insertar precios para ELECTRICIDAD
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 1650.00),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 525.00),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'SUMINISTRO E INSTALACIÓN PORTERO', 'Instalación de portero eléctrico o telefonillo.', 'Ud', 285.00),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 825.00),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'LINEA DE TOMACORRIENTES MONOFÁSICA', 'Tendido de línea de tomacorrientes estándar con cable 2,5mm².', 'Ud', 705.00),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'LINEA DE ALUMBRADO', 'Tendido de línea de alumbrado general con cable 1,5mm².', 'Ud', 705.00),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 105.00),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 165.00),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 120.00),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 192.00),
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'PUNTOS TOMACORRIENTE APARATOS DE COCINA', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Ud', 120.00),
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607c', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso cielo raso.', 'Ud', 90.00);

-- Insertar precios para CALEFACCIÓN
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión de radiador eléctrico a la línea eléctrica.', 'Ud', 120.00),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALENTADOR DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de un nuevo calentador de gas.', 'Ud', 1140.00),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 540.00),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 180.00),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico de 80 litros.', 'Ud', 579.00);

-- Insertar precios para LIMPIEZA
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, final_price) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra durante el proceso de construcción.', 'Ud', 210.00),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retiro de restos menores.', 'Ud', 420.00);

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
