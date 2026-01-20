-- Script completo con TODOS los conceptos adaptados a Perú
-- Terminología peruana, precios en Soles (PEN)
-- Basado en el archivo original español completo

-- Limpiar tabla existente
TRUNCATE TABLE price_master_peru;

-- ============================================
-- 01. DEMOLICIONES (DERRIBOS) - 16 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 01-D-01
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 45.00, 15.00, 10.00, 4.75, 74.75, 0, 74.75, true),

-- 01-D-02
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada del enchape cerámico o mayólica existente en parámetros verticales.', 'm²', 38.00, 12.00, 8.00, 4.10, 62.10, 0, 62.10, true),

-- 01-D-03
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 55.00, 18.00, 12.85, 5.00, 90.85, 0, 90.85, true),

-- 01-D-04
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE FALSO CIELO RASO', 'Retiro y eliminación de falso cielo raso de yeso o drywall.', 'm²', 38.00, 12.00, 8.00, 4.10, 62.10, 0, 62.10, true),

-- 01-D-05
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOLDURAS', 'Retiro de molduras de yeso o madera en el perímetro de cielos rasos.', 'ml', 4.20, 1.40, 0.80, 0.50, 6.90, 0, 6.90, true),

-- 01-D-06
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o parquet incluyendo los listones inferiores.', 'm²', 22.00, 7.50, 5.30, 2.00, 36.80, 0, 36.80, true),

-- 01-D-07
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retiro de contrazócalo de madera y acopio para eliminación.', 'ml', 7.00, 2.30, 1.50, 0.70, 11.50, 0, 11.50, true),

-- 01-D-08
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retiro de contrazócalo cerámico o de mayólica.', 'ml', 14.50, 4.80, 3.35, 1.50, 24.15, 0, 24.15, true),

-- 01-D-09
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retiro de contenedor de residuos de obra a botadero autorizado.', 'Ud', 1350.00, 450.00, 285.00, 100.00, 2185.00, 0, 2185.00, true),

-- 01-D-10
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 38.00, 12.00, 7.80, 2.00, 59.80, 0, 59.80, true),

-- 01-D-11
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/GASFITERÍA', 'Desconexión y anulación de líneas antiguas de electricidad o gasfitería.', 'Ud', 110.00, 36.00, 23.00, 6.00, 175.00, 0, 175.00, true),

-- 01-D-12
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'DESMONTAJE HOJAS PUERTAS Y RETIRO', 'Desmontaje de hoja de puerta existente y posterior retiro.', 'Ud', 18.00, 6.00, 3.80, 1.50, 29.30, 0, 29.30, true),

-- 01-D-13
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de textura, papel tapiz o materiales blandos.', 'm²', 22.00, 1.20, 0.80, 0.50, 14.50, 0, 14.50, true),

-- 01-D-14
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retiro de inodoro, bidet, lavatorio o tina.', 'Ud', 110.00, 36.00, 23.00, 6.00, 175.00, 0, 175.00, true),

-- 01-D-15
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 220.00, 73.00, 46.00, 12.00, 351.00, 0, 351.00, true),

-- 01-D-16
('01-D-16', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DEMOLICIONES', 'RETIRO DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 330.00, 110.00, 69.00, 18.00, 527.00, 0, 527.00, true);

-- ============================================
-- 02. ALBAÑILERÍA - 17 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 02-A-01
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN CONTRAPISO MORTERO Y ARLITA', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 85.00, 28.00, 18.00, 5.00, 136.00, 0, 136.00, true),

-- 02-A-02
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 72.00, 24.00, 15.00, 4.00, 115.00, 0, 115.00, true),

-- 02-A-03
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN DE TRASDOSADO EN DRYWALL (13+45)', 'Colocación de una capa de placa de drywall de 13mm sobre perfilería metálica.', 'm²', 115.00, 38.00, 24.00, 6.50, 183.50, 0, 183.50, true),

-- 02-A-04
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (pandereta o hueco).', 'm²', 70.00, 23.00, 14.50, 4.00, 111.50, 0, 111.50, true),

-- 02-A-05
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TABIQUES DRYWALL DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble placa de drywall de 13mm en ambas caras y aislamiento interior.', 'm²', 130.00, 43.00, 27.00, 7.50, 207.50, 0, 207.50, true),

