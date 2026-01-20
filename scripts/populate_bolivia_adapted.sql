DROP TABLE IF EXISTS price_master_bolivia;

CREATE TABLE price_master_bolivia (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES price_categories(id),
  subcategory TEXT,
  description TEXT,
  long_description TEXT,
  unit TEXT NOT NULL,
  base_price DECIMAL(10,2),
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORÍA: DERRIBOS (5b38410c-4b7b-412a-9f57-6e74db0cc237)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIÓN TABIQUES DRYWALL', 'Demolición de tabique existente de drywall o yeso laminado, incluyendo mano de obra y eliminación de escombros a botadero autorizado.', 'm²', 15.00, 58.00),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO CERÁMICA EN PAREDES', 'Picado de paredes para retirada de cerámica o azulejo existente en paredes verticales, incluyendo limpieza.', 'm²', 13.00, 50.00),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO DE PISOS CERÁMICOS', 'Picado de piso cerámico o porcelanato y posterior eliminación de escombros.', 'm²', 19.00, 72.00),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CIELO RASO FALSO', 'Retiro y eliminación de cielo raso falso de yeso o drywall existente.', 'm²', 13.00, 50.00),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS DECORATIVAS', 'Retiro de molduras de yeso o madera en el perímetro de techos y paredes.', 'ml', 1.30, 5.50),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE PISO FLOTANTE', 'Desmontaje de piso flotante o laminado incluyendo los listones de base.', 'm²', 7.50, 29.00),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE ZÓCALO DE MADERA', 'Retiro de zócalo o guarda escoba de madera y acopio para eliminación.', 'ml', 2.30, 9.00),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE ZÓCALO CERÁMICO', 'Retiro de zócalo cerámico o de azulejo en base de paredes.', 'ml', 5.00, 19.00),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR DE ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de construcción a botadero autorizado.', 'Ud', 450.00, 1700.00),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros desde el lugar de trabajo.', 'H', 16.00, 60.00),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIONES', 'Desconexión y anulación de líneas antiguas de electricidad y plomería.', 'Ud', 155.00, 580.00),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE DE PUERTAS', 'Desmontaje de hoja de puerta existente y posterior retirada del lugar.', 'Ud', 26.00, 98.00);

-- CATEGORÍA: ALBAÑILERÍA (d6e90b3f-3bc5-4f15-8530-19da496abc5e)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CONTRAPISO DE HORMIGÓN', 'Formación de contrapiso de hormigón para nivelación y aislamiento, espesor máximo 7cm.', 'm²', 40.00, 152.00),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'NIVELACIÓN CON MORTERO AUTONIVELANTE', 'Aplicación de mortero autonivelante de bajo espesor para acabado fino (hasta 15mm).', 'm²', 33.00, 125.00),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TRASDOSADO EN DRYWALL', 'Colocación de placa de yeso laminado de 13mm sobre perfilería metálica en paredes.', 'm²', 53.00, 198.00),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DE LADRILLO GAMBOTE', 'Levantamiento de tabique de ladrillo gambote de 6 huecos con mortero.', 'm²', 32.00, 120.00),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras con aislamiento acústico interior.', 'm²', 60.00, 225.00),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CERÁMICA EN PAREDES (MO)', 'Mano de obra de colocación de cerámica o azulejo en paredes (No incluye material cerámico).', 'm²', 40.00, 152.00),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CERÁMICA EN PISOS (MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelanato en pisos (No incluye material cerámico).', 'm²', 44.00, 167.00),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE Y ENLUCIDO DE PAREDES', 'Revoque fino y enlucido de paredes para obtener superficie lisa lista para pintar.', 'm²', 19.00, 72.00),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO DE YESO EN CIELOS', 'Aplicación de capa de yeso en cielos rasos y paredes para acabado fino.', 'm²', 18.00, 70.00),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TAPADO DE CANALETAS', 'Relleno y tapado de todas las canaletas realizadas para el paso de instalaciones de plomería y electricidad.', 'Ud', 515.00, 1930.00);

