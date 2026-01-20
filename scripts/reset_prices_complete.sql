-- ============================================
-- SCRIPT DE RESETEO COMPLETO DE PRECIOS
-- ============================================
-- Este script elimina todos los precios y categorías existentes
-- y los vuelve a crear desde cero para evitar duplicados

-- PASO 1: Eliminar todas las políticas RLS existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename IN ('price_categories', 'price_master', 'price_history'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || 
                CASE 
                    WHEN r.policyname LIKE '%categor%' THEN 'price_categories'
                    WHEN r.policyname LIKE '%history%' THEN 'price_history'
                    ELSE 'price_master'
                END;
    END LOOP;
END $$;

-- PASO 2: Eliminar todos los datos existentes (en orden correcto por dependencias)
TRUNCATE TABLE public.price_history CASCADE;
TRUNCATE TABLE public.price_master CASCADE;
TRUNCATE TABLE public.price_categories CASCADE;

-- PASO 3: Insertar categorías (sin duplicados)
INSERT INTO public.price_categories (id, name, description, icon, display_order) VALUES
  ('DERRIBO', 'Derribos', 'Trabajos de demolición y retirada', 'Trash2', 1),
  ('ALBANILERIA', 'Albañilería', 'Trabajos de construcción y tabiquería', 'Hammer', 2),
  ('FONTANERIA', 'Fontanería', 'Instalaciones de agua y saneamiento', 'Droplet', 3),
  ('CARPINTERIA', 'Carpintería', 'Puertas, ventanas, suelos y armarios', 'DoorOpen', 4),
  ('ELECTRICIDAD', 'Electricidad', 'Instalaciones eléctricas', 'Zap', 5),
  ('CALEFACCION', 'Calefacción', 'Calefacción y climatización', 'Thermometer', 6),
  ('LIMPIEZA', 'Limpieza', 'Limpieza de obra', 'Sparkles', 7),
  ('MATERIALES', 'Materiales', 'Suministros y materiales', 'Package', 8);

-- PASO 4: Insertar precios de DERRIBOS
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('01-D-01', '01-D-01', 'DERRIBO', 'Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.', 'm²', 12.10, 5.18, 0, false),
  ('01-D-02', '01-D-02', 'DERRIBO', 'Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.', 'm²', 10.08, 4.32, 0, false),
  ('01-D-03', '01-D-03', 'DERRIBO', 'Picado de suelo y posterior desescombro.', 'm²', 14.82, 6.35, 0, false),
  ('01-D-04', '01-D-04', 'DERRIBO', 'Retirada y desescombro de falso techo de escayola o pladur.', 'm²', 10.08, 4.32, 0, false),
  ('01-D-05', '01-D-05', 'DERRIBO', 'Retirada de molduras de escayola o madera en el perímetro de techos.', 'ml', 1.01, 0.43, 0, false),
  ('01-D-06', '01-D-06', 'DERRIBO', 'Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.', 'm²', 6.05, 2.59, 0, false),
  ('01-D-07', '01-D-07', 'DERRIBO', 'Retirada de rodapié de madera y acopio para desescombro.', 'ml', 1.81, 0.78, 0, false),
  ('01-D-08', '01-D-08', 'DERRIBO', 'Retirada de rodapié cerámico o de azulejo.', 'ml', 3.93, 1.69, 0, false),
  ('01-D-09', '01-D-09', 'DERRIBO', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 50.40, 453.60, 0, false),
  ('01-D-10', '01-D-10', 'DERRIBO', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 18.00, 0.00, 0, false),
  ('01-D-11', '01-D-11', 'DERRIBO', 'Desconexión y anulación de líneas antiguas.', 'Ud', 120.96, 51.84, 0, false),
  ('01-D-12', '01-D-12', 'DERRIBO', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20.16, 8.64, 0, false),
  ('01-D-13', '01-D-13', 'DERRIBO', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 2.52, 1.08, 0, false),
  ('01-D-14', '01-D-14', 'DERRIBO', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 120.96, 51.84, 0, false),
  ('01-D-15', '01-D-15', 'DERRIBO', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 241.92, 103.68, 0, false),
  ('01-D-16', '01-D-16', 'DERRIBO', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 360.86, 154.66, 0, false);

-- PASO 5: Insertar precios de ALBAÑILERÍA
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('02-A-01', '02-A-01', 'ALBANILERIA', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 22.32, 22.32, 0, false),
  ('02-A-02', '02-A-02', 'ALBANILERIA', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 18.72, 18.72, 0, false),
  ('02-A-03', '02-A-03', 'ALBANILERIA', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 29.52, 29.52, 0, false),
  ('02-A-04', '02-A-04', 'ALBANILERIA', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 18.00, 18.00, 0, false),
  ('02-A-05', '02-A-05', 'ALBANILERIA', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 33.48, 33.48, 0, false),
  ('02-A-06', '02-A-06', 'ALBANILERIA', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 35.71, 8.93, 0, false),
  ('02-A-07', '02-A-07', 'ALBANILERIA', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 39.74, 9.94, 0, false),
  ('02-A-08', '02-A-08', 'ALBANILERIA', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 40.32, 10.08, 0, false),
  ('02-A-09', '02-A-09', 'ALBANILERIA', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 15.12, 6.48, 0, false),
  ('02-A-10', '02-A-10', 'ALBANILERIA', 'Raseo y enlucido de tabiquería nueva antes de pintar.', 'm²', 15.12, 6.48, 0, false),
  ('02-A-11', '02-A-11', 'ALBANILERIA', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 14.52, 6.22, 0, false),
  ('02-A-12', '02-A-12', 'ALBANILERIA', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 403.20, 172.80, 0, false),
  ('02-A-13', '02-A-13', 'ALBANILERIA', 'Suministro y colocación de moldura de escayola.', 'ml', 10.80, 10.80, 0, false),
  ('02-A-14', '02-A-14', 'ALBANILERIA', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 136.80, 136.80, 0, false),
  ('02-A-15', '02-A-15', 'ALBANILERIA', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 302.40, 129.60, 0, false),
  ('02-A-16', '02-A-16', 'ALBANILERIA', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 19.38, 19.38, 0, false),
  ('02-A-17', '02-A-17', 'ALBANILERIA', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 5.70, 13.30, 0, false);

-- PASO 6: Insertar precios de FONTANERÍA
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('03-F-01', '03-F-01', 'FONTANERIA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 665.28, 285.12, 0, false),
  ('03-F-02', '03-F-02', 'FONTANERIA', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 463.68, 198.72, 0, false),
  ('03-F-03', '03-F-03', 'FONTANERIA', 'Sustitución de tramo de bajante.', 'Ud', 216.72, 92.88, 0, false),
  ('03-F-04', '03-F-04', 'FONTANERIA', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 114.91, 49.25, 0, false),
  ('03-F-05', '03-F-05', 'FONTANERIA', 'Colocación de conducto para campana extractora de humos.', 'Ud', 181.44, 77.76, 0, false),
  ('03-F-06', '03-F-06', 'FONTANERIA', 'Montaje e instalación del inodoro.', 'Ud', 50.40, 21.60, 0, false),
  ('03-F-07', '03-F-07', 'FONTANERIA', 'Instalación y sellado del plato de ducha.', 'Ud', 100.80, 43.20, 0, false),
  ('03-F-08', '03-F-08', 'FONTANERIA', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 90.72, 38.88, 0, false),
  ('03-F-09', '03-F-09', 'FONTANERIA', 'Montaje de mampara de ducha o bañera.', 'Ud', 95.76, 41.04, 0, false),
  ('03-F-10', '03-F-10', 'FONTANERIA', 'Montaje de monomando o termostática de ducha.', 'Ud', 50.40, 21.60, 0, false),
  ('03-F-11', '03-F-11', 'FONTANERIA', 'Montaje de monomando de lavabo.', 'Ud', 50.40, 21.60, 0, false),
  ('03-F-12', '03-F-12', 'FONTANERIA', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 65.52, 28.08, 0, false),
  ('03-F-13', '03-F-13', 'FONTANERIA', 'Instalación de campana extractora en cocina.', 'Ud', 50.40, 21.60, 0, false);

-- PASO 7: Insertar precios de CARPINTERÍA
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('04-C-01', '04-C-01', 'CARPINTERIA', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 25.20, 25.20, 0, false),
  ('04-C-02', '04-C-02', 'CARPINTERIA', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 16.70, 4.18, 0, false),
  ('04-C-03', '04-C-03', 'CARPINTERIA', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 21.89, 5.47, 0, false),
  ('04-C-04', '04-C-04', 'CARPINTERIA', 'Suministro y colocación de rodapié.', 'ml', 3.22, 4.84, 0, false),
  ('04-C-05', '04-C-05', 'CARPINTERIA', 'Instalación de premarco.', 'Ud', 90.72, 38.88, 0, false),
  ('04-C-06', '04-C-06', 'CARPINTERIA', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 200.59, 85.97, 0, false),
  ('04-C-07', '04-C-07', 'CARPINTERIA', 'Instalación de puerta abatible en block.', 'Ud', 100.80, 43.20, 0, false),
  ('04-C-08', '04-C-08', 'CARPINTERIA', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 231.84, 99.36, 0, false),
  ('04-C-09', '04-C-09', 'CARPINTERIA', 'Instalación de puerta de seguridad.', 'Ud', 455.00, 195.00, 0, false),
  ('04-C-10', '04-C-10', 'CARPINTERIA', 'Lijado y barnizado de suelo de madera existente.', 'm²', 16.13, 6.91, 0, false),
  ('04-C-11', '04-C-11', 'CARPINTERIA', 'Relleno de juntas de tarima.', 'm²', 5.04, 2.16, 0, false),
  ('04-C-12', '04-C-12', 'CARPINTERIA', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 16.13, 6.91, 0, false);

-- PASO 8: Insertar precios de ELECTRICIDAD
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('05-E-01', '05-E-01', 'ELECTRICIDAD', 'Instalación de cuadro eléctrico con 18 módulos y elementos de protección.', 'Ud', 316.80, 475.20, 0, false),
  ('05-E-02', '05-E-02', 'ELECTRICIDAD', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 100.80, 151.20, 0, false),
  ('05-E-03', '05-E-03', 'ELECTRICIDAD', 'Instalación de telefonillo.', 'Ud', 54.72, 82.08, 0, false),
  ('05-E-04', '05-E-04', 'ELECTRICIDAD', 'Colocación de un cuadro eléctrico provisional para la reforma.', 'Ud', 158.40, 237.60, 0, false),
  ('05-E-05', '05-E-05', 'ELECTRICIDAD', 'Tendido de línea de enchufes estándar.', 'Ud', 135.36, 203.04, 0, false),
  ('05-E-06', '05-E-06', 'ELECTRICIDAD', 'Tendido de línea de alumbrado general.', 'Ud', 135.36, 203.04, 0, false),
  ('05-E-07', '05-E-07', 'ELECTRICIDAD', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 35.28, 15.12, 0, false),
  ('05-E-08', '05-E-08', 'ELECTRICIDAD', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 55.44, 23.76, 0, false),
  ('05-E-09', '05-E-09', 'ELECTRICIDAD', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 65.52, 28.08, 0, false),
  ('05-E-10', '05-E-10', 'ELECTRICIDAD', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 40.32, 17.28, 0, false),
  ('05-E-11', '05-E-11', 'ELECTRICIDAD', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 57.46, 24.62, 0, false),
  ('05-E-12', '05-E-12', 'ELECTRICIDAD', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 64.51, 27.65, 0, false),
  ('05-E-13', '05-E-13', 'ELECTRICIDAD', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 40.32, 17.28, 0, false),
  ('05-E-14', '05-E-14', 'ELECTRICIDAD', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 34.56, 8.64, 0, false),
  ('05-E-15', '05-E-15', 'ELECTRICIDAD', 'Instalación de pulsador y timbre.', 'Ud', 45.36, 19.44, 0, false),
  ('05-E-16', '05-E-16', 'ELECTRICIDAD', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 112.00, 168.00, 0, false),
  ('05-E-17', '05-E-17', 'ELECTRICIDAD', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 140.00, 210.00, 0, false);

-- PASO 9: Insertar precios de CALEFACCIÓN
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('06-CAL-01', '06-CAL-01', 'CALEFACCION', 'Instalación y conexión a la línea eléctrica.', 'Ud', 40.32, 17.28, 0, false),
  ('06-CAL-02', '06-CAL-02', 'CALEFACCION', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 40.32, 17.28, 0, false),
  ('06-CAL-03', '06-CAL-03', 'CALEFACCION', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 383.04, 164.16, 0, false),
  ('06-CAL-04', '06-CAL-04', 'CALEFACCION', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 181.44, 77.76, 0, false),
  ('06-CAL-05', '06-CAL-05', 'CALEFACCION', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 60.48, 25.92, 0, false),
  ('06-CAL-06', '06-CAL-06', 'CALEFACCION', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 184.32, 276.48, 0, false),
  ('06-CAL-07', '06-CAL-07', 'CALEFACCION', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', 'm²', 45.58, 45.57, 0, false),
  ('06-CAL-08', '06-CAL-08', 'CALEFACCION', 'Coste estimado de conexión a la red de gas general.', 'Ud', 576.00, 864.00, 0, false),
  ('06-CAL-09', '06-CAL-09', 'CALEFACCION', 'Sustitución de piezas de conexión del radiador.', 'Ud', 45.36, 19.44, 0, false),
  ('06-CAL-10', '06-CAL-10', 'CALEFACCION', 'Instalación y conexionado de termo eléctrico.', 'Ud', 194.54, 83.38, 0, false);

-- PASO 10: Insertar precios de LIMPIEZA
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('07-L-01', '07-L-01', 'LIMPIEZA', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 0.00, 0, false),
  ('07-L-02', '07-L-02', 'LIMPIEZA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 201.60, 0.00, 0, false);

-- PASO 11: Insertar precios de MATERIALES
INSERT INTO public.price_master (id, code, category_id, description, unit, labor_cost, material_cost, margin_percentage, is_custom) VALUES
  ('08-M-01', '08-M-01', 'MATERIALES', 'Plato de ducha de resina extraplano (Suministro, no instalación).', 'Ud', 0.00, 370.00, 0, false),
  ('08-M-02', '08-M-02', 'MATERIALES', 'Válvula de desagüe para plato de ducha.', 'Ud', 0.00, 60.00, 0, false),
  ('08-M-03', '08-M-03', 'MATERIALES', 'Inodoro cerámico (Suministro, no instalación).', 'Ud', 0.00, 250.00, 0, false),
  ('08-M-04', '08-M-04', 'MATERIALES', 'Grifo monomando para lavabo.', 'Ud', 0.00, 97.00, 0, false),
  ('08-M-05', '08-M-05', 'MATERIALES', 'Grifo termostático para ducha.', 'Ud', 0.00, 215.00, 0, false),
  ('08-M-06', '08-M-06', 'MATERIALES', 'Mampara de ducha (Suministro, no instalación).', 'Ud', 0.00, 350.00, 0, false),
  ('08-M-07', '08-M-07', 'MATERIALES', 'Mueble de baño con lavabo integrado.', 'Ud', 0.00, 320.00, 0, false),
  ('08-M-08', '08-M-08', 'MATERIALES', 'Coste del metro cuadrado de baldosa o azulejo para revestimientos.', 'm²', 0.00, 20.00, 0, false),
  ('08-M-09', '08-M-09', 'MATERIALES', 'Coste del metro cuadrado de tarima laminada de alta calidad.', 'm²', 0.00, 33.00, 0, false),
  ('08-M-10', '08-M-10', 'MATERIALES', 'Coste del metro cuadrado de suelo de vinilo.', 'm²', 0.00, 25.00, 0, false),
  ('08-M-11', '08-M-11', 'MATERIALES', 'Suministro de lámina aislante bajo tarima.', 'm²', 0.00, 4.00, 0, false),
  ('08-M-12', '08-M-12', 'MATERIALES', 'Coste del rodapié de madera.', 'ml', 0.00, 5.00, 0, false),
  ('08-M-13', '08-M-13', 'MATERIALES', 'Coste de puerta de interior en kit.', 'Ud', 0.00, 290.00, 0, false),
  ('08-M-14', '08-M-14', 'MATERIALES', 'Coste del armazón metálico para puerta corredera.', 'Ud', 0.00, 220.00, 0, false),
  ('08-M-15', '08-M-15', 'MATERIALES', 'Coste de hoja de puerta corredera.', 'Ud', 0.00, 320.00, 0, false),
  ('08-M-16', '08-M-16', 'MATERIALES', 'Coste de puerta de seguridad.', 'Ud', 0.00, 1823.00, 0, false),
  ('08-M-17', '08-M-17', 'MATERIALES', 'Forro de marco para puerta de entrada.', 'Ud', 0.00, 95.00, 0, false),
  ('08-M-18', '08-M-18', 'MATERIALES', 'Suministro de caldera de condensación.', 'Ud', 0.00, 1910.00, 0, false),
  ('08-M-19', '08-M-19', 'MATERIALES', 'Coste de radiador eléctrico.', 'Ud', 0.00, 200.00, 0, false),
  ('08-M-20', '08-M-20', 'MATERIALES', 'Suministro de radiador de agua.', 'Ud', 0.00, 310.00, 0, false),
  ('08-M-21', '08-M-21', 'MATERIALES', 'Suministro de radiador toallero.', 'Ud', 0.00, 310.00, 0, false),
  ('08-M-22', '08-M-22', 'MATERIALES', 'Suministro de termostato.', 'Ud', 0.00, 60.00, 0, false),
  ('08-M-23', '08-M-23', 'MATERIALES', 'Suministro de termo eléctrico.', 'Ud', 0.00, 570.00, 0, false);

-- PASO 12: Recrear políticas RLS
ALTER TABLE public.price_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver categorías"
  ON public.price_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ver precios estándar y propios"
  ON public.price_master FOR SELECT
  TO authenticated
  USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Crear precios personalizados"
  ON public.price_master FOR INSERT
  TO authenticated
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Actualizar precios propios"
  ON public.price_master FOR UPDATE
  TO authenticated
  USING (
    (is_custom = true AND user_id = auth.uid()) OR
    (is_custom = false AND auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'user_type' = 'admin'
    ))
  );

CREATE POLICY "Eliminar precios propios"
  ON public.price_master FOR DELETE
  TO authenticated
  USING (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Ver historial propio"
  ON public.price_history FOR SELECT
  TO authenticated
  USING (
    price_id IN (
      SELECT id FROM public.price_master 
      WHERE is_custom = false OR user_id = auth.uid()
    )
  );

-- PASO 13: Verificar resultados
SELECT 'Categorías insertadas:' as info, COUNT(*) as total FROM public.price_categories;
SELECT 'Precios insertados:' as info, COUNT(*) as total FROM public.price_master;
SELECT category_id, COUNT(*) as total FROM public.price_master GROUP BY category_id ORDER BY category_id;
