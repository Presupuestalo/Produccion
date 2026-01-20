-- =====================================================
-- SCRIPT DE RESETEO COMPLETO DE PRECIOS MAESTROS
-- =====================================================
-- Este script elimina todas las políticas RLS existentes,
-- limpia completamente las tablas de precios y categorías,
-- e inserta todos los precios maestros con las descripciones completas.

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

-- Paso 2: Limpiar todas las tablas
TRUNCATE TABLE price_history CASCADE;
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Paso 3: Insertar las 8 categorías principales
INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'DERRIBO', 'Trabajos de demolición y retirada', '🔨', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'ALBANILERIA', 'Trabajos de albañilería y construcción', '🧱', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'FONTANERIA', 'Instalaciones de fontanería y saneamiento', '🚰', 3, true),
  ('44444444-4444-4444-4444-444444444444', 'CARPINTERIA', 'Trabajos de carpintería y suelos', '🪵', 4, true),
  ('55555555-5555-5555-5555-555555555555', 'ELECTRICIDAD', 'Instalaciones eléctricas', '⚡', 5, true),
  ('66666666-6666-6666-6666-666666666666', 'CALEFACCION', 'Sistemas de calefacción y climatización', '🔥', 6, true),
  ('77777777-7777-7777-7777-777777777777', 'LIMPIEZA', 'Servicios de limpieza de obra', '🧹', 7, true),
  ('88888888-8888-8888-8888-888888888888', 'MATERIALES', 'Materiales y suministros', '📦', 8, true);

-- Paso 4: Insertar todos los precios maestros con descripciones completas