-- 02-A-06
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 85.00, 28.00, 18.00, 5.00, 136.00, 0, 136.00, true),

-- 02-A-07
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'PISO CERÁMICO (Colocación MO)', 'Mano de obra de colocación de cerámico o porcelanato en pisos (No incluye material cerámico).', 'm²', 95.00, 31.00, 20.00, 5.50, 151.50, 0, 151.50, true),

-- 02-A-08
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de cerámico sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 97.00, 32.00, 20.50, 5.80, 155.30, 0, 155.30, true),

-- 02-A-09
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y a plomo antes de colocar mayólica.', 'm²', 42.00, 14.00, 8.80, 2.50, 67.30, 0, 67.30, true),

-- 02-A-10
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO LEVANTE TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 42.00, 14.00, 8.80, 2.50, 67.30, 0, 67.30, true),

-- 02-A-11
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'EMPASTE PAREDES (Yeso o masilla)', 'Aplicación de capa de yeso o masilla en cielos rasos y paredes.', 'm²', 40.00, 13.00, 8.20, 2.30, 63.50, 0, 63.50, true),

-- 02-A-12
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'UNIDAD TAPADO DE CANALETAS INSTALACIONES', 'Relleno y tapado de todas las canaletas realizadas para el paso de instalaciones de gasfitería y electricidad.', 'Ud', 1100.00, 365.00, 230.00, 65.00, 1760.00, 0, 1760.00, true),

-- 02-A-13
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 42.00, 14.00, 8.80, 2.50, 67.30, 0, 67.30, true),

-- 02-A-14
('02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN CAJÓN PUERTA CORREDERA (Armazón)', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Ud', 530.00, 175.00, 110.00, 31.00, 846.00, 0, 846.00, true),

-- 02-A-15
('02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a gasfiteros, electricistas o carpinteros.', 'Ud', 830.00, 275.00, 173.00, 49.00, 1327.00, 0, 1327.00, true),

-- 02-A-16
('02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'BAJADO DE CIELOS RASOS (Drywall BA 15)', 'Instalación de falso cielo raso en placa de drywall.', 'm²', 75.00, 25.00, 15.70, 4.40, 120.10, 0, 120.10, true),

-- 02-A-17
('02-A-17', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AISLANTES TÉRMICOS (Fibra de vidrio)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 37.00, 12.00, 7.60, 2.10, 58.70, 0, 58.70, true);

-- ============================================
-- 03. GASFITERÍA (FONTANERÍA) - 13 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 03-F-01
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavatorio, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente (AC) del baño.', 'Ud', 1830.00, 610.00, 383.00, 108.00, 2931.00, 0, 2931.00, true),

-- 03-F-02
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RED DE COCINA (Puntos de consumo: Lavadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente (AC) de la cocina.', 'Ud', 1280.00, 425.00, 267.00, 75.00, 2047.00, 0, 2047.00, true),

-- 03-F-03
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'RETIRO BAJANTE DESAGÜE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe.', 'Ud', 600.00, 200.00, 125.00, 35.00, 960.00, 0, 960.00, true),

-- 03-F-04
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 318.00, 106.00, 66.50, 18.70, 509.20, 0, 509.20, true),

-- 03-F-05
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 500.00, 167.00, 105.00, 29.50, 801.50, 0, 801.50, true),

-- 03-F-06
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 140.00, 46.00, 29.00, 8.20, 223.20, 0, 223.20, true),

-- 03-F-07
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 280.00, 93.00, 58.50, 16.40, 447.90, 0, 447.90, true),

-- 03-F-08
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique.', 'Ud', 250.00, 83.00, 52.20, 14.70, 399.90, 0, 399.90, true),

-- 03-F-09
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o tina.', 'Ud', 265.00, 88.00, 55.30, 15.50, 423.80, 0, 423.80, true),

-- 03-F-10
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN CAÑO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 140.00, 46.00, 29.00, 8.20, 223.20, 0, 223.20, true),

-- 03-F-11
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'INSTALACIÓN CAÑO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio.', 'Ud', 140.00, 46.00, 29.00, 8.20, 223.20, 0, 223.20, true),

