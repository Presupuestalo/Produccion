-- Limpiar tabla existente
DELETE FROM price_master_peru;

-- CATEGORÍA: DEMOLICIONES (DERRIBOS)
-- ID Categoría: 5b38410c-4b7b-412a-9f57-6e74db0cc237

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 50, 10, 10, 4.75, 74.75, 0, 74.75, true, false),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 45, 5, 8, 4.10, 62.10, 0, 62.10, true, false),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 65, 10, 12, 3.85, 90.85, 0, 90.85, true, false),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 45, 5, 8, 4.10, 62.10, 0, 62.10, true, false),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de techos.', 'ml', 4, 1, 1, 0.90, 6.90, 0, 6.90, true, false),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o de madera incluyendo los listones inferiores.', 'm²', 25, 3, 5, 3.80, 36.80, 0, 36.80, true, false),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 8, 1, 1.5, 1.00, 11.50, 0, 11.50, true, false),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 18, 2, 2, 2.15, 24.15, 0, 24.15, true, false),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 1500, 400, 200, 85, 2185, 0, 2185, true, false),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 50, 0, 5, 4.80, 59.80, 0, 59.80, true, false),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas de electricidad y agua.', 'Ud', 600, 50, 30, 55.20, 735.20, 0, 735.20, true, false),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 100, 10, 5, 7.20, 122.20, 0, 122.20, true, false),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 12, 1, 1, 1.20, 15.20, 0, 15.20, true, false),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidé, lavabo o bañera.', 'Ud', 600, 50, 30, 55.20, 735.20, 0, 735.20, true, false),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 1200, 100, 60, 106.40, 1466.40, 0, 1466.40, true, false),
('01-D-16', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 1800, 150, 90, 155.52, 2195.52, 0, 2195.52, true, false);

