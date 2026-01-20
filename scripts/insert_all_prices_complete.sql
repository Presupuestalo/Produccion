-- Script completo para insertar TODOS los 93 precios maestros
-- Elimina políticas RLS existentes, limpia tablas, inserta categorías y precios

-- Paso 1: Eliminar dinámicamente todas las políticas RLS existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename IN ('price_categories', 'price_master', 'price_history')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Paso 2: Limpiar tablas existentes
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Paso 3: Insertar categorías
INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
(gen_random_uuid(), 'DERRIBOS', 'Trabajos de demolición y retirada', 'Hammer', 1, true),
(gen_random_uuid(), 'ALBANILERIA', 'Trabajos de albañilería y construcción', 'Brick', 2, true),
(gen_random_uuid(), 'FONTANERIA', 'Instalaciones de fontanería', 'Droplet', 3, true),
(gen_random_uuid(), 'CARPINTERIA', 'Trabajos de carpintería', 'Drill', 4, true),
(gen_random_uuid(), 'ELECTRICIDAD', 'Instalaciones eléctricas', 'Zap', 5, true),
(gen_random_uuid(), 'CALEFACCION', 'Sistemas de calefacción', 'Flame', 6, true),
(gen_random_uuid(), 'LIMPIEZA', 'Servicios de limpieza', 'Sparkles', 7, true),
(gen_random_uuid(), 'MATERIALES', 'Suministro de materiales', 'Package', 8, true);

-- Paso 4: Insertar TODOS los precios (93 precios)

-- DERRIBOS (16 precios) - 70% labor, 30% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '01-D-01', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'TABIQUES DERRIBO', 'Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 12.10, 5.18, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-02', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'PICADO ALICATADO PAREDES', 'Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.', 'm²', 10.08, 4.32, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-03', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'PICADO SUELOS', 'Picado de suelo y posterior desescombro.', 'm²', 14.82, 6.35, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-04', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE FALSO TECHO', 'Retirada y desescombro de falso techo de escayola o pladur.', 'm²', 10.08, 4.32, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-05', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE MOLDURAS', 'Retirada de molduras de escayola o madera en el perímetro de techos.', 'ml', 1.01, 0.43, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-06', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE TARIMA MADERA Y RASTRELES', 'Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.', 'm²', 6.05, 2.59, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-07', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE RODAPIE DE MADERA', 'Retirada de rodapié de madera y acopio para desescombro.', 'ml', 1.81, 0.78, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-08', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE RODAPIE CERÁMICO', 'Retirada de rodapié cerámico o de azulejo.', 'ml', 3.93, 1.69, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-09', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'CONTENEDOR DESESCOMBRO', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 352.80, 151.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-10', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'HR BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 12.60, 5.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-11', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 120.96, 51.84, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-12', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20.16, 8.64, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-13', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 2.52, 1.08, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-14', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 120.96, 51.84, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-15', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 241.92, 103.68, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '01-D-16', (SELECT id FROM price_categories WHERE name = 'DERRIBOS'), 'RETIRADA DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 360.86, 154.66, 0, 0, false, NULL::uuid);

-- ALBAÑILERÍA (17 precios) - 60% labor, 40% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '02-A-01', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'FORMACIÓN SOLERA MORTERO Y ARLITA', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 26.78, 17.86, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-02', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 22.46, 14.98, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-03', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'FORMACIÓN DE TRASDOSADO EN PLADUR (13+45)', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 35.42, 23.62, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-04', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 21.60, 14.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-05', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUES PLADUR DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 40.18, 26.78, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-06', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'ALICATADOS PARED (Colocación MO)', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 26.78, 17.86, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-07', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'EMBALDOSADO SUELOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 29.81, 19.87, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-08', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'EMBALDOSADO SUELO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 30.24, 20.16, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-09', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'RASEO PREVIO ALICATADOS', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 12.96, 8.64, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-10', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'RASEO PREVIO LEVANTES TABIQUERÍA', 'Raseo y enlucido de tabiquería nueva antes de pintar.', 'm²', 12.96, 8.64, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-11', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'LUCIDO PAREDES (Yeso o perliescayola)', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 12.44, 8.30, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-12', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 345.60, 230.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-13', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de escayola.', 'ml', 12.96, 8.64, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-14', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'COLOCACIÓN CAJETÍN PUERTA CORREDERA (Armazón)', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 164.16, 109.44, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-15', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 259.20, 172.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-16', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'BAJADO DE TECHOS (Pladur BA 15)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 23.26, 15.50, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '02-A-17', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'AISLANTES TÉRMICOS (Algodón regenerado)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 11.40, 7.60, 0, 0, false, NULL::uuid);