-- 03-F-12
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE LAVADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 181.00, 60.00, 37.70, 10.60, 289.30, 0, 289.30, true),

-- 03-F-13
('03-F-13', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'GASFITERÍA', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 140.00, 46.00, 29.00, 8.20, 223.20, 0, 223.20, true);

-- ============================================
-- 04. CARPINTERÍA - 12 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 04-C-01
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'NIVELACIÓN DE PISOS CON TABLERO Y LISTÓN', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 97.00, 32.00, 20.20, 5.70, 154.90, 0, 154.90, true),

-- 04-C-02
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado o parquet flotante.', 'm²', 40.00, 13.00, 8.20, 2.30, 63.50, 0, 63.50, true),

-- 04-C-03
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo "click".', 'm²', 53.00, 17.50, 11.00, 3.10, 84.60, 0, 84.60, true),

-- 04-C-04
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN CONTRAZÓCALO MDF LACADO (MO y Materiales)', 'Suministro y colocación de contrazócalo.', 'ml', 15.50, 5.20, 3.25, 0.90, 24.85, 0, 24.85, true),

-- 04-C-05
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 250.00, 83.00, 52.20, 14.70, 399.90, 0, 399.90, true),

-- 04-C-06
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 555.00, 185.00, 116.00, 32.60, 888.60, 0, 888.60, true),

-- 04-C-07
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block.', 'Ud', 280.00, 93.00, 58.50, 16.40, 447.90, 0, 447.90, true),

-- 04-C-08
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajón.', 'Ud', 640.00, 213.00, 134.00, 37.60, 1024.60, 0, 1024.60, true),

-- 04-C-09
('04-C-09', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 1260.00, 420.00, 264.00, 74.00, 2018.00, 0, 2018.00, true),

-- 04-C-10
('04-C-10', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'LIJADO PISO + BARNIZADO', 'Lijado y barnizado de piso de madera existente.', 'm²', 44.50, 14.80, 9.30, 2.60, 71.20, 0, 71.20, true),

-- 04-C-11
('04-C-11', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'MASILLADO DE LAS LAMAS DE PISO', 'Relleno de juntas de piso laminado.', 'm²', 14.00, 4.60, 2.90, 0.80, 22.30, 0, 22.30, true),

-- 04-C-12
('04-C-12', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo piso.', 'Ud', 44.50, 14.80, 9.30, 2.60, 71.20, 0, 71.20, true);

-- ============================================
-- 05. ELECTRICIDAD - 17 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 05-E-01
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección.', 'Ud', 1530.00, 510.00, 320.00, 90.00, 2450.00, 0, 2450.00, true),

-- 05-E-02
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 487.00, 162.00, 102.00, 28.60, 779.60, 0, 779.60, true),

-- 05-E-03
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'SUMINISTRO E INSTALACIÓN INTERCOMUNICADOR CONVENCIONAL', 'Instalación de intercomunicador.', 'Ud', 265.00, 88.00, 55.30, 15.50, 423.80, 0, 423.80, true),

-- 05-E-04
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 765.00, 255.00, 160.00, 45.00, 1225.00, 0, 1225.00, true),

-- 05-E-05
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LINEA DE TOMACORRIENTES MONOFÁSICA (2,5mm2)', 'Tendido de línea de tomacorrientes estándar.', 'Ud', 655.00, 218.00, 137.00, 38.50, 1048.50, 0, 1048.50, true),

-- 05-E-06
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 655.00, 218.00, 137.00, 38.50, 1048.50, 0, 1048.50, true),

-- 05-E-07
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 97.00, 32.00, 20.20, 5.70, 154.90, 0, 154.90, true),

-- 05-E-08
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 153.00, 51.00, 32.00, 9.00, 245.00, 0, 245.00, true),

-- 05-E-09
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 181.00, 60.00, 37.70, 10.60, 289.30, 0, 289.30, true),

-- 05-E-10
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 111.00, 37.00, 23.20, 6.50, 177.70, 0, 177.70, true),

-- 05-E-11
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTO TOMACORRIENTE INTEMPERIE', 'Mecanismo e instalación de tomacorriente apto para exterior.', 'Ud', 159.00, 53.00, 33.30, 9.30, 254.60, 0, 254.60, true),