-- CATEGORÍA 1: DERRIBOS (16 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '01-D-01', '11111111-1111-1111-1111-111111111111', 'TABIQUES DERRIBO', 'Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 12.10, 2.00, 0.00, 3.18, false, NULL::uuid),
  (gen_random_uuid(), '01-D-02', '11111111-1111-1111-1111-111111111111', 'PICADO ALICATADO PAREDES', 'Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.', 'm²', 10.08, 1.50, 0.00, 2.82, false, NULL::uuid),
  (gen_random_uuid(), '01-D-03', '11111111-1111-1111-1111-111111111111', 'PICADO SUELOS', 'Picado de suelo y posterior desescombro.', 'm²', 14.82, 2.50, 0.00, 3.85, false, NULL::uuid),
  (gen_random_uuid(), '01-D-04', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE FALSO TECHO', 'Retirada y desescombro de falso techo de escayola o pladur.', 'm²', 10.08, 1.50, 0.00, 2.82, false, NULL::uuid),
  (gen_random_uuid(), '01-D-05', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE MOLDURAS', 'Retirada de molduras de escayola o madera en el perímetro de techos.', 'ml', 1.01, 0.10, 0.00, 0.33, false, NULL::uuid),
  (gen_random_uuid(), '01-D-06', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE TARIMA MADERA Y RASTRELES', 'Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.', 'm²', 6.05, 0.80, 0.00, 1.79, false, NULL::uuid),
  (gen_random_uuid(), '01-D-07', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE RODAPIE DE MADERA', 'Retirada de rodapié de madera y acopio para desescombro.', 'ml', 1.81, 0.20, 0.00, 0.58, false, NULL::uuid),
  (gen_random_uuid(), '01-D-08', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE RODAPIE CERÁMICO', 'Retirada de rodapié cerámico o de azulejo.', 'ml', 3.93, 0.50, 0.00, 1.19, false, NULL::uuid),
  (gen_random_uuid(), '01-D-09', '11111111-1111-1111-1111-111111111111', 'CONTENEDOR DESESCOMBRO', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 50.00, 350.00, 0.00, 104.00, false, NULL::uuid),
  (gen_random_uuid(), '01-D-10', '11111111-1111-1111-1111-111111111111', 'HR BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 18.00, 0.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '01-D-11', '11111111-1111-1111-1111-111111111111', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 120.96, 20.00, 0.00, 31.84, false, NULL::uuid),
  (gen_random_uuid(), '01-D-12', '11111111-1111-1111-1111-111111111111', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20.16, 3.00, 0.00, 5.64, false, NULL::uuid),
  (gen_random_uuid(), '01-D-13', '11111111-1111-1111-1111-111111111111', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 2.52, 0.30, 0.00, 0.78, false, NULL::uuid),
  (gen_random_uuid(), '01-D-14', '11111111-1111-1111-1111-111111111111', 'RETIRADA ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 120.96, 20.00, 0.00, 31.84, false, NULL::uuid),
  (gen_random_uuid(), '01-D-15', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 241.92, 35.00, 0.00, 68.68, false, NULL::uuid),
  (gen_random_uuid(), '01-D-16', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 360.86, 50.00, 0.00, 104.66, false, NULL::uuid);

-- CATEGORÍA 2: ALBAÑILERÍA (17 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '02-A-01', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN SOLERA MORTERO Y ARLITA', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 22.32, 15.00, 0.00, 7.32, false, NULL::uuid),
  (gen_random_uuid(), '02-A-02', '22222222-2222-2222-2222-222222222222', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 18.72, 12.00, 0.00, 6.72, false, NULL::uuid),
  (gen_random_uuid(), '02-A-03', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN DE TRASDOSADO EN PLADUR (13+45)', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 29.52, 20.00, 0.00, 9.52, false, NULL::uuid),
  (gen_random_uuid(), '02-A-04', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 18.00, 12.00, 0.00, 6.00, false, NULL::uuid),
  (gen_random_uuid(), '02-A-05', '22222222-2222-2222-2222-222222222222', 'TABIQUES PLADUR DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 33.48, 22.00, 0.00, 11.48, false, NULL::uuid),
  (gen_random_uuid(), '02-A-06', '22222222-2222-2222-2222-222222222222', 'ALICATADOS PARED (Colocación MO)', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 35.00, 3.00, 0.00, 6.64, false, NULL::uuid),
  (gen_random_uuid(), '02-A-07', '22222222-2222-2222-2222-222222222222', 'EMBALDOSADO SUELOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 39.00, 3.50, 0.00, 7.18, false, NULL::uuid),
  (gen_random_uuid(), '02-A-08', '22222222-2222-2222-2222-222222222222', 'EMBALDOSADO SUELO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 39.50, 3.80, 0.00, 7.10, false, NULL::uuid),
  (gen_random_uuid(), '02-A-09', '22222222-2222-2222-2222-222222222222', 'RASEO PREVIO ALICATADOS', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 15.12, 3.00, 0.00, 3.48, false, NULL::uuid),
  (gen_random_uuid(), '02-A-10', '22222222-2222-2222-2222-222222222222', 'RASEO PREVIO LEVANTES TABIQUERÍA', 'Raseo y enlucido de tabiquería nueva antes de pintar.', 'm²', 15.12, 3.00, 0.00, 3.48, false, NULL::uuid),
  (gen_random_uuid(), '02-A-11', '22222222-2222-2222-2222-222222222222', 'LUCIDO PAREDES (Yeso o perliescayola)', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 14.52, 2.80, 0.00, 3.42, false, NULL::uuid),
  (gen_random_uuid(), '02-A-12', '22222222-2222-2222-2222-222222222222', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 403.20, 60.00, 0.00, 112.80, false, NULL::uuid),
  (gen_random_uuid(), '02-A-13', '22222222-2222-2222-2222-222222222222', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de escayola.', 'ml', 10.80, 7.00, 0.00, 3.80, false, NULL::uuid),
  (gen_random_uuid(), '02-A-14', '22222222-2222-2222-2222-222222222222', 'COLOCACIÓN CAJETÍN PUERTA CORREDERA (Armazón)', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 135.00, 95.00, 0.00, 43.60, false, NULL::uuid),
  (gen_random_uuid(), '02-A-15', '22222222-2222-2222-2222-222222222222', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 350.00, 20.00, 0.00, 62.00, false, NULL::uuid),
  (gen_random_uuid(), '02-A-16', '22222222-2222-2222-2222-222222222222', 'BAJADO DE TECHOS (Pladur BA 15)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 19.38, 13.00, 0.00, 6.38, false, NULL::uuid),
  (gen_random_uuid(), '02-A-17', '22222222-2222-2222-2222-222222222222', 'AISLANTES TÉRMICOS (Algodón regenerado)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 5.70, 10.00, 0.00, 3.30, false, NULL::uuid);

-- CATEGORÍA 3: FONTANERÍA (13 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '03-F-01', '33333333-3333-3333-3333-333333333333', 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavabo, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 570.00, 250.00, 0.00, 130.40, false, NULL::uuid),
  (gen_random_uuid(), '03-F-02', '33333333-3333-3333-3333-333333333333', 'RED DE COCINA (Puntos de consumo: Fregadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 397.44, 175.00, 0.00, 89.96, false, NULL::uuid),
  (gen_random_uuid(), '03-F-03', '33333333-3333-3333-3333-333333333333', 'RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 185.76, 80.00, 0.00, 43.84, false, NULL::uuid),
  (gen_random_uuid(), '03-F-04', '33333333-3333-3333-3333-333333333333', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 98.50, 42.00, 0.00, 23.66, false, NULL::uuid),
  (gen_random_uuid(), '03-F-05', '33333333-3333-3333-3333-333333333333', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 155.52, 68.00, 0.00, 35.68, false, NULL::uuid),
  (gen_random_uuid(), '03-F-06', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 60.00, 5.00, 0.00, 7.00, false, NULL::uuid),
  (gen_random_uuid(), '03-F-07', '33333333-3333-3333-3333-333333333333', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 120.00, 10.00, 0.00, 14.00, false, NULL::uuid),
  (gen_random_uuid(), '03-F-08', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 108.00, 8.00, 0.00, 13.60, false, NULL::uuid),
  (gen_random_uuid(), '03-F-09', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 114.00, 8.50, 0.00, 14.30, false, NULL::uuid),
  (gen_random_uuid(), '03-F-10', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 60.00, 5.00, 0.00, 7.00, false, NULL::uuid),
  (gen_random_uuid(), '03-F-11', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 60.00, 5.00, 0.00, 7.00, false, NULL::uuid),
  (gen_random_uuid(), '03-F-12', '33333333-3333-3333-3333-333333333333', 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 78.00, 6.00, 0.00, 9.60, false, NULL::uuid),
  (gen_random_uuid(), '03-F-13', '33333333-3333-3333-3333-333333333333', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 60.00, 5.00, 0.00, 7.00, false, NULL::uuid);

-- CATEGORÍA 4: CARPINTERÍA (12 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '04-C-01', '44444444-4444-4444-4444-444444444444', 'NIVELACIÓN DE SUELOS CON TABLERO Y RASTREL', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 20.00, 22.00, 0.00, 8.40, false, NULL::uuid),
  (gen_random_uuid(), '04-C-02', '44444444-4444-4444-4444-444444444444', 'INSTALACIÓN PARQUET FLOTANTE (MO)', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 18.00, 1.00, 0.00, 1.88, false, NULL::uuid),
  (gen_random_uuid(), '04-C-03', '44444444-4444-4444-4444-444444444444', 'INSTALACIÓN SUELO VINÍLICO (MO)', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 23.50, 1.50, 0.00, 2.36, false, NULL::uuid),
  (gen_random_uuid(), '04-C-04', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN RODAPIÉ DM LACADO (MO y Materiales)', 'Suministro y colocación de rodapié.', 'ml', 2.00, 5.00, 0.00, 1.06, false, NULL::uuid),
  (gen_random_uuid(), '04-C-05', '44444444-4444-4444-4444-444444444444', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 90.00, 20.00, 0.00, 19.60, false, NULL::uuid),
  (gen_random_uuid(), '04-C-06', '44444444-4444-4444-4444-444444444444', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 200.00, 45.00, 0.00, 41.56, false, NULL::uuid),
  (gen_random_uuid(), '04-C-07', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block.', 'Ud', 120.00, 10.00, 0.00, 14.00, false, NULL::uuid),
  (gen_random_uuid(), '04-C-08', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 276.00, 22.00, 0.00, 33.20, false, NULL::uuid),
  (gen_random_uuid(), '04-C-09', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 540.00, 45.00, 0.00, 65.00, false, NULL::uuid),
  (gen_random_uuid(), '04-C-10', '44444444-4444-4444-4444-444444444444', 'ACUCHILLADO SUELO + BARNIZADO', 'Lijado y barnizado de suelo de madera existente.', 'm²', 11.52, 8.00, 0.00, 3.52, false, NULL::uuid),
  (gen_random_uuid(), '04-C-11', '44444444-4444-4444-4444-444444444444', 'EMPLASTECIDO DE LAS LAMAS DE TARIMA', 'Relleno de juntas de tarima.', 'm²', 3.60, 2.50, 0.00, 1.10, false, NULL::uuid),
  (gen_random_uuid(), '04-C-12', '44444444-4444-4444-4444-444444444444', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 19.00, 1.50, 0.00, 2.54, false, NULL::uuid);

-- CATEGORÍA 5: ELECTRICIDAD (17 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '05-E-01', '55555555-5555-5555-5555-555555555555', 'CUADRO GENERAL 18 ELEMENTOS', 'Instalación de cuadro eléctrico con 18 módulos y elementos de protección.', 'Ud', 400.00, 280.00, 0.00, 112.00, false, NULL::uuid),
  (gen_random_uuid(), '05-E-02', '55555555-5555-5555-5555-555555555555', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 150.00, 70.00, 0.00, 32.00, false, NULL::uuid),
  (gen_random_uuid(), '05-E-03', '55555555-5555-5555-5555-555555555555', 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo.', 'Ud', 68.40, 48.00, 0.00, 20.40, false, NULL::uuid),
  (gen_random_uuid(), '05-E-04', '55555555-5555-5555-5555-555555555555', 'CUADRO DE OBRA (Instalación temporal)', 'Colocación de un cuadro eléctrico provisional para la reforma.', 'Ud', 200.00, 140.00, 0.00, 56.00, false, NULL::uuid),
  (gen_random_uuid(), '05-E-05', '55555555-5555-5555-5555-555555555555', 'LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)', 'Tendido de línea de enchufes estándar.', 'Ud', 202.00, 95.00, 0.00, 41.40, false, NULL::uuid),
  (gen_random_uuid(), '05-E-06', '55555555-5555-5555-5555-555555555555', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 202.00, 95.00, 0.00, 41.40, false, NULL::uuid),
  (gen_random_uuid(), '05-E-07', '55555555-5555-5555-5555-555555555555', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 25.20, 18.00, 0.00, 7.20, false, NULL::uuid),
  (gen_random_uuid(), '05-E-08', '55555555-5555-5555-5555-555555555555', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 39.60, 28.00, 0.00, 11.60, false, NULL::uuid),
  (gen_random_uuid(), '05-E-09', '55555555-5555-5555-5555-555555555555', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 46.80, 33.00, 0.00, 13.80, false, NULL::uuid),
  (gen_random_uuid(), '05-E-10', '55555555-5555-5555-5555-555555555555', 'PUNTOS DE ENCHUFES', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 28.80, 20.00, 0.00, 8.80, false, NULL::uuid),
  (gen_random_uuid(), '05-E-11', '55555555-5555-5555-5555-555555555555', 'PUNTO ENCHUFE INTEMPERIE', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 41.04, 29.00, 0.00, 12.04, false, NULL::uuid),
  (gen_random_uuid(), '05-E-12', '55555555-5555-5555-5555-555555555555', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 46.08, 32.50, 0.00, 13.58, false, NULL::uuid),
  (gen_random_uuid(), '05-E-13', '55555555-5555-5555-5555-555555555555', 'PUNTOS ENCHUFE APARATOS DE COCINA', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 28.80, 20.00, 0.00, 8.80, false, NULL::uuid),
  (gen_random_uuid(), '05-E-14', '55555555-5555-5555-5555-555555555555', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 36.00, 3.00, 0.00, 4.20, false, NULL::uuid),
  (gen_random_uuid(), '05-E-15', '55555555-5555-5555-5555-555555555555', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 32.40, 23.00, 0.00, 9.40, false, NULL::uuid),
  (gen_random_uuid(), '05-E-16', '55555555-5555-5555-5555-555555555555', 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 140.00, 98.00, 0.00, 42.00, false, NULL::uuid),
  (gen_random_uuid(), '05-E-17', '55555555-5555-5555-5555-555555555555', 'BOLETÍN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 250.00, 50.00, 0.00, 50.00, false, NULL::uuid);

-- CATEGORÍA 6: CALEFACCIÓN (10 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '06-CAL-01', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 48.00, 4.00, 0.00, 5.60, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-02', '66666666-6666-6666-6666-666666666666', 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 48.00, 4.00, 0.00, 5.60, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-03', '66666666-6666-6666-6666-666666666666', 'COLOCACIÓN CALDERA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 456.00, 38.00, 0.00, 53.20, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-04', '66666666-6666-6666-6666-666666666666', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 155.52, 68.00, 0.00, 35.68, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-05', '66666666-6666-6666-6666-666666666666', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 72.00, 6.00, 0.00, 8.40, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-06', '66666666-6666-6666-6666-666666666666', 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 322.56, 92.00, 0.00, 46.24, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-07', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN SUELO RADIANTE HÚMEDO', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', 'm²', 36.46, 40.00, 0.00, 14.69, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-08', '66666666-6666-6666-6666-666666666666', 'ACOMETIDA DE GAS (Aprox.)', 'Coste estimado de conexión a la red de gas general.', 'Ud', 720.00, 500.00, 0.00, 220.00, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-09', '66666666-6666-6666-6666-666666666666', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 32.40, 23.00, 0.00, 9.40, false, NULL::uuid),
  (gen_random_uuid(), '06-CAL-10', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN TERMO FLECK DUO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 138.96, 97.00, 0.00, 41.96, false, NULL::uuid);

-- CATEGORÍA 7: LIMPIEZA (2 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '07-L-01', '77777777-7777-7777-7777-777777777777', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 0.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '07-L-02', '77777777-7777-7777-7777-777777777777', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 0.00, 0.00, 0.00, 0.00, false, NULL::uuid);

-- CATEGORÍA 8: MATERIALES (23 precios)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
  (gen_random_uuid(), '08-M-01', '88888888-8888-8888-8888-888888888888', 'PLATO DE DUCHA DE RESINA BLANCO', 'Plato de ducha de resina extraplano (Suministro, no instalación).', 'Ud', 0.00, 370.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-02', '88888888-8888-8888-8888-888888888888', 'VÁLVULA PARA PLATO DE DUCHA', 'Válvula de desagüe para plato de ducha.', 'Ud', 0.00, 60.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-03', '88888888-8888-8888-8888-888888888888', 'INODORO', 'Inodoro cerámico (Suministro, no instalación).', 'Ud', 0.00, 250.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-04', '88888888-8888-8888-8888-888888888888', 'MONOMANDO LAVABO', 'Grifo monomando para lavabo.', 'Ud', 0.00, 97.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-05', '88888888-8888-8888-8888-888888888888', 'DUCHA TERMOSTÁTICA', 'Grifo termostático para ducha.', 'Ud', 0.00, 215.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-06', '88888888-8888-8888-8888-888888888888', 'MAMPARA DE DUCHA', 'Mampara de ducha (Suministro, no instalación).', 'Ud', 0.00, 350.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-07', '88888888-8888-8888-8888-888888888888', 'CONJUNTO DE MUEBLE CON LAVABO', 'Mueble de baño con lavabo integrado.', 'Ud', 0.00, 320.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-08', '88888888-8888-8888-8888-888888888888', 'BALDOSA Y AZULEJO', 'Coste del metro cuadrado de baldosa o azulejo para revestimientos.', 'm²', 0.00, 20.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-09', '88888888-8888-8888-8888-888888888888', 'PARQUET FLOTANTE', 'Coste del metro cuadrado de tarima laminada de alta calidad.', 'm²', 0.00, 33.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-10', '88888888-8888-8888-8888-888888888888', 'SUELO VINÍLICO CLIC', 'Coste del metro cuadrado de suelo de vinilo.', 'm²', 0.00, 25.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-11', '88888888-8888-8888-8888-888888888888', 'MANTA SUELO PARQUET FLOTANTE', 'Suministro de lámina aislante bajo tarima.', 'm²', 0.00, 4.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-12', '88888888-8888-8888-8888-888888888888', 'SUMINISTRO RODAPIÉ DM LACADO', 'Coste del rodapié de madera.', 'ml', 0.00, 5.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-13', '88888888-8888-8888-8888-888888888888', 'PUERTA ABATIBLE EN BLOCK UNA HOJA', 'Coste de puerta de interior en kit.', 'Ud', 0.00, 290.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-14', '88888888-8888-8888-8888-888888888888', 'CAJÓN PUERTA CORREDERA', 'Coste del armazón metálico para puerta corredera.', 'Ud', 0.00, 220.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-15', '88888888-8888-8888-8888-888888888888', 'PUERTA CORREDERA EN KIT', 'Coste de hoja de puerta corredera.', 'Ud', 0.00, 320.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-16', '88888888-8888-8888-8888-888888888888', 'PUERTA ENTRADA', 'Coste de puerta de seguridad.', 'Ud', 0.00, 1823.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-17', '88888888-8888-8888-8888-888888888888', 'FORRO PUERTA ENTRADA', 'Forro de marco para puerta de entrada.', 'Ud', 0.00, 95.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-18', '88888888-8888-8888-8888-888888888888', 'CALDERA CONDENSACIÓN', 'Suministro de caldera de condensación.', 'Ud', 0.00, 1910.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-19', '88888888-8888-8888-8888-888888888888', 'RADIADOR ELÉCTRICO', 'Coste de radiador eléctrico.', 'Ud', 0.00, 200.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-20', '88888888-8888-8888-8888-888888888888', 'RADIADORES', 'Suministro de radiador de agua.', 'Ud', 0.00, 310.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-21', '88888888-8888-8888-8888-888888888888', 'RADIADOR TOALLERO', 'Suministro de radiador toallero.', 'Ud', 0.00, 310.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-22', '88888888-8888-8888-8888-888888888888', 'TERMOSTATO AMBIENTE', 'Suministro de termostato.', 'Ud', 0.00, 60.00, 0.00, 0.00, false, NULL::uuid),
  (gen_random_uuid(), '08-M-23', '88888888-8888-8888-8888-888888888888', 'TERMO ELÉCTRICO', 'Suministro de termo eléctrico.', 'Ud', 0.00, 570.00, 0.00, 0.00, false, NULL::uuid);

-- Paso 5: Recrear las políticas RLS

-- Políticas para price_categories
CREATE POLICY "Ver categorías" ON price_categories
  FOR SELECT USING (true);

CREATE POLICY "Crear categorías" ON price_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actualizar categorías" ON price_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para price_master
CREATE POLICY "Ver todos los precios" ON price_master
  FOR SELECT USING (true);

CREATE POLICY "Crear precios propios" ON price_master
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "Actualizar precios propios" ON price_master
  FOR UPDATE USING (
    auth.uid() = user_id OR (user_id IS NULL AND auth.role() = 'authenticated')
  );

CREATE POLICY "Eliminar precios propios" ON price_master
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Políticas para price_history
CREATE POLICY "Ver historial propio" ON price_history
  FOR SELECT USING (changed_by = auth.uid());

CREATE POLICY "Insertar historial" ON price_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());