-- FONTANERÍA (13 precios) - 50% labor, 50% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '03-F-01', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavabo, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 475.20, 475.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-02', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'RED DE COCINA (Puntos de consumo: Fregadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 331.20, 331.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-03', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 154.80, 154.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-04', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 82.08, 82.08, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-05', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 129.60, 129.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-06', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 36.00, 36.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-07', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 72.00, 72.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-08', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 64.80, 64.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-09', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 68.40, 68.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-10', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 36.00, 36.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-11', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 36.00, 36.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-12', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 46.80, 46.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '03-F-13', (SELECT id FROM price_categories WHERE name = 'FONTANERIA'), 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 36.00, 36.00, 0, 0, false, NULL::uuid);

-- CARPINTERÍA (12 precios) - 40% labor, 60% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '04-C-01', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'NIVELACIÓN DE SUELOS CON TABLERO Y RASTRELE', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 20.16, 30.24, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-02', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'INSTALACIÓN PARQUET FLOTANTE (MO)', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 8.35, 12.53, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-03', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'INSTALACIÓN SUELO VINÍLICO (MO)', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 10.94, 16.42, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-04', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'COLOCACIÓN RODAPIÉ DM LACADO (MO y Materiales)', 'Suministro y colocación de rodapié.', 'ml', 3.22, 4.84, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-05', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 51.84, 77.76, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-06', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 114.62, 171.94, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-07', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block.', 'Ud', 57.60, 86.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-08', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 132.48, 198.72, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-09', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 260.00, 390.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-10', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'ACUCHILLADO SUELO + BARNIZADO', 'Lijado y barnizado de suelo de madera existente.', 'm²', 9.22, 13.82, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-11', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'EMPLASTECIDO DE LAS LAMAS DE TARIMA', 'Relleno de juntas de tarima.', 'm²', 2.88, 4.32, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '04-C-12', (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'), 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 9.22, 13.82, 0, 0, false, NULL::uuid);

-- ELECTRICIDAD (17 precios) - 50% labor, 50% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '05-E-01', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'CUADRO GENERAL 18 ELEMENTOS', 'Instalación de cuadro eléctrico con 18 módulos y elementos de protección.', 'Ud', 396.00, 396.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-02', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 126.00, 126.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-03', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo.', 'Ud', 68.40, 68.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-04', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'CUADRO DE OBRA (Instalación temporal)', 'Colocación de un cuadro eléctrico provisional para la reforma.', 'Ud', 198.00, 198.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-05', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)', 'Tendido de línea de enchufes estándar.', 'Ud', 169.20, 169.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-06', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 169.20, 169.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-07', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 25.20, 25.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-08', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 39.60, 39.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-09', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 46.80, 46.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-10', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTOS DE ENCHUFES', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 28.80, 28.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-11', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTO ENCHUFE INTEMPERIE', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 41.04, 41.04, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-12', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 46.08, 46.08, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-13', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'PUNTOS ENCHUFE APARATOS DE COCINA', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 28.80, 28.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-14', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 21.60, 21.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-15', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 32.40, 32.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-16', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 140.00, 140.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '05-E-17', (SELECT id FROM price_categories WHERE name = 'ELECTRICIDAD'), 'BOLETÍN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 175.00, 175.00, 0, 0, false, NULL::uuid);

-- CALEFACCIÓN (10 precios) - 50% labor, 50% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '06-CAL-01', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 28.80, 28.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-02', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 28.80, 28.80, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-03', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'COLOCACIÓN CALDERA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 273.60, 273.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-04', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 129.60, 129.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-05', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 43.20, 43.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-06', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 230.40, 230.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-07', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'INSTALACIÓN SUELO RADIANTE HÚMEDO', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', 'm²', 45.58, 45.57, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-08', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'ACOMETIDA DE GAS (Aprox.)', 'Coste estimado de conexión a la red de gas general.', 'Ud', 720.00, 720.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-09', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 32.40, 32.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '06-CAL-10', (SELECT id FROM price_categories WHERE name = 'CALEFACCION'), 'INSTALACIÓN TERMO FLECK DUO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 138.96, 138.96, 0, 0, false, NULL::uuid);

