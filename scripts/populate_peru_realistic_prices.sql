-- Eliminar precios existentes de Perú
DELETE FROM price_master_peru;

-- DEMOLICIONES (16 conceptos)
-- Precios ajustados a realidad peruana: mano de obra más económica
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-01', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 25, 5, 3, 2, 35, 20, 42, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-02', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 20, 3, 2, 1, 26, 20, 31.20, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-03', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 28, 5, 3, 2, 38, 20, 45.60, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-04', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 20, 3, 2, 1, 26, 20, 31.20, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-05', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de techos.', 'ml', 2.5, 0.3, 0.2, 0.1, 3.1, 20, 3.72, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-06', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o de madera incluyendo los listones inferiores.', 'm²', 12, 2, 1, 0.5, 15.5, 20, 18.60, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-07', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 1.8, 0.2, 0.1, 0.05, 2.15, 20, 2.58, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-08', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 3.5, 0.5, 0.3, 0.2, 4.5, 20, 5.40, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-09', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 150, 800, 50, 100, 1100, 20, 1320, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-10', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 25, 0, 2, 1, 28, 20, 33.60, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-11', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 100, 15, 5, 5, 125, 20, 150, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-12', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 35, 3, 2, 1, 41, 20, 49.20, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-13', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 5, 1, 0.5, 0.3, 6.8, 20, 8.16, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-14', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidé, lavabo o bañera.', 'Ud', 80, 10, 5, 3, 98, 20, 117.60, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-15', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 150, 15, 8, 5, 178, 20, 213.60, true),
('5b38410c-4b7b-412a-9f57-6e74db0cc237', '01-D-16', 'RETIRO DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 200, 20, 10, 8, 238, 20, 285.60, true);

-- ALBAÑILERÍA (17 conceptos)
-- Precios ajustados: materiales locales más económicos
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-01', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 35, 45, 5, 3, 88, 20, 105.60, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-02', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 30, 45, 3, 2, 80, 20, 96, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-03', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado sobre perfilería metálica.', 'm²', 40, 65, 5, 3, 113, 20, 135.60, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-04', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 35, 40, 3, 2, 80, 20, 96, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-05', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'm²', 50, 80, 6, 4, 140, 20, 168, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-06', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 50, 15, 3, 2, 70, 20, 84, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-07', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 55, 18, 4, 3, 80, 20, 96, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-08', 'EMBALDOSADO PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 60, 20, 4, 3, 87, 20, 104.40, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-09', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 25, 12, 2, 1, 40, 20, 48, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-10', 'TARRAJEO PREVIO TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 25, 12, 2, 1, 40, 20, 48, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-11', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes.', 'm²', 22, 15, 2, 1, 40, 20, 48, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-12', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 250, 80, 15, 10, 355, 20, 426, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-13', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 8, 12, 1, 0.5, 21.5, 20, 25.80, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-14', 'COLOCACIÓN CAJETÍN PUERTA CORREDERA', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Ud', 120, 180, 15, 10, 325, 20, 390, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-15', 'AYUDA A GREMIOS', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 200, 30, 10, 8, 248, 20, 297.60, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-16', 'BAJADO DE TECHOS (Drywall)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 35, 45, 4, 3, 87, 20, 104.40, true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', '02-A-17', 'AISLANTES TÉRMICOS', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 15, 25, 2, 1, 43, 20, 51.60, true);

-- FONTANERÍA (13 conceptos)
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-01', 'RED DE BAÑO COMPLETA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño con todos los puntos de consumo.', 'Ud', 400, 450, 50, 30, 930, 20, 1116, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-02', 'RED DE COCINA COMPLETA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 280, 320, 35, 20, 655, 20, 786, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-03', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe.', 'Ud', 150, 120, 15, 10, 295, 20, 354, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-04', 'CONDUCTO EXTRACCIÓN BAÑO', 'Suministro y colocación de conducto para extractor de ventilación en baño.', 'Ud', 70, 60, 8, 5, 143, 20, 171.60, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-05', 'CONDUCTO CAMPANA EXTRACTORA', 'Suministro y colocación de conducto para campana extractora de humos.', 'Ud', 100, 120, 12, 8, 240, 20, 288, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-06', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro con conexiones.', 'Ud', 80, 15, 5, 3, 103, 20, 123.60, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-07', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 120, 25, 8, 5, 158, 20, 189.60, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-08', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 100, 20, 6, 4, 130, 20, 156, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-09', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 110, 15, 6, 4, 135, 20, 162, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-10', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 70, 10, 4, 2, 86, 20, 103.20, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-11', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 70, 10, 4, 2, 86, 20, 103.20, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-12', 'MONTAJE FREGADERO Y ELECTRODOMÉSTICOS', 'Instalación y conexionado de fregadero, lavadora y lavavajillas.', 'Ud', 90, 20, 6, 4, 120, 20, 144, true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', '03-F-13', 'MONTAJE CAMPANA EXTRACTORA COCINA', 'Instalación de campana extractora en cocina.', 'Ud', 70, 10, 4, 2, 86, 20, 103.20, true);