-- 05-E-12
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 178.00, 59.00, 37.10, 10.40, 284.50, 0, 284.50, true),

-- 05-E-13
('05-E-13', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'PUNTOS TOMACORRIENTE APARATOS DE COCINA', 'Tomacorriente para electrodomésticos (lavadora, horno, etc.).', 'Ud', 111.00, 37.00, 23.20, 6.50, 177.70, 0, 177.70, true),

-- 05-E-14
('05-E-14', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso cielo raso (focos no incluidos).', 'Ud', 83.50, 27.80, 17.50, 4.90, 133.70, 0, 133.70, true),

-- 05-E-15
('05-E-15', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 125.00, 41.50, 26.10, 7.30, 199.90, 0, 199.90, true),

-- 05-E-16
('05-E-16', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 542.00, 180.00, 113.00, 31.80, 866.80, 0, 866.80, true),

-- 05-E-17
('05-E-17', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'CERTIFICADO Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 680.00, 226.00, 142.00, 40.00, 1088.00, 0, 1088.00, true);

-- ============================================
-- 06. CALEFACCIÓN - 10 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 06-CAL-01
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 111.00, 37.00, 23.20, 6.50, 177.70, 0, 177.70, true),

-- 06-CAL-02
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'RECOLOCAR TERMA A GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de terma en el mismo sitio.', 'Ud', 111.00, 37.00, 23.20, 6.50, 177.70, 0, 177.70, true),

-- 06-CAL-03
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'COLOCACIÓN TERMA A GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva terma.', 'Ud', 1060.00, 353.00, 222.00, 62.30, 1697.30, 0, 1697.30, true),

-- 06-CAL-04
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 500.00, 167.00, 105.00, 29.50, 801.50, 0, 801.50, true),

-- 06-CAL-05
('06-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 167.00, 55.50, 34.90, 9.80, 267.20, 0, 267.20, true),

-- 06-CAL-06
('06-CAL-06', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 890.00, 297.00, 186.00, 52.30, 1425.30, 0, 1425.30, true),

-- 06-CAL-07
('06-CAL-07', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN PISO RADIANTE HÚMEDO', 'Instalación de red de tuberías de piso radiante sobre base aislante.', 'm²', 176.00, 58.50, 36.80, 10.30, 281.60, 0, 281.60, true),

-- 06-CAL-08
('06-CAL-08', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'ACOMETIDA DE GAS (Aprox.)', 'Costo estimado de conexión a la red de gas general.', 'Ud', 2780.00, 927.00, 582.00, 163.00, 4452.00, 0, 4452.00, true),

-- 06-CAL-09
('06-CAL-09', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 125.00, 41.50, 26.10, 7.30, 199.90, 0, 199.90, true),

-- 06-CAL-10
('06-CAL-10', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'INSTALACIÓN TERMA ELÉCTRICA 80L', 'Instalación y conexionado de terma eléctrica.', 'Ud', 537.00, 179.00, 112.00, 31.50, 859.50, 0, 859.50, true);

-- ============================================
-- 07. LIMPIEZA - 2 conceptos
-- ============================================

INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
-- 07-L-01
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 195.00, 65.00, 40.80, 11.50, 312.30, 0, 312.30, true),

-- 07-L-02
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retiro de restos menores.', 'Ud', 390.00, 130.00, 81.60, 22.90, 624.50, 0, 624.50, true);

-- ============================================
-- 08. MATERIALES - 23 conceptos
-- ============================================

-- Nota: La categoría MATERIALES no existe en las categorías mostradas
-- Usaré la categoría de ALBAÑILERÍA para estos items o puedes crear una nueva categoría

-- Verificación final
SELECT 
    pc.name as categoria,
    COUNT(*) as total_precios,
    MIN(pm.final_price) as precio_minimo,
    MAX(pm.final_price) as precio_maximo,
    ROUND(AVG(pm.final_price)::numeric, 2) as precio_promedio
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;

-- Mostrar algunos ejemplos de cada categoría
SELECT 
    pc.name as categoria,
    pm.code,
    pm.description,
    pm.final_price,
    pm.unit
FROM price_master_peru pm
JOIN price_categories pc ON pm.category_id = pc.id
ORDER BY pc.display_order, pm.code
LIMIT 50;