-- LIMPIEZA (2 precios) - 100% labor
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '07-L-01', (SELECT id FROM price_categories WHERE name = 'LIMPIEZA'), 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 0, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '07-L-02', (SELECT id FROM price_categories WHERE name = 'LIMPIEZA'), 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 0, 0, 0, 0, false, NULL::uuid);

-- MATERIALES (23 precios) - 20% labor, 80% material
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '08-M-01', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PLATO DE DUCHA DE RESINA BLANCO', 'Plato de ducha de resina extraplano (Suministro, no instalación).', 'Ud', 74.00, 296.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-02', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'VÁLVULA PARA PLATO DE DUCHA', 'Válvula de desagüe para plato de ducha.', 'Ud', 12.00, 48.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-03', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'INODORO', 'Inodoro cerámico (Suministro, no instalación).', 'Ud', 50.00, 200.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-04', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'MONOMANDO LAVABO', 'Grifo monomando para lavabo.', 'Ud', 19.40, 77.60, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-05', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'DUCHA TERMOSTÁTICA', 'Grifo termostático para ducha.', 'Ud', 43.00, 172.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-06', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'MAMPARA DE DUCHA', 'Mampara de ducha (Suministro, no instalación).', 'Ud', 70.00, 280.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-07', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'CONJUNTO DE MUEBLE CON LAVABO', 'Mueble de baño con lavabo integrado.', 'Ud', 64.00, 256.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-08', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'BALDOSA Y AZULEJO', 'Coste del metro cuadrado de baldosa o azulejo para revestimientos.', 'm²', 4.00, 16.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-09', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PARQUET FLOTANTE', 'Coste del metro cuadrado de tarima laminada de alta calidad.', 'm²', 6.60, 26.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-10', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'SUELO VINÍLICO CLIC', 'Coste del metro cuadrado de suelo de vinilo.', 'm²', 5.00, 20.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-11', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'MANTA SUELO PARQUET FLOTANTE', 'Suministro de lámina aislante bajo tarima.', 'm²', 0.80, 3.20, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-12', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'SUMINISTRO RODAPIÉ DM LACADO', 'Coste del rodapié de madera.', 'ml', 1.00, 4.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-13', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PUERTA ABATIBLE EN BLOCK UNA HOJA', 'Coste de puerta de interior en kit.', 'Ud', 58.00, 232.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-14', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'CAJÓN PUERTA CORREDERA', 'Coste del armazón metálico para puerta corredera.', 'Ud', 44.00, 176.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-15', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PUERTA CORREDERA EN KIT', 'Coste de hoja de puerta corredera.', 'Ud', 64.00, 256.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-16', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'PUERTA ENTRADA', 'Coste de puerta de seguridad.', 'Ud', 364.60, 1458.40, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-17', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'FORRO PUERTA ENTRADA', 'Forro de marco para puerta de entrada.', 'Ud', 19.00, 76.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-18', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'CALDERA CONDENSACIÓN', 'Suministro de caldera de condensación.', 'Ud', 382.00, 1528.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-19', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'RADIADOR ELÉCTRICO', 'Coste de radiador eléctrico.', 'Ud', 40.00, 160.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-20', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'RADIADORES', 'Suministro de radiador de agua.', 'Ud', 62.00, 248.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-21', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'RADIADOR TOALLERO', 'Suministro de radiador toallero.', 'Ud', 62.00, 248.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-22', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'TERMOSTATO AMBIENTE', 'Suministro de termostato.', 'Ud', 12.00, 48.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '08-M-23', (SELECT id FROM price_categories WHERE name = 'MATERIALES'), 'TERMO ELÉCTRICO', 'Suministro de termo eléctrico.', 'Ud', 114.00, 456.00, 0, 0, false, NULL::uuid);

-- Paso 5: Recrear políticas RLS

-- Políticas para price_categories
CREATE POLICY "Todos pueden ver categorías activas" ON price_categories
  FOR SELECT USING (is_active = true);

-- Políticas para price_master
CREATE POLICY "Todos pueden ver precios activos" ON price_master
  FOR SELECT USING (is_active = true);

CREATE POLICY "Ver precios propios" ON price_master
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Crear precios personalizados" ON price_master
  FOR INSERT WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precios propios" ON price_master
  FOR UPDATE USING (is_custom = true AND user_id = auth.uid())
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Eliminar precios propios" ON price_master
  FOR DELETE USING (is_custom = true AND user_id = auth.uid());

-- Políticas para price_history
CREATE POLICY "Ver historial propio" ON price_history
  FOR SELECT USING (changed_by = auth.uid());

CREATE POLICY "Insertar en historial" ON price_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());
