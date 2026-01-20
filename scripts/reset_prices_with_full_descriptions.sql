-- ============================================
-- SCRIPT DE RESETEO COMPLETO DE PRECIOS
-- Con descripciones completas y detalladas
-- ============================================

-- PASO 1: Eliminar todas las políticas RLS existentes dinámicamente
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

-- PASO 2: Limpiar todas las tablas
TRUNCATE TABLE public.price_history CASCADE;
TRUNCATE TABLE public.price_master CASCADE;
TRUNCATE TABLE public.price_categories CASCADE;

-- PASO 3: Insertar categorías
INSERT INTO public.price_categories (id, name, description, icon, display_order) VALUES
  (gen_random_uuid(), 'DERRIBO', 'Trabajos de demolición y retirada', 'Trash2', 1),
  (gen_random_uuid(), 'ALBANILERIA', 'Trabajos de construcción y tabiquería', 'Hammer', 2),
  (gen_random_uuid(), 'FONTANERIA', 'Instalaciones de agua y saneamiento', 'Droplet', 3),
  (gen_random_uuid(), 'CARPINTERIA', 'Puertas, ventanas, suelos y armarios', 'DoorOpen', 4),
  (gen_random_uuid(), 'ELECTRICIDAD', 'Instalaciones eléctricas', 'Zap', 5),
  (gen_random_uuid(), 'CALEFACCION', 'Calefacción y climatización', 'Thermometer', 6),
  (gen_random_uuid(), 'LIMPIEZA', 'Limpieza de obra', 'Sparkles', 7),
  (gen_random_uuid(), 'MATERIALES', 'Suministros y materiales', 'Package', 8);

-- PASO 4: Insertar precios con descripciones completas
WITH cats AS (
  SELECT id, name FROM public.price_categories
)

-- DERRIBOS
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(),
  '01-D-01',
  (SELECT id FROM cats WHERE name = 'DERRIBO'),
  'Tabiquería',
  'Tirar tabique existente, incluyendo mano de obra y desescombro a punto autorizado.',
  'm²',
  12.10,
  5.18,
  0.00,
  0.00,
  0.00,
  true,
  false,
  NULL::uuid,
  NULL