-- CATEGORÍA: ALBAÑILERÍA
-- ID Categoría: d6e90b3f-3bc5-4f15-8530-19da496abc5e

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 140, 40, 10, 1.12, 191.12, 0, 191.12, true, false),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 120, 40, 10, 9.76, 179.76, 0, 179.76, true, false),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE REVESTIMIENTO EN DRYWALL (13+45)', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 180, 70, 15, 17.16, 282.16, 0, 282.16, true, false),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato.', 'm²', 110, 40, 10, 8, 168, 0, 168, true, false),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 200, 80, 20, 15.84, 315.84, 0, 315.84, true, false),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 140, 40, 10, 1.12, 191.12, 0, 191.12, true, false),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 160, 45, 12, 4.04, 221.04, 0, 221.04, true, false),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 165, 45, 12, 5.20, 227.20, 0, 227.20, true, false),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 70, 15, 5, 1.60, 91.60, 0, 91.60, true, false),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TARRAJEO PREVIO LEVANTES TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 70, 15, 5, 1.60, 91.60, 0, 91.60, true, false),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes.', 'm²', 65, 15, 5, 3.15, 88.15, 0, 88.15, true, false),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 2000, 300, 100, 44, 2444, 0, 2444, true, false),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 70, 15, 5, 1.60, 91.60, 0, 91.60, true, false),
('02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CAJÓN PUERTA CORREDERA (Armazón)', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Ud', 950, 200, 50, 28.80, 1228.80, 0, 1228.80, true, false),
('02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 1500, 300, 100, 36, 1936, 0, 1936, true, false),
('02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE TECHOS (Drywall BA 15)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 120, 40, 10, 5.04, 175.04, 0, 175.04, true, false),
('02-A-17', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AISLANTES TÉRMICOS', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 60, 15, 5, 0, 80, 0, 80, true, false);

-- CATEGORÍA: FONTANERÍA
-- ID Categoría: 3d93ed2f-bfec-4f36-834e-2d3c4d7d7260

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 3300, 700, 150, 21.20, 4171.20, 0, 4171.20, true, false),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 2300, 500, 100, 40.52, 2940.52, 0, 2940.52, true, false),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE DESAGÜE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe.', 'Ud', 1075, 225, 50, 8.80, 1358.80, 0, 1358.80, true, false),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 570, 120, 25, 7.64, 722.64, 0, 722.64, true, false),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 900, 190, 40, 13.80, 1143.80, 0, 1143.80, true, false),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 250, 50, 10, 5.60, 315.60, 0, 315.60, true, false),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 500, 100, 20, 12, 632, 0, 632, true, false),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 450, 95, 19, 12.96, 576.96, 0, 576.96, true, false),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 475, 100, 20, 5.40, 600.40, 0, 600.40, true, false),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 250, 50, 10, 5.60, 315.60, 0, 315.60, true, false),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 250, 50, 10, 5.60, 315.60, 0, 315.60, true, false),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 325, 68, 14, 7.56, 414.56, 0, 414.56, true, false),
('03-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 250, 50, 10, 5.60, 315.60, 0, 315.60, true, false);

-- CATEGORÍA: CARPINTERÍA
-- ID Categoría: e4967edd-53b5-459a-bb68-b1fd88ee6836

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE PISOS CON TABLERO Y LISTONES', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 165, 45, 12, 5.20, 227.20, 0, 227.20, true, false),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado o suelo laminado.', 'm²', 68, 18, 5, 3.72, 94.72, 0, 94.72, true, false),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 90, 24, 6, 4.44, 124.44, 0, 124.44, true, false),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO DM LACADO (MO y Materiales)', 'Suministro y colocación de contrazócalo.', 'ml', 26, 7, 2, 0.24, 35.24, 0, 35.24, true, false),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 450, 95, 19, 12.96, 576.96, 0, 576.96, true, false),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 995, 210, 42, 27.72, 1274.72, 0, 1274.72, true, false),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block.', 'Ud', 500, 100, 20, 12, 632, 0, 632, true, false),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajón.', 'Ud', 1150, 242, 48, 28.20, 1468.20, 0, 1468.20, true, false),
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 2260, 475, 95, 50, 2880, 0, 2880, true, false),
('04-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'ACUCHILLADO PISO + BARNIZADO', 'Lijado y barnizado de piso de madera existente.', 'm²', 75, 20, 5, 3.12, 103.12, 0, 103.12, true, false),
('04-C-11', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'EMPLASTECIDO DE LAS LAMAS DE PISO', 'Relleno de juntas de piso laminado.', 'm²', 24, 6, 2, 0.80, 32.80, 0, 32.80, true, false),
('04-C-12', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 75, 20, 5, 3.12, 103.12, 0, 103.12, true, false);

-- CATEGORÍA: ELECTRICIDAD
-- ID Categoría: 243dee0d-edba-4de9-94a4-2a4c17ff607d

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 2750, 580, 116, 53.68, 3499.68, 0, 3499.68, true, false),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 875, 185, 37, 17.16, 1114.16, 0, 1114.16, true, false),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo.', 'Ud', 475, 100, 20, 5.40, 600.40, 0, 600.40, true, false),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 1375, 290, 58, 27.84, 1750.84, 0, 1750.84, true, false),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)', 'Tendido de línea de enchufes estándar.', 'Ud', 1175, 248, 50, 25.16, 1498.16, 0, 1498.16, true, false),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 1175, 248, 50, 25.16, 1498.16, 0, 1498.16, true, false),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SENCILLOS', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 175, 37, 7, 3.20, 222.20, 0, 222.20, true, false),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 275, 58, 12, 6.60, 351.60, 0, 351.60, true, false),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 325, 68, 14, 7.56, 414.56, 0, 414.56, true, false),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE ENCHUFES', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 200, 42, 8, 4, 254, 0, 254, true, false),
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO ENCHUFE INTEMPERIE', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 285, 60, 12, 6.24, 363.24, 0, 363.24, true, false),
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 320, 67, 13, 7.04, 407.04, 0, 407.04, true, false),
('05-E-13', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS ENCHUFE APARATOS DE COCINA', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 200, 42, 8, 4, 254, 0, 254, true, false),
('05-E-14', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 150, 32, 6, 2.80, 190.80, 0, 190.80, true, false),
('05-E-15', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 225, 47, 9, 4.20, 285.20, 0, 285.20, true, false),
('05-E-16', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 975, 205, 41, 19.60, 1240.60, 0, 1240.60, true, false),
('05-E-17', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'BOLETÍN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 1215, 256, 51, 24.50, 1546.50, 0, 1546.50, true, false);

-- CATEGORÍA: CALEFACCIÓN
-- ID Categoría: 5090928c-9b72-4d83-8667-9d01ddbfca47

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 200, 42, 8, 4, 254, 0, 254, true, false),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 200, 42, 8, 4, 254, 0, 254, true, false),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALDERA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 1900, 400, 80, 45.52, 2425.52, 0, 2425.52, true, false),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 900, 190, 38, 13.80, 1141.80, 0, 1141.80, true, false),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 300, 63, 13, 6.24, 382.24, 0, 382.24, true, false),
('06-CAL-06', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 1600, 337, 67, 32.32, 2036.32, 0, 2036.32, true, false),
('06-CAL-07', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN PISO RADIANTE HÚMEDO', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'm²', 316, 67, 13, 7.05, 403.05, 0, 403.05, true, false),
('06-CAL-08', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'ACOMETIDA DE GAS (Aprox.)', 'Coste estimado de conexión a la red de gas general.', 'Ud', 5000, 1053, 211, 101.60, 6365.60, 0, 6365.60, true, false),
('06-CAL-09', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 225, 47, 9, 4.20, 285.20, 0, 285.20, true, false),
('06-CAL-10', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 965, 203, 41, 18.68, 1227.68, 0, 1227.68, true, false);

-- CATEGORÍA: LIMPIEZA
-- ID Categoría: 0f95a55f-12ba-4e0e-ba0d-d01229d05c4c

INSERT INTO price_master_peru (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active, is_custom)
VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 350, 74, 15, 6.72, 445.72, 0, 445.72, true, false),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 500, 105, 21, 10, 636, 0, 636, true, false);

-- Verificación final
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  MIN(pm.final_price) as precio_minimo,
  MAX(pm.final_price) as precio_maximo,
  AVG(pm.final_price) as precio_promedio
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;

SELECT COUNT(*) as total_general FROM price_master_peru;
