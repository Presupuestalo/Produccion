-- ============================================
-- POBLACIÓN COMPLETA DE PRECIOS PARA PERÚ
-- Basado en la lista española con terminología peruana
-- Precios en Soles Peruanos (PEN)
-- ============================================

-- Limpiar tabla existente
TRUNCATE TABLE price_master_peru;

-- ============================================
-- 01. DEMOLICIONES (DERRIBOS)
-- Category ID: 5b38410c-4b7b-412a-9f57-6e74db0cc237
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 45.0, 5.0, 10.0, 5.0, 65.0, 0.15, 74.75, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o enchape cerámico existente en parámetros verticales.', 'm²', 38.0, 4.0, 8.0, 4.0, 54.0, 0.15, 62.10, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 55.0, 6.0, 12.0, 6.0, 79.0, 0.15, 90.85, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 38.0, 4.0, 8.0, 4.0, 54.0, 0.15, 62.10, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de techos.', 'ml', 4.0, 0.5, 1.0, 0.5, 6.0, 0.15, 6.90, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o parquet incluyendo los listones inferiores.', 'm²', 22.0, 2.0, 5.0, 3.0, 32.0, 0.15, 36.80, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 7.0, 0.8, 1.5, 0.7, 10.0, 0.15, 11.50, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 15.0, 1.5, 3.0, 1.5, 21.0, 0.15, 24.15, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a botadero autorizado.', 'Ud', 1300.0, 200.0, 300.0, 100.0, 1900.0, 0.15, 2185.0, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 45.0, 0.0, 5.0, 2.0, 52.0, 0.15, 59.80, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/GASFITERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 380.0, 50.0, 30.0, 20.0, 480.0, 0.15, 552.0, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'DESMONTAJE HOJAS PUERTAS Y RETIRO', 'Desmontaje de hoja de puerta existente y posterior retiro.', 'Ud', 60.0, 5.0, 8.0, 4.0, 77.0, 0.15, 88.55, true),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PREPARACIÓN PAREDES (Textura/Papel)', 'Raspado de paredes para eliminación de textura, papel tapiz o materiales blandos.', 'm²', 9.0, 1.0, 2.0, 1.0, 13.0, 0.15, 14.95, true),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidet, lavatorio o tina.', 'Ud', 380.0, 50.0, 30.0, 20.0, 480.0, 0.15, 552.0, true),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 750.0, 80.0, 50.0, 40.0, 920.0, 0.15, 1058.0, true),
('01-D-16', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CLOSETS Y RESTO MOBILIARIO', 'Desmontaje de closets empotrados o mobiliario fijo a medida.', 'Ud', 1100.0, 120.0, 80.0, 60.0, 1360.0, 0.15, 1564.0, true);

-- ============================================
-- 02. ALBAÑILERÍA
-- Category ID: d6e90b3f-3bc5-4f15-8530-19da496abc5e
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN CONTRAPISO MORTERO Y ARCILLA EXPANDIDA', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 95.0, 25.0, 15.0, 10.0, 145.0, 0.15, 166.75, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 80.0, 25.0, 12.0, 8.0, 125.0, 0.15, 143.75, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN DE REVESTIMIENTO EN DRYWALL (13+45)', 'Colocación de una capa de plancha de drywall de 13mm sobre perfilería.', 'm²', 125.0, 35.0, 15.0, 10.0, 185.0, 0.15, 212.75, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo pandereta o hueco.', 'm²', 75.0, 25.0, 10.0, 8.0, 118.0, 0.15, 135.70, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TABIQUES DRYWALL DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble plancha de drywall de 13mm en ambas caras y aislamiento interior.', 'm²', 145.0, 45.0, 18.0, 12.0, 220.0, 0.15, 253.0, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'ENCHAPE MAYÓLICA PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 95.0, 25.0, 12.0, 8.0, 140.0, 0.15, 161.0, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'INSTALACIÓN PISOS (Colocación MO)', 'Mano de obra de colocación de cerámicos o porcelanatos en pisos (No incluye material cerámico).', 'm²', 105.0, 30.0, 15.0, 10.0, 160.0, 0.15, 184.0, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'INSTALACIÓN PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de cerámicos sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 108.0, 32.0, 15.0, 10.0, 165.0, 0.15, 189.75, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y plomada antes de enchapar.', 'm²', 45.0, 12.0, 8.0, 5.0, 70.0, 0.15, 80.50, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO LEVANTE TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 45.0, 12.0, 8.0, 5.0, 70.0, 0.15, 80.50, true),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes.', 'm²', 42.0, 12.0, 8.0, 5.0, 67.0, 0.15, 77.05, true),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'UNIDAD TAPADO DE CANALETAS INSTALACIONES', 'Relleno y tapado de todas las canaletas realizadas para el paso de instalaciones de gasfitería y electricidad.', 'Ud', 1250.0, 180.0, 100.0, 70.0, 1600.0, 0.15, 1840.0, true),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 45.0, 12.0, 8.0, 5.0, 70.0, 0.15, 80.50, true),
('02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN CAJÓN PUERTA CORREDERA (Armazón)', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Ud', 580.0, 120.0, 50.0, 30.0, 780.0, 0.15, 897.0, true),
('02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a gasfiteros, electricistas o carpinteros.', 'Ud', 950.0, 80.0, 50.0, 40.0, 1120.0, 0.15, 1288.0, true),
('02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'BAJADO DE TECHOS (Drywall)', 'Instalación de falso cielo raso en plancha de drywall.', 'm²', 82.0, 22.0, 12.0, 8.0, 124.0, 0.15, 142.60, true),
('02-A-17', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AISLANTES TÉRMICOS (Fibra de vidrio)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 40.0, 12.0, 6.0, 4.0, 62.0, 0.15, 71.30, true);

-- ============================================
-- 03. GASFITERÍA (FONTANERÍA)
-- Category ID: 3d93ed2f-bfec-4f36-834e-2d3c4d7d7260
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavatorio, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 2050.0, 350.0, 150.0, 100.0, 2650.0, 0.15, 3047.50, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE COCINA (Puntos de consumo: Lavadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 1430.0, 250.0, 100.0, 70.0, 1850.0, 0.15, 2127.50, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RETIRO MONTANTE DESAGÜE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de montante.', 'Ud', 670.0, 120.0, 50.0, 30.0, 870.0, 0.15, 1000.50, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 355.0, 65.0, 30.0, 20.0, 470.0, 0.15, 540.50, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 560.0, 105.0, 45.0, 30.0, 740.0, 0.15, 851.0, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 155.0, 15.0, 10.0, 8.0, 188.0, 0.15, 216.20, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 310.0, 35.0, 20.0, 15.0, 380.0, 0.15, 437.0, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique.', 'Ud', 280.0, 30.0, 18.0, 12.0, 340.0, 0.15, 391.0, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o tina.', 'Ud', 295.0, 32.0, 18.0, 12.0, 357.0, 0.15, 410.55, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 155.0, 15.0, 10.0, 8.0, 188.0, 0.15, 216.20, true),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN GRIFO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio.', 'Ud', 155.0, 15.0, 10.0, 8.0, 188.0, 0.15, 216.20, true),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE LAVADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 202.0, 22.0, 12.0, 8.0, 244.0, 0.15, 280.60, true),
('03-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 155.0, 15.0, 10.0, 8.0, 188.0, 0.15, 216.20, true);

-- ============================================
-- 04. CARPINTERÍA
-- Category ID: e4967edd-53b5-459a-bb68-b1fd88ee6836
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'NIVELACIÓN DE PISOS CON TABLERO Y LISTONES', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 108.0, 28.0, 15.0, 10.0, 161.0, 0.15, 185.15, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado o parquet flotante.', 'm²', 45.0, 8.0, 5.0, 3.0, 61.0, 0.15, 70.15, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 59.0, 10.0, 6.0, 4.0, 79.0, 0.15, 90.85, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN CONTRAZÓCALO MDF LACADO (MO y Materiales)', 'Suministro y colocación de contrazócalo.', 'ml', 17.0, 4.0, 2.0, 1.5, 24.5, 0.15, 28.18, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 280.0, 45.0, 20.0, 15.0, 360.0, 0.15, 414.0, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 620.0, 95.0, 40.0, 30.0, 785.0, 0.15, 902.75, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA BATIENTE 1 HOJA (MO)', 'Instalación de puerta batiente en block.', 'Ud', 310.0, 35.0, 20.0, 15.0, 380.0, 0.15, 437.0, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajón.', 'Ud', 715.0, 105.0, 50.0, 35.0, 905.0, 0.15, 1040.75, true),
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 1400.0, 180.0, 100.0, 70.0, 1750.0, 0.15, 2012.50, true),
('04-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'LIJADO PISO + BARNIZADO', 'Lijado y barnizado de piso de madera existente.', 'm²', 50.0, 8.0, 5.0, 3.0, 66.0, 0.15, 75.90, true),
('04-C-11', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'MASILLADO DE LAS LAMAS DE PISO LAMINADO', 'Relleno de juntas de piso laminado.', 'm²', 15.0, 3.0, 2.0, 1.0, 21.0, 0.15, 24.15, true),
('04-C-12', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 50.0, 5.0, 3.0, 2.0, 60.0, 0.15, 69.0, true);

-- ============================================
-- 05. ELECTRICIDAD
-- Category ID: 243dee0d-edba-4de9-94a4-2a4c17ff607d
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 1700.0, 280.0, 120.0, 80.0, 2180.0, 0.15, 2507.0, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 545.0, 85.0, 40.0, 28.0, 698.0, 0.15, 802.70, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'SUMINISTRO E INSTALACIÓN INTERCOMUNICADOR CONVENCIONAL', 'Instalación de intercomunicador.', 'Ud', 295.0, 45.0, 22.0, 15.0, 377.0, 0.15, 433.55, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 855.0, 130.0, 60.0, 40.0, 1085.0, 0.15, 1247.75, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LÍNEA DE TOMACORRIENTES MONOFÁSICA (2,5mm2)', 'Tendido de línea de tomacorrientes estándar.', 'Ud', 730.0, 115.0, 52.0, 35.0, 932.0, 0.15, 1071.80, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LÍNEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 730.0, 115.0, 52.0, 35.0, 932.0, 0.15, 1071.80, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 109.0, 17.0, 8.0, 5.0, 139.0, 0.15, 159.85, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 171.0, 26.0, 12.0, 8.0, 217.0, 0.15, 249.55, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 202.0, 31.0, 15.0, 10.0, 258.0, 0.15, 296.70, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 124.0, 19.0, 9.0, 6.0, 158.0, 0.15, 181.70, true),
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTO TOMACORRIENTE INTEMPERIE', 'Mecanismo e instalación de tomacorriente apto para exterior.', 'Ud', 177.0, 27.0, 13.0, 9.0, 226.0, 0.15, 259.90, true),
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 199.0, 30.0, 14.0, 10.0, 253.0, 0.15, 290.95, true),
('05-E-13', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS TOMACORRIENTE APARATOS DE COCINA', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Ud', 124.0, 19.0, 9.0, 6.0, 158.0, 0.15, 181.70, true),
('05-E-14', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso cielo raso (focos no incluidos).', 'Ud', 93.0, 14.0, 7.0, 5.0, 119.0, 0.15, 136.85, true),
('05-E-15', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 140.0, 21.0, 10.0, 7.0, 178.0, 0.15, 204.70, true),
('05-E-16', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 605.0, 95.0, 42.0, 28.0, 770.0, 0.15, 885.50, true),
('05-E-17', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'CERTIFICADO Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 755.0, 120.0, 55.0, 38.0, 968.0, 0.15, 1113.20, true);

-- ============================================
-- 06. CALEFACCIÓN
-- Category ID: 5090928c-9b72-4d83-8667-9d01ddbfca47
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 124.0, 19.0, 9.0, 6.0, 158.0, 0.15, 181.70, true),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'RECOLOCAR TERMA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de terma en el mismo sitio.', 'Ud', 124.0, 19.0, 9.0, 6.0, 158.0, 0.15, 181.70, true),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'COLOCACIÓN TERMA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva terma.', 'Ud', 1180.0, 185.0, 85.0, 58.0, 1508.0, 0.15, 1734.20, true),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 560.0, 88.0, 40.0, 27.0, 715.0, 0.15, 822.25, true),
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 186.0, 29.0, 14.0, 9.0, 238.0, 0.15, 273.70, true),
('06-CAL-06', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 995.0, 155.0, 70.0, 48.0, 1268.0, 0.15, 1458.20, true),
('06-CAL-07', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN PISO RADIANTE HÚMEDO', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'm²', 197.0, 31.0, 14.0, 10.0, 252.0, 0.15, 289.80, true),
('06-CAL-08', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'ACOMETIDA DE GAS (Aprox.)', 'Costo estimado de conexión a la red de gas general.', 'Ud', 3100.0, 485.0, 220.0, 150.0, 3955.0, 0.15, 4548.25, true),
('06-CAL-09', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 140.0, 21.0, 10.0, 7.0, 178.0, 0.15, 204.70, true),
('06-CAL-10', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN TERMA ELÉCTRICA 80L', 'Instalación y conexionado de terma eléctrica.', 'Ud', 600.0, 94.0, 42.0, 29.0, 765.0, 0.15, 879.75, true);

-- ============================================
-- 07. LIMPIEZA
-- Category ID: 0f95a55f-12ba-4e0e-ba0d-d01229d05c4c
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 217.0, 10.0, 5.0, 3.0, 235.0, 0.15, 270.25, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retiro de restos menores.', 'Ud', 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true);

-- ============================================
-- 08. MATERIALES
-- Category ID: (Necesitamos verificar si existe esta categoría)
-- Por ahora usaré la categoría de LIMPIEZA como placeholder
-- ============================================

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