UNION ALL SELECT gen_random_uuid(), '01-D-02', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Revestimientos', 'Picado de paredes para la retirada del alicatado o revestimiento cerámico existente en parámetros verticales.', 'm²', 10.08, 4.32, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-03', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Picado de suelo y posterior desescombro.', 'm²', 14.82, 6.35, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-04', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Falsos techos', 'Retirada y desescombro de falso techo de escayola o pladur.', 'm²', 10.08, 4.32, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-05', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Molduras', 'Retirada de molduras de escayola o madera en el perímetro de techos.', 'ml', 1.01, 0.43, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-06', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Pavimentos', 'Desmontaje de tarima flotante o suelo de madera incluyendo los rastreles inferiores.', 'm²', 6.05, 2.59, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-07', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Rodapiés', 'Retirada de rodapié de madera y acopio para desescombro.', 'ml', 1.81, 0.78, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-08', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Rodapiés', 'Retirada de rodapié cerámico o de azulejo.', 'ml', 3.93, 1.69, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-09', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Contenedores', 'Suministro, colocación y retirada de contenedor de residuos de obra a vertedero autorizado.', 'Ud', 50.40, 453.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-10', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Mano de obra', 'Mano de obra por hora dedicada al acarreo y bajada de escombros.', 'H', 18.00, 0.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-11', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Instalaciones', 'Desconexión y anulación de líneas antiguas.', 'Ud', 120.96, 51.84, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-12', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Carpintería', 'Desmontaje de hoja de puerta existente y posterior retirada.', 'Ud', 20.16, 8.64, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-13', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Revestimientos', 'Rascado de paredes para eliminación de gotelé, papel pintado o materiales blandos.', 'm²', 2.52, 1.08, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-14', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Sanitarios', 'Desmontaje y retirada de inodoro, bidé, lavabo o bañera.', 'Ud', 120.96, 51.84, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-15', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Mobiliario', 'Desmontaje de muebles altos y bajos de cocina existentes.', 'Ud', 241.92, 103.68, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '01-D-16', (SELECT id FROM cats WHERE name = 'DERRIBO'), 'Mobiliario', 'Desmontaje de armarios empotrados o mobiliario fijo a medida.', 'Ud', 360.86, 154.66, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- ALBAÑILERÍA
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '02-A-01', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Soleras', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 22.32, 22.32, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-02', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Nivelación', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 18.72, 18.72, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-03', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Trasdosados', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 29.52, 29.52, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-04', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 18.00, 18.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-05', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Tabiquería', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 33.48, 33.48, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-06', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Alicatados', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 35.71, 8.93, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-07', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Solados', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 39.74, 9.94, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-08', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Solados', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 40.32, 10.08, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-09', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Enfoscados', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 15.12, 6.48, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-10', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Enlucidos', 'Raseo y enlucido de tabiquería nueva antes de pintar.', 'm²', 15.12, 6.48, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-11', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Guarnecidos', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 14.52, 6.22, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-12', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Rozas', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 403.20, 172.80, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-13', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Molduras', 'Suministro y colocación de moldura de escayola.', 'ml', 10.80, 10.80, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-14', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Puertas correderas', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 136.80, 136.80, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-15', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Asistencias', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 302.40, 129.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-16', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Falsos techos', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 19.38, 19.38, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '02-A-17', (SELECT id FROM cats WHERE name = 'ALBANILERIA'), 'Aislamientos', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 5.70, 13.30, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- FONTANERÍA
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '03-F-01', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Redes', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) del baño.', 'Ud', 665.28, 285.12, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-02', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Redes', 'Renovación completa de red de agua fría (AF) y agua caliente sanitaria (ACS) de la cocina.', 'Ud', 463.68, 198.72, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-03', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Bajantes', 'Sustitución de tramo de bajante.', 'Ud', 216.72, 92.88, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-04', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Ventilación', 'Colocación de conducto para extractor de ventilación en baño.', 'Ud', 114.91, 49.25, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-05', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Ventilación', 'Colocación de conducto para campana extractora de humos.', 'Ud', 181.44, 77.76, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-06', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Sanitarios', 'Montaje e instalación del inodoro.', 'Ud', 50.40, 21.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-07', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Platos ducha', 'Instalación y sellado del plato de ducha.', 'Ud', 100.80, 43.20, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-08', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Lavabos', 'Instalación de mueble y lavabo, incluyendo espejo y aplique.', 'Ud', 90.72, 38.88, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-09', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Mamparas', 'Montaje de mampara de ducha o bañera.', 'Ud', 95.76, 41.04, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-10', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Montaje de monomando o termostática de ducha.', 'Ud', 50.40, 21.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-11', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Grifería', 'Montaje de monomando de lavabo.', 'Ud', 50.40, 21.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-12', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Electrodomésticos', 'Instalación y conexionado de electrodomésticos de agua.', 'Ud', 65.52, 28.08, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '03-F-13', (SELECT id FROM cats WHERE name = 'FONTANERIA'), 'Campanas', 'Instalación de campana extractora en cocina.', 'Ud', 50.40, 21.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- CARPINTERÍA
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '04-C-01', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Nivelación', 'Colocación de tablero sobre rastreles para nivelar un suelo antes de instalar tarima.', 'm²', 25.20, 25.20, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-02', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Tarimas', 'Mano de obra de colocación de tarima flotante o suelo laminado.', 'm²', 16.70, 4.18, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-03', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Vinilos', 'Mano de obra de colocación de suelo de vinilo tipo "click".', 'm²', 21.89, 5.47, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-04', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Rodapiés', 'Suministro y colocación de rodapié.', 'ml', 3.22, 4.84, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-05', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Premarcos', 'Instalación de premarco.', 'Ud', 90.72, 38.88, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-06', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Marcos', 'Instalación de forro de marco sin hoja de puerta.', 'Ud', 200.59, 85.97, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-07', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas', 'Instalación de puerta abatible en block.', 'Ud', 100.80, 43.20, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-08', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas correderas', 'Instalación de hoja de puerta corredera en su cajetín.', 'Ud', 231.84, 99.36, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-09', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Puertas seguridad', 'Instalación de puerta de seguridad.', 'Ud', 455.00, 195.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-10', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Tratamientos', 'Lijado y barnizado de suelo de madera existente.', 'm²', 16.13, 6.91, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-11', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Reparaciones', 'Relleno de juntas de tarima.', 'm²', 5.04, 2.16, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '04-C-12', (SELECT id FROM cats WHERE name = 'CARPINTERIA'), 'Ajustes', 'Rebaje inferior de puertas para ajuste a la altura del nuevo suelo.', 'Ud', 16.13, 6.91, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- ELECTRICIDAD
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '05-E-01', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Cuadros', 'Instalación de cuadro eléctrico con 18 módulos y elementos de protección.', 'Ud', 316.80, 475.20, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-02', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Telecomunicaciones', 'Instalación de red de cableado para TV y voz/datos.', 'Ud', 100.80, 151.20, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-03', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Telefonillos', 'Instalación de telefonillo.', 'Ud', 54.72, 82.08, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-04', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Provisionales', 'Colocación de un cuadro eléctrico provisional para la reforma.', 'Ud', 158.40, 237.60, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-05', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Líneas', 'Tendido de línea de enchufes estándar.', 'Ud', 135.36, 203.04, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-06', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Líneas', 'Tendido de línea de alumbrado general.', 'Ud', 135.36, 203.04, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-07', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos luz', 'Mecanismo e instalación de un punto de luz simple (interruptor + luz).', 'Ud', 35.28, 15.12, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-08', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos luz', 'Mecanismo e instalación de un punto de luz que se controla desde dos interruptores.', 'Ud', 55.44, 23.76, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-09', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Puntos luz', 'Mecanismo e instalación de un punto de luz que se controla desde tres o más interruptores.', 'Ud', 65.52, 28.08, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-10', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Enchufes', 'Mecanismo e instalación de un enchufe de pared estándar.', 'Ud', 40.32, 17.28, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-11', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Enchufes', 'Mecanismo e instalación de enchufe apto para exterior.', 'Ud', 57.46, 24.62, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-12', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Telecomunicaciones', 'Mecanismo e instalación de toma de antena y telecomunicaciones.', 'Ud', 64.51, 27.65, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-13', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Electrodomésticos', 'Enchufe para electrodomésticos (lavadora, horno, etc.).', 'Ud', 40.32, 17.28, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-14', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Focos', 'Mano de obra por la instalación de focos empotrados en falso techo (focos no incluidos).', 'Ud', 34.56, 8.64, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-15', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Timbres', 'Instalación de pulsador y timbre.', 'Ud', 45.36, 19.44, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-16', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Calefacción', 'Tendido de línea independiente para radiadores eléctricos.', 'Ud', 112.00, 168.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '05-E-17', (SELECT id FROM cats WHERE name = 'ELECTRICIDAD'), 'Certificados', 'Emisión del certificado de instalación eléctrica y legalización.', 'Ud', 140.00, 210.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- CALEFACCIÓN
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '06-CAL-01', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Radiadores', 'Instalación y conexión a la línea eléctrica.', 'Ud', 40.32, 17.28, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-02', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Calderas', 'Desmontaje y montaje de caldera en el mismo sitio.', 'Ud', 40.32, 17.28, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-03', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Calderas', 'Mano de obra por la instalación completa de una nueva caldera.', 'Ud', 383.04, 164.16, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-04', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Tuberías', 'Instalación de tubería multicapa desde el colector hasta el radiador.', 'Ud', 181.44, 77.76, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-05', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Radiadores', 'Instalación de nuevo radiador o movimiento de uno existente.', 'Ud', 60.48, 25.92, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-06', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Certificados', 'Emisión de certificados y legalización de la instalación de gas.', 'Ud', 184.32, 276.48, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-07', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Suelo radiante', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', 'm²', 45.58, 45.57, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-08', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Gas', 'Coste estimado de conexión a la red de gas general.', 'Ud', 576.00, 864.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-09', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Reparaciones', 'Sustitución de piezas de conexión del radiador.', 'Ud', 45.36, 19.44, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '06-CAL-10', (SELECT id FROM cats WHERE name = 'CALEFACCION'), 'Termos', 'Instalación y conexionado de termo eléctrico.', 'Ud', 194.54, 83.38, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- LIMPIEZA
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '07-L-01', (SELECT id FROM cats WHERE name = 'LIMPIEZA'), 'Limpieza periódica', 'Mano de obra por la limpieza diaria/semanal de la obra.', 'Ud', 100.80, 0.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '07-L-02', (SELECT id FROM cats WHERE name = 'LIMPIEZA'), 'Limpieza final', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', 'Ud', 0.00, 0.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- MATERIALES
INSERT INTO public.price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes)
SELECT 
  gen_random_uuid(), '08-M-01', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Platos ducha', 'Plato de ducha de resina extraplano (Suministro, no instalación).', 'Ud', 0.00, 370.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-02', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Desagües', 'Válvula de desagüe para plato de ducha.', 'Ud', 0.00, 60.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-03', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Sanitarios', 'Inodoro cerámico (Suministro, no instalación).', 'Ud', 0.00, 250.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-04', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Grifería', 'Grifo monomando para lavabo.', 'Ud', 0.00, 97.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-05', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Grifería', 'Grifo termostático para ducha.', 'Ud', 0.00, 215.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-06', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Mamparas', 'Mampara de ducha (Suministro, no instalación).', 'Ud', 0.00, 350.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-07', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Muebles baño', 'Mueble de baño con lavabo integrado.', 'Ud', 0.00, 320.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-08', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Cerámicas', 'Coste del metro cuadrado de baldosa o azulejo para revestimientos.', 'm²', 0.00, 20.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-09', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Tarimas', 'Coste del metro cuadrado de tarima laminada de alta calidad.', 'm²', 0.00, 33.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-10', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Vinilos', 'Coste del metro cuadrado de suelo de vinilo.', 'm²', 0.00, 25.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-11', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Aislamientos', 'Suministro de lámina aislante bajo tarima.', 'm²', 0.00, 4.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-12', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Rodapiés', 'Coste del rodapié de madera.', 'ml', 0.00, 5.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-13', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Puertas', 'Coste de puerta de interior en kit.', 'Ud', 0.00, 290.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-14', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Puertas correderas', 'Coste del armazón metálico para puerta corredera.', 'Ud', 0.00, 220.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-15', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Puertas correderas', 'Coste de hoja de puerta corredera.', 'Ud', 0.00, 320.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-16', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Puertas seguridad', 'Coste de puerta de seguridad.', 'Ud', 0.00, 1823.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-17', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Marcos', 'Forro de marco para puerta de entrada.', 'Ud', 0.00, 95.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-18', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Calderas', 'Suministro de caldera de condensación.', 'Ud', 0.00, 1910.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-19', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Radiadores', 'Coste de radiador eléctrico.', 'Ud', 0.00, 200.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-20', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Radiadores', 'Suministro de radiador de agua.', 'Ud', 0.00, 310.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-21', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Toalleros', 'Suministro de radiador toallero.', 'Ud', 0.00, 310.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-22', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Termostatos', 'Suministro de termostato.', 'Ud', 0.00, 60.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL
UNION ALL SELECT gen_random_uuid(), '08-M-23', (SELECT id FROM cats WHERE name = 'MATERIALES'), 'Termos', 'Suministro de termo eléctrico.', 'Ud', 0.00, 570.00, 0.00, 0.00, 0.00, true, false, NULL::uuid, NULL;

-- PASO 5: Recrear políticas RLS
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
