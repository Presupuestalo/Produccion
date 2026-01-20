-- PARTE 2: ALBAÑILERÍA (17 conceptos)
-- Eliminar precios existentes de Perú en esta categoría
DELETE FROM price_master_peru WHERE category_id = 'd6e90b3f-3bc5-4f15-8530-19da496abc5e';

-- ALBAÑILERÍA
INSERT INTO price_master_peru (code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, base_price, margin_percentage, final_price, is_active)
VALUES
('02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN CONTRAPISO MORTERO Y ARLITA', 'Formación de contrapiso de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 100, 80, 15, 5, 200, 0.05, 210.00, true),
('02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'CAPA AUTONIVELANTE (<= 15MM)', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 80, 80, 10, 5, 175, 0.05, 183.75, true),
('02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN DE TRASDOSADO EN DRYWALL (13+45)', 'Colocación de una capa de plancha de drywall de 13mm sobre perfilería.', 'm²', 120, 100, 20, 10, 250, 0.05, 262.50, true),
('02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (pandereta o hueco).', 'm²', 80, 60, 10, 5, 155, 0.03, 159.65, true),
('02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TABIQUES DRYWALL DOBLE CARA (13x45x13)', 'Levantamiento de tabique con doble plancha de drywall de 13mm en ambas caras y aislamiento interior.', 'm²', 150, 130, 25, 10, 315, 0.05, 330.75, true),
('02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'ENCHAPE PARED (Colocación MO)', 'Mano de obra de colocación de mayólica o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 120, 60, 15, 5, 200, 0.05, 210.00, true),
('02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'PISO CERÁMICO (Colocación MO)', 'Mano de obra de colocación de cerámicos o porcelanatos en pisos (No incluye material cerámico).', 'm²', 130, 70, 20, 5, 225, 0.05, 236.25, true),
('02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'PISO RADIANTE (Colocación MO)', 'Mano de obra de colocación de cerámicos sobre piso radiante (Requiere mortero y juntas específicos).', 'm²', 135, 75, 20, 5, 235, 0.05, 246.75, true),
('02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO ENCHAPES', 'Tarrajeo de las paredes para obtener una base lisa y aplomada antes de colocar mayólica.', 'm²', 55, 30, 8, 2, 95, 0.05, 99.75, true),
('02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'TARRAJEO PREVIO LEVANTE TABIQUERÍA', 'Tarrajeo y enlucido de tabiquería nueva antes de pintar.', 'm²', 55, 30, 8, 2, 95, 0.05, 99.75, true),
('02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'ENLUCIDO PAREDES (Yeso o perlita)', 'Aplicación de capa de yeso o perlita en cielos rasos y paredes.', 'm²', 52, 30, 8, 2, 92, 0.05, 96.60, true),
('02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'UNIDAD TAPADO DE CANALETAS INSTALACIONES', 'Relleno y tapado de todas las canaletas realizadas para el paso de instalaciones de gasfitería y electricidad.', 'Ud', 400, 150, 50, 20, 620, 0.05, 651.00, true),
('02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de yeso.', 'ml', 55, 35, 8, 2, 100, 0.05, 105.00, true),
('02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'COLOCACIÓN CAJÓN PUERTA CORREDERA (Armazón)', 'Instalación y tarrajeo del armazón metálico para puerta corredera.', 'Ud', 200, 100, 30, 10, 340, 0.05, 357.00, true),
('02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AYUDA A GREMIOS (Limpieza, acopio, transporte)', 'Asistencia de albañilería a gasfiteros, electricistas o carpinteros.', 'Ud', 350, 50, 30, 10, 440, 0.05, 462.00, true),
('02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'BAJADO DE CIELOS RASOS (Drywall BA 15)', 'Instalación de falso cielo raso en plancha de drywall.', 'm²', 90, 70, 15, 5, 180, 0.05, 189.00, true),
('02-A-17', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'AISLANTES TÉRMICOS (Fibra de vidrio)', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 45, 35, 8, 2, 90, 0.05, 94.50, true);

-- Verificación
SELECT 'ALBAÑILERÍA' as categoria, COUNT(*) as total_precios FROM price_master_peru WHERE category_id = 'd6e90b3f-3bc5-4f15-8530-19da496abc5e';
