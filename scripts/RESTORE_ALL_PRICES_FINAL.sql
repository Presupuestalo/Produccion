-- =========================================================================
-- SCRIPT DE RESTAURACIÓN COMPLETA DEL CATÁLOGO DE PRECIOS
-- =========================================================================
-- Este script:
-- 1. Elimina políticas RLS existentes para evitar conflictos.
-- 2. Recrea la tabla price_master con columnas auto-generadas (base_price, final_price).
-- 3. Restaura las 8 categorías principales con sus IDs originales.
-- 4. Inserta los 93 precios maestros con sus costos desglosados.
-- 5. Configura políticas RLS correctas.
-- =========================================================================

-- Paso 1: Eliminar dinámicamente políticas RLS existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('price_categories', 'price_master', 'price_history'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Paso 2: Recrear la tabla price_master con la estructura correcta
-- Usamos DROP CASCADE para limpiar dependencias (como triggers o vistas)
DROP TABLE IF EXISTS price_master CASCADE;

CREATE TABLE price_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES price_categories(id) ON DELETE CASCADE,
  subcategory TEXT,
  description TEXT NOT NULL,
  long_description TEXT,
  unit TEXT NOT NULL DEFAULT 'Ud',
  labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  material_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  equipment_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  other_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- Columnas auto-generadas para garantizar precisión
  base_price DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + material_cost + equipment_cost + other_cost) STORED,
  margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) GENERATED ALWAYS AS ((labor_cost + material_cost + equipment_cost + other_cost) * (1 + margin_percentage / 100)) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paso 3: Limpiar y restaurar categorías
TRUNCATE TABLE price_categories CASCADE;

INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'DERRIBOS', 'Trabajos de demolición y retirada de escombros', 'Hammer', 1, true),
('22222222-2222-2222-2222-222222222222', 'ALBANILERIA', 'Trabajos de construcción, tabiquería y revestimientos', 'Brick', 2, true),
('33333333-3333-3333-3333-333333333333', 'FONTANERIA', 'Instalaciones de agua, saneamiento y gas', 'Droplet', 3, true),
('44444444-4444-4444-4444-444444444444', 'CARPINTERIA', 'Carpintería de madera y metálica, puertas y ventanas', 'Drill', 4, true),
('55555555-5555-5555-5555-555555555555', 'ELECTRICIDAD', 'Instalaciones eléctricas y de iluminación', 'Zap', 5, true),
('66666666-6666-6666-6666-666666666666', 'CALEFACCION', 'Sistemas de calefacción y climatización', 'Flame', 6, true),
('77777777-7777-7777-7777-777777777777', 'LIMPIEZA', 'Servicios de limpieza de obra y acabados', 'Sparkles', 7, true),
('88888888-8888-8888-8888-888888888888', 'MATERIALES', 'Suministro de materiales y accesorios', 'Package', 8, true);

-- Paso 4: Insertar los 93 precios maestros
-- Nota: margin_percentage se establece en 15% para todos los precios maestros por defecto

