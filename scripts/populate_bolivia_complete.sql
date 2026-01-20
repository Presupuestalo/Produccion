-- =====================================================
-- SCRIPT COMPLETO DE PRECIOS PARA BOLIVIA
-- Moneda: Bolivianos (Bs.)
-- Precios ajustados al mercado boliviano
-- =====================================================

-- Limpiar datos existentes de Bolivia
DELETE FROM price_master_bolivia;

-- IDs de categorías (obtenidos de la base de datos)
-- DERRIBOS: 5b38410c-4b7b-412a-9f57-6e74db0cc237
-- ALBAÑILERIA: d6e90b3f-3bc5-4f15-8530-19da496abc5e
-- FONTANERIA: 3d93ed2f-bfec-4f36-834e-2d3c4d7d7260
-- CARPINTERIA: e4967edd-53b5-459a-bb68-b1fd88ee6836
-- ELECTRICIDAD: 243dee0d-edba-4de9-94a4-2a4c17ff607d
-- CALEFACCION: 5090928c-9b72-4d83-8667-9d01ddbfca47
-- LIMPIEZA: 0f95a55f-12ba-4e0e-ba0d-d01229d05c4c

-- =====================================================
-- CATEGORÍA: DEMOLICIONES (DERRIBOS)
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('01-D-01', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'TABIQUES DRYWALL DEMOLICIÓN', 'Demoler tabique existente de drywall, incluyendo mano de obra y eliminación de escombros a punto autorizado.', 'm²', 35, 0, 5, 10, 50, 15, 57.50, true),
('01-D-02', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO MAYÓLICA PAREDES', 'Picado de paredes para la retirada de mayólica o revestimiento cerámico existente en parámetros verticales.', 'm²', 28, 0, 4, 8, 40, 15, 46.00, true),
('01-D-03', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PICADO PISOS', 'Picado de piso y posterior eliminación de escombros.', 'm²', 35, 0, 6, 9, 50, 15, 57.50, true),
('01-D-04', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE FALSO CIELO RASO', 'Retirada y eliminación de falso cielo raso de yeso o drywall.', 'm²', 28, 0, 4, 8, 40, 15, 46.00, true),
('01-D-05', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOLDURAS', 'Retirada de molduras de yeso o madera en el perímetro de techos.', 'ml', 3, 0, 0.5, 1, 4.5, 15, 5.20, true),
('01-D-06', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE PISO LAMINADO Y LISTONES', 'Desmontaje de piso laminado o piso de madera incluyendo los listones inferiores.', 'm²', 18, 0, 2, 5, 25, 15, 28.75, true),
('01-D-07', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO DE MADERA', 'Retirada de contrazócalo de madera y acopio para eliminación.', 'ml', 4, 0, 0.5, 1, 5.5, 15, 6.30, true),
('01-D-08', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE CONTRAZÓCALO CERÁMICO', 'Retirada de contrazócalo cerámico o de mayólica.', 'ml', 8, 0, 1, 2, 11, 15, 12.65, true),
('01-D-09', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'CONTENEDOR ESCOMBROS', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 200, 800, 100, 200, 1300, 15, 1495.00, true),
('01-D-10', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'HORA BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 35, 0, 3, 2, 40, 15, 46.00, true),
('01-D-11', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas de electricidad y fontanería.', 'Ud', 100, 20, 10, 20, 150, 15, 172.50, true),
('01-D-12', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20, 0, 2, 3, 25, 15, 28.75, true),
('01-D-13', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Raspado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 6, 1, 0.5, 1, 8.5, 15, 9.80, true),
('01-D-14', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retirada de inodoro, bidé, lavatorio o bañera.', 'Ud', 100, 10, 15, 25, 150, 15, 172.50, true),
('01-D-15', '5b38410c-4b7b-412a-9f57-6e74db0cc237', 'RETIRO DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 200, 20, 30, 50, 300, 15, 345.00, true);

-- =====================================================
-- CATEGORÍA: ALBAÑILERÍA
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN CONTRAPISO MORTERO', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 60, 40, 10, 15, 125, 15, 143.75, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor para nivelar pisos.', 'm²', 50, 40, 8, 12, 110, 15, 126.50, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN DRYWALL', 'Colocación de una capa de placa de yeso laminado sobre perfilería metálica.', 'm²', 70, 50, 10, 20, 150, 15, 172.50, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 50, 35, 8, 12, 105, 15, 120.75, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUES DRYWALL DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado en ambas caras y aislamiento interior.', 'm²', 80, 60, 12, 18, 170, 15, 195.50, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 60, 15, 8, 12, 95, 15, 109.25, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO PISOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en pisos (No incluye material cerámico).', 'm²', 65, 18, 10, 12, 105, 15, 120.75, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO ENCHAPES', 'Revoque de las paredes para obtener una base lisa y plomada antes de colocar mayólica.', 'm²', 35, 15, 5, 8, 63, 15, 72.45, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'REVOQUE PREVIO LEVANTES TABIQUERÍA', 'Revoque y enlucido de tabiquería nueva antes de pintar.', 'm²', 35, 15, 5, 8, 63, 15, 72.45, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ENLUCIDO PAREDES (Yeso)', 'Aplicación de capa de yeso en techos y paredes para acabado fino.', 'm²', 32, 12, 4, 7, 55, 15, 63.25, true),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 300, 80, 40, 80, 500, 15, 575.00, true),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso en perímetro de techos.', 'ml', 30, 15, 3, 7, 55, 15, 63.25, true),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE TECHOS (Drywall)', 'Instalación de falso cielo raso en placa de yeso laminado.', 'm²', 50, 35, 8, 12, 105, 15, 120.75, true);

-- =====================================================
-- CATEGORÍA: FONTANERÍA
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('03-F-01', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE BAÑO (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 500, 300, 80, 120, 1000, 15, 1150.00, true),
('03-F-02', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RED DE COCINA (Puntos de consumo)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 350, 200, 60, 90, 700, 15, 805.00, true),
('03-F-03', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'RETIRADA BAJANTE Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante de desagüe en PVC.', 'Ud', 150, 80, 30, 40, 300, 15, 345.00, true),
('03-F-04', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 80, 50, 15, 20, 165, 15, 189.75, true),
('03-F-05', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos en cocina.', 'Ud', 120, 80, 20, 30, 250, 15, 287.50, true),
('03-F-06', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro con conexiones de agua y desagüe.', 'Ud', 80, 20, 10, 15, 125, 15, 143.75, true),
('03-F-07', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha con desagüe.', 'Ud', 100, 30, 15, 20, 165, 15, 189.75, true),
('03-F-08', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MUEBLE LAVATORIO (Montaje MO)', 'Instalación de mueble y lavatorio, incluyendo espejo y aplique de luz.', 'Ud', 90, 25, 12, 18, 145, 15, 166.75, true),
('03-F-09', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera con perfiles y vidrio.', 'Ud', 95, 30, 12, 18, 155, 15, 178.25, true),
('03-F-10', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 50, 15, 8, 12, 85, 15, 97.75, true),
('03-F-11', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'INSTALACIÓN GRIFO LAVATORIO (Montaje MO)', 'Montaje de monomando de lavatorio con conexiones.', 'Ud', 50, 15, 8, 12, 85, 15, 97.75, true),
('03-F-12', '3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'MONTAJE FREGADERO Y ELECTRODOMÉSTICOS (MO)', 'Instalación y conexionado de fregadero, lavadora y lavavajillas.', 'Ud', 70, 20, 10, 15, 115, 15, 132.25, true);

-- =====================================================
-- CATEGORÍA: CARPINTERÍA
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('04-C-01', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'NIVELACIÓN DE PISOS CON TABLERO', 'Colocación de tablero sobre listones para nivelar un piso antes de instalar piso laminado.', 'm²', 65, 40, 10, 15, 130, 15, 149.50, true),
('04-C-02', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO LAMINADO (MO)', 'Mano de obra de colocación de piso laminado flotante tipo click.', 'm²', 30, 10, 5, 8, 53, 15, 60.95, true),
('04-C-03', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'INSTALACIÓN PISO VINÍLICO (MO)', 'Mano de obra de colocación de piso de vinilo tipo click.', 'm²', 35, 12, 6, 9, 62, 15, 71.30, true),
('04-C-04', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN CONTRAZÓCALO (MO y Materiales)', 'Suministro y colocación de contrazócalo de madera o MDF lacado.', 'ml', 12, 8, 2, 3, 25, 15, 28.75, true),
('04-C-05', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco de madera o metálico para puertas.', 'Ud', 80, 50, 12, 18, 160, 15, 184.00, true),
('04-C-06', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block con bisagras y manija.', 'Ud', 100, 30, 15, 20, 165, 15, 189.75, true),
('04-C-07', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín con rieles.', 'Ud', 200, 80, 30, 40, 350, 15, 402.50, true),
('04-C-08', 'e4967edd-53b5-459a-bb68-b1fd88ee6836', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad blindada con cerradura multipunto.', 'Ud', 400, 150, 60, 90, 700, 15, 805.00, true);

-- =====================================================
-- CATEGORÍA: ELECTRICIDAD
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('05-E-01', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO GENERAL 18 ELEMENTOS', 'Instalación de tablero eléctrico con 18 módulos y elementos de protección (disyuntores, diferenciales).', 'Ud', 400, 350, 60, 90, 900, 15, 1035.00, true),
('05-E-02', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV, internet y voz/datos.', 'Ud', 150, 80, 25, 35, 290, 15, 333.50, true),
('05-E-03', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo o portero eléctrico convencional.', 'Ud', 80, 60, 15, 20, 175, 15, 201.25, true),
('05-E-04', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TABLERO DE OBRA (Instalación temporal)', 'Colocación de un tablero eléctrico provisional para la reforma.', 'Ud', 200, 150, 30, 45, 425, 15, 488.75, true),
('05-E-05', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE TOMACORRIENTES MONOFÁSICA (2,5mm2)', 'Tendido de línea de tomacorrientes estándar con cable de 2.5mm².', 'Ud', 180, 120, 30, 45, 375, 15, 431.25, true),
('05-E-06', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general con cable de 1.5mm².', 'Ud', 180, 120, 30, 45, 375, 15, 431.25, true),
('05-E-07', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 30, 15, 5, 8, 58, 15, 66.70, true),
('05-E-08', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 45, 25, 8, 12, 90, 15, 103.50, true),
('05-E-09', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS DE TOMACORRIENTES', 'Mecanismo e instalación de un tomacorriente de pared estándar.', 'Ud', 35, 18, 6, 9, 68, 15, 78.20, true),
('05-E-10', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 50, 35, 8, 12, 105, 15, 120.75, true),
('05-E-11', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'PUNTOS TOMACORRIENTE APARATOS DE COCINA', 'Tomacorriente para electrodomésticos de cocina (lavadora, horno, etc.).', 'Ud', 35, 18, 6, 9, 68, 15, 78.20, true),
('05-E-12', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso cielo raso (focos no incluidos).', 'Ud', 30, 12, 5, 8, 55, 15, 63.25, true),
('05-E-13', '243dee0d-edba-4de9-94a4-2a4c17ff607d', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre en puerta de entrada.', 'Ud', 40, 25, 6, 9, 80, 15, 92.00, true);

-- =====================================================
-- CATEGORÍA: CALEFACCIÓN
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('06-CAL-01', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión de radiador eléctrico a la línea eléctrica.', 'Ud', 40, 15, 6, 9, 70, 15, 80.50, true),
('06-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RECOLOCAR CALENTADOR DE GAS', 'Desmontaje y montaje de calentador de gas en el mismo sitio.', 'Ud', 40, 15, 6, 9, 70, 15, 80.50, true),
('06-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALENTADOR DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de un nuevo calentador de gas.', 'Ud', 350, 100, 50, 75, 575, 15, 661.25, true),
('06-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO ELÉCTRICO 80L', 'Instalación y conexionado de termo eléctrico de 80 litros.', 'Ud', 180, 60, 25, 35, 300, 15, 345.00, true);

-- =====================================================
-- CATEGORÍA: LIMPIEZA
-- =====================================================

INSERT INTO price_master_bolivia (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('07-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra durante el proceso de construcción.', 'Ud', 60, 15, 8, 12, 95, 15, 109.25, true),
('07-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores, dejando todo listo para habitar.', 'Ud', 150, 30, 20, 30, 230, 15, 264.50, true);

-- Verificar inserción
SELECT 
  pc.name as categoria,
  COUNT(*) as total_precios,
  ROUND(AVG(pm.final_price), 2) as precio_promedio,
  ROUND(MIN(pm.final_price), 2) as precio_minimo,
  ROUND(MAX(pm.final_price), 2) as precio_maximo
FROM price_master_bolivia pm
JOIN price_categories pc ON pm.category_id = pc.id
GROUP BY pc.name, pc.display_order
ORDER BY pc.display_order;