-- CATEGORÍA: PLOMERÍA (3d93ed2f-bfec-4f36-834e-2d3c4d7d7260)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('03-P-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED COMPLETA DE BAÑO', 'Renovación completa de red de agua fría y agua caliente del baño con tubería PEX o PPR.', 'Ud', 850.00, 3180.00),
('03-P-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED COMPLETA DE COCINA', 'Renovación completa de red de agua fría y agua caliente de la cocina con tubería PEX o PPR.', 'Ud', 595.00, 2225.00),
('03-P-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'CAMBIO DE BAJANTE PVC-110MM', 'Sustitución de tramo de bajante de desagüe con tubería PVC de 110mm.', 'Ud', 278.00, 1040.00),
('03-P-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCTO EXTRACTOR DE BAÑO', 'Colocación de ducto para extractor de ventilación en baño hacia el exterior.', 'Ud', 147.00, 550.00),
('03-P-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'DUCTO CAMPANA EXTRACTORA', 'Colocación de ducto para campana extractora de humos de cocina.', 'Ud', 232.00, 870.00),
('03-P-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN DE INODORO (MO)', 'Montaje e instalación del inodoro con conexiones de agua y desagüe.', 'Ud', 65.00, 242.00),
('03-P-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN PLATO DE DUCHA (MO)', 'Instalación y sellado del plato de ducha con conexión a desagüe.', 'Ud', 129.00, 483.00),
('03-P-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVAMANOS (MO)', 'Instalación de mueble y lavamanos, incluyendo espejo y aplique de luz.', 'Ud', 116.00, 435.00),
('03-P-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFERÍA DUCHA (MO)', 'Montaje de monomando o mezcladora de ducha con conexiones.', 'Ud', 65.00, 242.00),
('03-P-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFERÍA LAVAMANOS (MO)', 'Montaje de monomando o mezcladora de lavamanos.', 'Ud', 65.00, 242.00);

-- CATEGORÍA: CARPINTERÍA (e4967edd-53b5-459a-bb68-b1fd88ee6836)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN CON TABLERO OSB', 'Colocación de tablero OSB sobre listones para nivelar piso antes de instalar piso flotante.', 'm²', 45.00, 170.00),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO FLOTANTE (MO)', 'Mano de obra de colocación de piso flotante o laminado tipo click.', 'm²', 18.00, 70.00),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo click o autoadhesivo.', 'm²', 24.00, 91.00),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN ZÓCALO O GUARDA ESCOBA (MO)', 'Suministro y colocación de zócalo o guarda escoba de MDF o madera.', 'ml', 7.00, 27.00),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PREMARCOS (MO)', 'Instalación de premarco metálico o de madera para puertas.', 'Ud', 116.00, 435.00),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PUERTA ABATIBLE (MO)', 'Instalación de puerta abatible en block con bisagras y manija.', 'Ud', 129.00, 483.00),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín o riel.', 'Ud', 297.00, 1110.00),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PUERTA PRINCIPAL (MO)', 'Instalación de puerta de seguridad o puerta principal blindada.', 'Ud', 583.00, 2180.00);

-- CATEGORÍA: ELECTRICIDAD (243dee0d-edba-4de9-94a4-2a4c17ff607d)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO ELÉCTRICO 18 MÓDULOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección (breakers, diferenciales).', 'Ud', 710.00, 2655.00),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y DATOS', 'Instalación de red de cableado estructurado para TV, internet y telefonía.', 'Ud', 226.00, 845.00),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO PROVISIONAL DE OBRA', 'Colocación de tablero eléctrico provisional para uso durante la construcción.', 'Ud', 355.00, 1330.00),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÍNEA DE TOMACORRIENTES', 'Tendido de línea de tomacorrientes monofásica con cable y tubería.', 'Ud', 303.00, 1135.00),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÍNEA DE ILUMINACIÓN', 'Tendido de línea de iluminación general con cable y tubería.', 'Ud', 303.00, 1135.00),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SIMPLE', 'Mecanismo e instalación de punto de luz simple (interruptor + luminaria).', 'Ud', 45.00, 169.00),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de punto de luz conmutado desde dos interruptores.', 'Ud', 71.00, 265.00),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMACORRIENTES', 'Mecanismo e instalación de tomacorriente de pared estándar.', 'Ud', 52.00, 193.00),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV Y DATOS', 'Mecanismo e instalación de toma de antena, internet o telecomunicaciones.', 'Ud', 83.00, 309.00),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CERTIFICACIÓN ELÉCTRICA', 'Emisión del certificado de instalación eléctrica y trámites de legalización.', 'Ud', 314.00, 1175.00);

-- CATEGORÍA: CALEFACCIÓN (5090928c-9b72-4d83-8667-9d01ddbfca47)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN RADIADOR ELÉCTRICO', 'Instalación y conexión de radiador eléctrico a la línea eléctrica.', 'Ud', 52.00, 193.00),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN CALEFÓN A GAS (MO)', 'Mano de obra por la instalación completa de calefón a gas con conexiones.', 'Ud', 490.00, 1835.00),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador de calefacción.', 'Ud', 232.00, 870.00),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN RADIADORES (MO)', 'Instalación de radiador nuevo o reubicación de uno existente.', 'Ud', 77.00, 290.00),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMOTANQUE ELÉCTRICO 80L', 'Instalación y conexionado de termotanque eléctrico de 80 litros.', 'Ud', 249.00, 933.00);

-- CATEGORÍA: LIMPIEZA (0f95a55f-12ba-4e0e-ba0d-d01229d05c4c)
INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, base_price, final_price) VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS', 'Mano de obra por la limpieza diaria o semanal durante la ejecución de la obra.', 'Ud', 90.00, 338.00),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores de construcción.', 'Ud', 180.00, 672.00);

-- Consulta de verificación
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pmb.final_price) as precio_minimo,
  MAX(pmb.final_price) as precio_maximo,
  ROUND(AVG(pmb.final_price), 2) as precio_promedio
FROM price_master_bolivia pmb
JOIN price_categories pc ON pmb.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