-- DERRIBOS (16 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('01-D-01', '11111111-1111-1111-1111-111111111111', 'TABIQUES DERRIBO', 'Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 12.10, 5.18, 0, 0, 15, false),
('01-D-02', '11111111-1111-1111-1111-111111111111', 'PICADO ALICATADO PAREDES', 'Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.', 'm²', 10.08, 4.32, 0, 0, 15, false),
('01-D-03', '11111111-1111-1111-1111-111111111111', 'PICADO SUELOS', 'Picado de suelo y posterior desescombro.', 'm²', 14.82, 6.35, 0, 0, 15, false),
('01-D-04', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE FALSO TECHO', 'Retirada y desescombro de falso techo de escayola o pladur.', 'm²', 10.08, 4.32, 0, 0, 15, false),
('01-D-05', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE MOLDURAS', 'Retirada de molduras de escayola o madera en el perímetro de techos.', 'ml', 1.01, 0.43, 0, 0, 15, false),
('01-D-06', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE TARIMA MADERA Y RASTRELES', 'Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.', 'm²', 6.05, 2.59, 0, 0, 15, false),
('01-D-07', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE RODAPIE DE MADERA', 'Retirada de rodapié de madera y acopio para desescombro.', 'ml', 1.81, 0.78, 0, 0, 15, false),
('01-D-08', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE RODAPIE CERÁMICO', 'Retirada de rodapié cerámico o de azulejo.', 'ml', 3.93, 1.69, 0, 0, 15, false),
('01-D-09', '11111111-1111-1111-1111-111111111111', 'CONTENEDOR DESESCOMBRO', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 352.80, 151.20, 0, 0, 15, false),
('01-D-10', '11111111-1111-1111-1111-111111111111', 'HR BAJADA DE ESCOMBROS', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 12.60, 5.40, 0, 0, 15, false),
('01-D-11', '11111111-1111-1111-1111-111111111111', 'ANULACIÓN INSTALACIÓN ELÉCTRICA/FONTANERÍA', 'Desconexión y anulación de líneas antiguas.', 'Ud', 120.96, 51.84, 0, 0, 15, false),
('01-D-12', '11111111-1111-1111-1111-111111111111', 'DESMONTAJE HOJAS PUERTAS Y RETIRADA', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20.16, 8.64, 0, 0, 15, false),
('01-D-13', '11111111-1111-1111-1111-111111111111', 'PREPARACIÓN PAREDES (Gotelé/Papel)', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 2.52, 1.08, 0, 0, 15, false),
('01-D-14', '11111111-1111-1111-1111-111111111111', 'RETIRADA ELEMENTOS BAÑO (Sanitarios)', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 120.96, 51.84, 0, 0, 15, false),
('01-D-15', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE MOBILIARIO COCINA', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 241.92, 103.68, 0, 0, 15, false),
('01-D-16', '11111111-1111-1111-1111-111111111111', 'RETIRADA DE ARMARIOS Y RESTO MOBILIARIO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 360.86, 154.66, 0, 0, 15, false);

-- ALBAÑILERÍA (17 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('02-A-01', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN SOLERA MORTERO Y ARLITA', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 26.78, 17.86, 0, 0, 15, false),
('02-A-02', '22222222-2222-2222-2222-222222222222', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 22.46, 14.98, 0, 0, 15, false),
('02-A-03', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN DE TRASDOSADO EN PLADUR (13+45)', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 35.42, 23.62, 0, 0, 15, false),
('02-A-04', '22222222-2222-2222-2222-222222222222', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 21.60, 14.40, 0, 0, 15, false),
('02-A-05', '22222222-2222-2222-2222-222222222222', 'TABIQUES PLADUR DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 40.18, 26.78, 0, 0, 15, false),
('02-A-06', '22222222-2222-2222-2222-222222222222', 'ALICATADOS PARED (Colocación MO)', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 26.78, 17.86, 0, 0, 15, false),
('02-A-07', '22222222-2222-2222-2222-222222222222', 'EMBALDOSADO SUELOS (Colocación MO)', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 29.81, 19.87, 0, 0, 15, false),
('02-A-08', '22222222-2222-2222-2222-222222222222', 'EMBALDOSADO SUELO RADIANTE (Colocación MO)', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 30.24, 20.16, 0, 0, 15, false),
('02-A-09', '22222222-2222-2222-2222-222222222222', 'RASEO PREVIO ALICATADOS', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 12.96, 8.64, 0, 0, 15, false),
('02-A-10', '22222222-2222-2222-2222-222222222222', 'RASEO PREVIO LEVANTES TABIQUERÍA', 'Raseo y enlucido de tabiquería nueva antes de pintar.', 'm²', 12.96, 8.64, 0, 0, 15, false),
('02-A-11', '22222222-2222-2222-2222-222222222222', 'LUCIDO PAREDES (Yeso o perliescayola)', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 12.44, 8.30, 0, 0, 15, false),
('02-A-12', '22222222-2222-2222-2222-222222222222', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 345.60, 230.40, 0, 0, 15, false),
('02-A-13', '22222222-2222-2222-2222-222222222222', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de escayola.', 'ml', 12.96, 8.64, 0, 0, 15, false),
('02-A-14', '22222222-2222-2222-2222-222222222222', 'COLOCACIÓN CAJETÍN PUERTA CORREDERA (Armazón)', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 164.16, 109.44, 0, 0, 15, false),
('02-A-15', '22222222-2222-2222-2222-222222222222', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 259.20, 172.80, 0, 0, 15, false),
('02-A-16', '22222222-2222-2222-2222-222222222222', 'BAJADO DE TECHOS (Pladur BA 15)', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 23.26, 15.50, 0, 0, 15, false),
('02-A-17', '22222222-2222-2222-2222-222222222222', 'AISLANTES TÉRMICOS (Algodón regenerado)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 11.40, 7.60, 0, 0, 15, false);

-- FONTANERÍA (13 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('03-F-01', '33333333-3333-3333-3333-333333333333', 'RED DE BAÑO (Puntos de consumo: Inodoro, Lavabo, etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 475.20, 475.20, 0, 0, 15, false),
('03-F-02', '33333333-3333-3333-3333-333333333333', 'RED DE COCINA (Puntos de consumo: Fregadero, L. etc.)', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 331.20, 331.20, 0, 0, 15, false),
('03-F-03', '33333333-3333-3333-3333-333333333333', 'RETIRADA BAJANTE FECALES Y COLOCACIÓN PVC-110MM', 'Sustitución de tramo de bajante.', 'Ud', 154.80, 154.80, 0, 0, 15, false),
('03-F-04', '33333333-3333-3333-3333-333333333333', 'SUMINISTRO Y COLOCACIÓN CONDUCTO EXTRACCIÓN BAÑO', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 82.08, 82.08, 0, 0, 15, false),
('03-F-05', '33333333-3333-3333-3333-333333333333', 'SUMINISTRO Y COLOCACIÓN CONDUCTO CAMPANA EXTRACTORA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 129.60, 129.60, 0, 0, 15, false),
('03-F-06', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN INODORO (Montaje MO)', 'Montaje e instalación del inodoro.', 'Ud', 36.00, 36.00, 0, 0, 15, false),
('03-F-07', '33333333-3333-3333-3333-333333333333', 'COLOCACIÓN PLATO DE DUCHA (Montaje MO)', 'Instalación y sellado del plato de ducha.', 'Ud', 72.00, 72.00, 0, 0, 15, false),
('03-F-08', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN MUEBLE LAVABO (Montaje MO)', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 64.80, 64.80, 0, 0, 15, false),
('03-F-09', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN MAMPARA (Montaje MO)', 'Montaje de mampara de ducha o bañera.', 'Ud', 68.40, 68.40, 0, 0, 15, false),
('03-F-10', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN GRIFO DUCHA (Montaje MO)', 'Montaje de monomando o termostática de ducha.', 'Ud', 36.00, 36.00, 0, 0, 15, false),
('03-F-11', '33333333-3333-3333-3333-333333333333', 'INSTALACIÓN GRIFO LAVABO (Montaje MO)', 'Montaje de monomando de lavabo.', 'Ud', 36.00, 36.00, 0, 0, 15, false),
('03-F-12', '33333333-3333-3333-3333-333333333333', 'MONTAJE FREGADERO, LAVADORA Y LAVAVAJILLAS (MO)', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 46.80, 46.80, 0, 0, 15, false),
('03-F-13', '33333333-3333-3333-3333-333333333333', 'MONTAJE Y COLOCACIÓN CAMPANA EXTRACTORA COCINA (MO)', 'Instalación de campana extractora en cocina.', 'Ud', 36.00, 36.00, 0, 0, 15, false);

-- CARPINTERÍA (12 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('04-C-01', '44444444-4444-4444-4444-444444444444', 'NIVELACIÓN DE SUELOS CON TABLERO Y RASTREL', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 20.16, 30.24, 0, 0, 15, false),
('04-C-02', '44444444-4444-4444-4444-444444444444', 'INSTALACIÓN PARQUET FLOTANTE (MO)', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 8.35, 12.53, 0, 0, 15, false),
('04-C-03', '44444444-4444-4444-4444-444444444444', 'INSTALACIÓN SUELO VINÍLICO (MO)', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 10.94, 16.42, 0, 0, 15, false),
('04-C-04', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN RODAPIÉ DM LACADO (MO y Materiales)', 'Suministro y colocación de rodapié.', 'ml', 3.22, 4.84, 0, 0, 15, false),
('04-C-05', '44444444-4444-4444-4444-444444444444', 'SUMINISTRO Y COLOCACIÓN PREMARCOS (MO)', 'Instalación de premarco.', 'Ud', 51.84, 77.76, 0, 0, 15, false),
('04-C-06', '44444444-4444-4444-4444-444444444444', 'SUMINISTRO Y COLOCACIÓN FORRO (MARCOS SIN PUERTA) (MO)', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 114.62, 171.94, 0, 0, 15, false),
('04-C-07', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA ABATIBLE 1 HOJA (MO)', 'Instalación de puerta abatible en block.', 'Ud', 57.60, 86.40, 0, 0, 15, false),
('04-C-08', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA CORREDERA (MO)', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 132.48, 198.72, 0, 0, 15, false),
('04-C-09', '44444444-4444-4444-4444-444444444444', 'COLOCACIÓN PUERTA ENTRADA (Blindada) (MO)', 'Instalación de puerta de seguridad.', 'Ud', 260.00, 390.00, 0, 0, 15, false),
('04-C-10', '44444444-4444-4444-4444-444444444444', 'ACUCHILLADO SUELO + BARNIZADO', 'Lijado y barnizado de suelo de madera existente.', 'm²', 9.22, 13.82, 0, 0, 15, false),
('04-C-11', '44444444-4444-4444-4444-444444444444', 'EMPLASTECIDO DE LAS LAMAS DE TARIMA', 'Relleno de juntas de tarima.', 'm²', 2.88, 4.32, 0, 0, 15, false),
('04-C-12', '44444444-4444-4444-4444-444444444444', 'REBAJE DE PUERTAS', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 9.22, 13.82, 0, 0, 15, false);

-- ELECTRICIDAD (17 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('05-E-01', '55555555-5555-5555-5555-555555555555', 'CUADRO GENERAL 18 ELEMENTOS', 'Instalación de cuadro eléctrico con 18 módulos y elementos de protección.', 'Ud', 396.00, 396.00, 0, 0, 15, false),
('05-E-02', '55555555-5555-5555-5555-555555555555', 'CANALIZACIÓN TV Y TELECOMUNICACIONES', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 126.00, 126.00, 0, 0, 15, false),
('05-E-03', '55555555-5555-5555-5555-555555555555', 'SUMINISTRO E INSTALACIÓN PORTERO CONVENCIONAL', 'Instalación de telefonillo.', 'Ud', 68.40, 68.40, 0, 0, 15, false),
('05-E-04', '55555555-5555-5555-5555-555555555555', 'CUADRO DE OBRA (Instalación temporal)', 'Colocación de un cuadro eléctrico provisional para la reforma.', 'Ud', 198.00, 198.00, 0, 0, 15, false),
('05-E-05', '55555555-5555-5555-5555-555555555555', 'LINEA DE ENCHUFES MONOFÁSICA (2,5mm2)', 'Tendido de línea de enchufes estándar.', 'Ud', 169.20, 169.20, 0, 0, 15, false),
('05-E-06', '55555555-5555-5555-5555-555555555555', 'LINEA DE ALUMBRADO (1,5mm2)', 'Tendido de línea de alumbrado general.', 'Ud', 169.20, 169.20, 0, 0, 15, false),
('05-E-07', '55555555-5555-5555-5555-555555555555', 'PUNTO DE LUZ SENCILLO', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 25.20, 25.20, 0, 0, 15, false),
('05-E-08', '55555555-5555-5555-5555-555555555555', 'PUNTOS CONMUTADOS', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 39.60, 39.60, 0, 0, 15, false),
('05-E-09', '55555555-5555-5555-5555-555555555555', 'PUNTOS DE CRUZAMIENTO', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 46.80, 46.80, 0, 0, 15, false),
('05-E-10', '55555555-5555-5555-5555-555555555555', 'PUNTOS DE ENCHUFES', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 28.80, 28.80, 0, 0, 15, false),
('05-E-11', '55555555-5555-5555-5555-555555555555', 'PUNTO ENCHUFE INTEMPERIE', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 41.04, 41.04, 0, 0, 15, false),
('05-E-12', '55555555-5555-5555-5555-555555555555', 'TOMA DE TV', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 46.08, 46.08, 0, 0, 15, false),
('05-E-13', '55555555-5555-5555-5555-555555555555', 'PUNTOS ENCHUFE APARATOS DE COCINA', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 28.80, 28.80, 0, 0, 15, false),
('05-E-14', '55555555-5555-5555-5555-555555555555', 'SUMINISTRO Y COLOCACIÓN FOCOS (MO)', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 21.60, 21.60, 0, 0, 15, false),
('05-E-15', '55555555-5555-5555-5555-555555555555', 'TIMBRE DE PUERTA ENTRADA', 'Instalación de pulsador y timbre.', 'Ud', 32.40, 32.40, 0, 0, 15, false),
('05-E-16', '55555555-5555-5555-5555-555555555555', 'LÍNEA DE CUATRO PARA CALEFACCIÓN ELÉCTRICA', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 140.00, 140.00, 0, 0, 15, false),
('05-E-17', '55555555-5555-5555-5555-555555555555', 'BOLETÍN Y LEGALIZACIÓN', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 175.00, 175.00, 0, 0, 15, false);

-- CALEFACCIÓN (10 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('06-CAL-01', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN DE RADIADOR ELÉCTRICO', 'Instalación y conexión a la línea eléctrica.', 'Ud', 28.80, 28.80, 0, 0, 15, false),
('06-CAL-02', '66666666-6666-6666-6666-666666666666', 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 28.80, 28.80, 0, 0, 15, false),
('06-CAL-03', '66666666-6666-6666-6666-666666666666', 'COLOCACIÓN CALDERA DE GAS (Montaje MO)', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 273.60, 273.60, 0, 0, 15, false),
('06-CAL-04', '66666666-6666-6666-6666-666666666666', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 129.60, 129.60, 0, 0, 15, false),
('06-CAL-05', '66666666-6666-6666-6666-666666666666', 'COLOCACIÓN Y MOVIMIENTO RADIADORES (MO)', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 43.20, 43.20, 0, 0, 15, false),
('06-CAL-06', '66666666-6666-6666-6666-666666666666', 'LEGALIZACIÓN INSTALACIÓN (Certificación)', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 230.40, 230.40, 0, 0, 15, false),
('06-CAL-07', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN SUELO RADIANTE HÚMEDO', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', 'm²', 45.58, 45.57, 0, 0, 15, false),
('06-CAL-08', '66666666-6666-6666-6666-666666666666', 'ACOMETIDA DE GAS (Aprox.)', 'Coste estimado de conexión a la red de gas general.', 'Ud', 720.00, 720.00, 0, 0, 15, false),
('06-CAL-09', '66666666-6666-6666-6666-666666666666', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', 'Ud', 32.40, 32.40, 0, 0, 15, false),
('06-CAL-10', '66666666-6666-6666-6666-666666666666', 'INSTALACIÓN TERMO FLECK DUO 80L', 'Instalación y conexionado de termo eléctrico.', 'Ud', 138.96, 138.96, 0, 0, 15, false);

-- LIMPIEZA (2 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('07-L-01', '77777777-7777-7777-7777-777777777777', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 0, 0, 0, 15, false),
('07-L-02', '77777777-7777-7777-7777-777777777777', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 0, 0, 0, 0, 15, false);

-- MATERIALES (23 precios)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_custom) VALUES
('08-M-01', '88888888-8888-8888-8888-888888888888', 'PLATO DE DUCHA DE RESINA BLANCO', 'Plato de ducha de resina extraplano (Suministro, no instalación).', 'Ud', 74.00, 296.00, 0, 0, 15, false),
('08-M-02', '88888888-8888-8888-8888-888888888888', 'VÁLVULA PARA PLATO DE DUCHA', 'Válvula de desagüe para plato de ducha.', 'Ud', 12.00, 48.00, 0, 0, 15, false),
('08-M-03', '88888888-8888-8888-8888-888888888888', 'INODORO', 'Inodoro cerámico (Suministro, no instalación).', 'Ud', 50.00, 200.00, 0, 0, 15, false),
('08-M-04', '88888888-8888-8888-8888-888888888888', 'MONOMANDO LAVABO', 'Grifo monomando para lavabo.', 'Ud', 19.40, 77.60, 0, 0, 15, false),
('08-M-05', '88888888-8888-8888-8888-888888888888', 'DUCHA TERMOSTÁTICA', 'Grifo termostático para ducha.', 'Ud', 43.00, 172.00, 0, 0, 15, false),
('08-M-06', '88888888-8888-8888-8888-888888888888', 'MAMPARA DE DUCHA', 'Mampara de ducha (Suministro, no instalación).', 'Ud', 70.00, 280.00, 0, 0, 15, false),
('08-M-07', '88888888-8888-8888-8888-888888888888', 'CONJUNTO DE MUEBLE CON LAVABO', 'Mueble de baño con lavabo integrado.', 'Ud', 64.00, 256.00, 0, 0, 15, false),
('08-M-08', '88888888-8888-8888-8888-888888888888', 'BALDOSA Y AZULEJO', 'Coste del metro cuadrado de baldosa o azulejo para revestimientos.', 'm²', 4.00, 16.00, 0, 0, 15, false),
('08-M-09', '88888888-8888-8888-8888-888888888888', 'PARQUET FLOTANTE', 'Coste del metro cuadrado de tarima laminada de alta calidad.', 'm²', 6.60, 26.40, 0, 0, 15, false),
('08-M-10', '88888888-8888-8888-8888-888888888888', 'SUELO VINÍLICO CLIC', 'Coste del metro cuadrado de suelo de vinilo.', 'm²', 5.00, 20.00, 0, 0, 15, false),
('08-M-11', '88888888-8888-8888-8888-888888888888', 'MANTA SUELO PARQUET FLOTANTE', 'Suministro de lámina aislante bajo tarima.', 'm²', 0.80, 3.20, 0, 0, 15, false),
('08-M-12', '88888888-8888-8888-8888-888888888888', 'SUMINISTRO RODAPIÉ DM LACADO', 'Coste del rodapié de madera.', 'ml', 1.00, 4.00, 0, 0, 15, false),
('08-M-13', '88888888-8888-8888-8888-888888888888', 'PUERTA ABATIBLE EN BLOCK UNA HOJA', 'Coste de puerta de interior en kit.', 'Ud', 58.00, 232.00, 0, 0, 15, false),
('08-M-14', '88888888-8888-8888-8888-888888888888', 'CAJÓN PUERTA CORREDERA', 'Coste del armazón metálico para puerta corredera.', 'Ud', 44.00, 176.00, 0, 0, 15, false),
('08-M-15', '88888888-8888-8888-8888-888888888888', 'PUERTA CORREDERA EN KIT', 'Coste de hoja de puerta corredera.', 'Ud', 64.00, 256.00, 0, 0, 15, false),
('08-M-16', '88888888-8888-8888-8888-888888888888', 'PUERTA ENTRADA', 'Coste de puerta de seguridad.', 'Ud', 364.60, 1458.40, 0, 0, 15, false),
('08-M-17', '88888888-8888-8888-8888-888888888888', 'FORRO PUERTA ENTRADA', 'Forro de marco para puerta de entrada.', 'Ud', 19.00, 76.00, 0, 0, 15, false),
('08-M-18', '88888888-8888-8888-8888-888888888888', 'CALDERA CONDENSACIÓN', 'Suministro de caldera de condensación.', 'Ud', 382.00, 1528.00, 0, 0, 15, false),
('08-M-19', '88888888-8888-8888-8888-888888888888', 'RADIADOR ELÉCTRICO', 'Coste de radiador eléctrico.', 'Ud', 40.00, 160.00, 0, 0, 15, false),
('08-M-20', '88888888-8888-8888-8888-888888888888', 'RADIADORES', 'Suministro de radiador de agua.', 'Ud', 62.00, 248.00, 0, 0, 15, false),
('08-M-21', '88888888-8888-8888-8888-888888888888', 'RADIADOR TOALLERO', 'Suministro de radiador toallero.', 'Ud', 62.00, 248.00, 0, 0, 15, false),
('08-M-22', '88888888-8888-8888-8888-888888888888', 'TERMOSTATO AMBIENTE', 'Suministro de termostato.', 'Ud', 12.00, 48.00, 0, 0, 15, false),
('08-M-23', '88888888-8888-8888-8888-888888888888', 'TERMO ELÉCTRICO', 'Suministro de termo eléctrico.', 'Ud', 114.00, 456.00, 0, 0, 15, false);

-- Paso 5: Configurar políticas RLS
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active prices"
  ON price_master FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own custom prices"
  ON price_master FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create custom prices"
  ON price_master FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Users can update their own custom prices"
  ON price_master FOR UPDATE
  USING (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Users can delete their own custom prices"
  ON price_master FOR DELETE
  USING (is_custom = true AND user_id = auth.uid());

-- Paso 6: Configurar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_price_master_updated_at
    BEFORE UPDATE ON price_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- FINAL: Verificar conteo
SELECT COUNT(*) as TOTAL_PRECIOS_MAESTROS FROM price_master WHERE is_custom = false;