-- CARPINTERÍA (12 conceptos)
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-01', 'NIVELACIÓN DE PISOS CON TABLERO', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 40, 55, 4, 3, 102, 20, 122.40, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-02', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado flotante.', 'm²', 25, 8, 2, 1, 36, 20, 43.20, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-03', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo click.', 'm²', 30, 10, 2, 1, 43, 20, 51.60, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-04', 'COLOCACIÓN CONTRAZÓCALO LACADO', 'Suministro y colocación de contrazócalo de MDF lacado.', 'ml', 5, 12, 1, 0.5, 18.5, 20, 22.20, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-05', 'COLOCACIÓN PREMARCOS (MO)', 'Suministro e instalación de premarco de puerta.', 'Ud', 80, 60, 6, 4, 150, 20, 180, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-06', 'COLOCACIÓN FORRO (MARCOS SIN PUERTA)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 150, 120, 10, 8, 288, 20, 345.60, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-07', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA', 'Instalación de puerta abatible en block completo.', 'Ud', 120, 25, 8, 5, 158, 20, 189.60, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-08', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 180, 220, 15, 10, 425, 20, 510, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-09', 'COLOCACIÓN PUERTA ENTRADA BLINDADA', 'Instalación de puerta de seguridad blindada.', 'Ud', 350, 280, 25, 20, 675, 20, 810, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-10', 'ACUCHILLADO PISO + BARNIZADO', 'Lijado y barnizado de piso de madera existente.', 'm²', 25, 18, 4, 2, 49, 20, 58.80, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-11', 'EMPLASTECIDO DE LAMAS DE PISO', 'Relleno de juntas de piso laminado.', 'm²', 8, 5, 1, 0.5, 14.5, 20, 17.40, true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', '04-C-12', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 25, 3, 2, 1, 31, 20, 37.20, true);

-- ELECTRICIDAD (17 conceptos)
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-01', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 350, 550, 40, 25, 965, 20, 1158, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-02', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 120, 150, 12, 8, 290, 20, 348, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-03', 'INSTALACIÓN PORTERO CONVENCIONAL', 'Suministro e instalación de telefonillo.', 'Ud', 80, 100, 8, 5, 193, 20, 231.60, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-04', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 180, 250, 20, 15, 465, 20, 558, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-05', 'LINEA DE TOMACORRIENTES MONOFÁSICA', 'Tendido de línea de tomacorrientes estándar (2,5mm2).', 'Ud', 150, 180, 15, 10, 355, 20, 426, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-06', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 150, 180, 15, 10, 355, 20, 426, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-07', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 35, 25, 3, 2, 65, 20, 78, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-08', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 50, 45, 4, 3, 102, 20, 122.40, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-09', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 60, 55, 5, 3, 123, 20, 147.60, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-10', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 40, 30, 3, 2, 75, 20, 90, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-11', 'PUNTO TOMACORRIENTE INTEMPERIE', 'Mecanismo e instalación de tomacorriente apto para exterior.', 'Ud', 50, 50, 4, 3, 107, 20, 128.40, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-12', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 55, 60, 4, 3, 122, 20, 146.40, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-13', 'PUNTOS TOMACORRIENTE APARATOS COCINA', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Ud', 40, 30, 3, 2, 75, 20, 90, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-14', 'COLOCACIÓN FOCOS EMPOTRADOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 45, 15, 3, 2, 65, 20, 78, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-15', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 50, 35, 3, 2, 90, 20, 108, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-16', 'LÍNEA PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 130, 180, 15, 10, 335, 20, 402, true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', '05-E-17', 'CERTIFICACIÓN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 200, 250, 20, 15, 485, 20, 582, true);

-- CALEFACCIÓN (10 conceptos)
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-01', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 60, 15, 4, 3, 82, 20, 98.40, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-02', 'RECOLOCAR CALDERA DE GAS', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 60, 15, 4, 3, 82, 20, 98.40, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-03', 'COLOCACIÓN CALDERA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 280, 350, 30, 20, 680, 20, 816, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-04', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 120, 150, 12, 8, 290, 20, 348, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-05', 'COLOCACIÓN Y MOVIMIENTO RADIADORES', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 90, 25, 6, 4, 125, 20, 150, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-06', 'LEGALIZACIÓN INSTALACIÓN GAS', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 250, 350, 25, 20, 645, 20, 774, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-07', 'INSTALACIÓN PISO RADIANTE HÚMEDO', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'm²', 80, 120, 10, 8, 218, 20, 261.60, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-08', 'ACOMETIDA DE GAS (Aprox.)', 'Coste estimado de conexión a la red de gas general.', 'Ud', 600, 1500, 100, 80, 2280, 20, 2736, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-09', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 50, 35, 4, 3, 92, 20, 110.40, true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', '06-CAL-10', 'INSTALACIÓN TERMA ELÉCTRICA 80L', 'Instalación y conexionado de terma eléctrica.', 'Ud', 150, 200, 15, 10, 375, 20, 450, true);

-- LIMPIEZA (2 conceptos)
INSERT INTO price_master_peru (category_id, code, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', '07-L-01', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100, 20, 5, 3, 128, 20, 153.60, true),
('0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', '07-L-02', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 200, 40, 10, 8, 258, 20, 309.60, true);

-- Verificación final
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  ROUND(AVG(pm.final_price), 2) as precio_promedio,
  ROUND(MIN(pm.final_price), 2) as precio_minimo,
  ROUND(MAX(pm.final_price), 2) as precio_maximo
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
