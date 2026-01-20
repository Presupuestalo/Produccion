-- Corrected to insert into subcategory column instead of description
-- Restauración de precios de ALBAÑILERÍA desde backup del 20 de noviembre 2024
-- Este script elimina los precios corruptos de ALBAÑILERÍA y los reemplaza con los datos del backup

BEGIN;

-- Eliminar precios existentes de ALBAÑILERÍA
DELETE FROM price_master WHERE code LIKE '02-A-%';

-- Insertando con subcategory (concepto visible en UI) del campo subcategory del backup
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, material_cost, labor_cost, base_price, profit_margin, final_price, is_active, is_custom, created_at, updated_at) VALUES
('20dd77a6-0aa5-4a89-84fc-9a6089632854', '02-A-01', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN SOLERA MORTERO Y ARLITA', 'Formación de solera de mortero para nivelación y aislamiento (espesor no superior a 7cm).', 'm²', 17.86, 26.78, 44.64, 0.15, 44.64, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('28b87b11-cb6e-480e-b542-a9711889cbb4', '02-A-02', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'CAPA AUTONIVELANTE', 'Aplicación de mortero autonivelante de bajo espesor.', 'm²', 14.98, 22.46, 37.44, 0.15, 37.44, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('c40649e4-b62e-46de-8d00-49cf49e6cba0', '02-A-03', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN DE TRASDOSADO EN PLACA DE YESO (13+45)', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 23.62, 35.42, 59.04, 0.15, 59.04, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:58:38.488759+00'),
('800c1e4e-b16b-4d4d-b93c-1184b5a34203', '02-A-04', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'FORMACIÓN TABIQUE LADRILLO', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 14.40, 21.60, 36.00, 0.15, 36.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('5b0b0090-f418-4d89-8383-8ce27f39deae', '02-A-05', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'TABIQUE PLACA DE YESO A DOBLE CARA', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 26.78, 40.18, 66.96, 0.15, 66.96, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 11:00:37.437926+00'),
('24946a9d-1685-4eff-9067-e840a3e6ab65', '02-A-06', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALICATADOS PARED', 'Mano de obra de colocación de azulejos o revestimiento cerámico en paredes (No incluye material cerámico).', 'm²', 17.86, 26.78, 44.64, 0.15, 44.64, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('093bdd6e-618c-4285-be39-2ec9937258e7', '02-A-07', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO SUELOS', 'Mano de obra de colocación de baldosas cerámicas o porcelánicas en suelos (No incluye material cerámico).', 'm²', 19.87, 29.81, 49.68, 0.15, 49.68, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('823c691c-4db1-4ca8-8107-d007e1a6cc07', '02-A-08', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'EMBALDOSADO SUELO RADIANTE', 'Mano de obra de colocación de baldosas sobre suelo radiante (Requiere mortero y juntas específicos).', 'm²', 20.16, 30.24, 50.40, 0.15, 50.40, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('ebee8fd6-d037-4f29-991e-231476e6c3e9', '02-A-09', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'RASEO PREVIO ALICATADOS DE PARED', 'Raseo de las paredes para obtener una base lisa y plomada antes de alicatar.', 'm²', 8.64, 12.96, 21.60, 0.15, 21.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('d41077a9-9229-4b90-bb98-bac28e7afd36', '02-A-10', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'RASEO PREVIO EMBALDOSADOS SUELO', 'Raseo del suelo para obtener una base lisa antes de embaldosar.', 'm²', 8.64, 12.96, 21.60, 0.15, 21.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('f5c0c9da-b494-4ca5-99dd-ceb715cb0220', '02-A-11', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'LUCIDO PAREDES', 'Aplicación de capa de yeso o perlita en techos y paredes.', 'm²', 8.30, 12.44, 20.74, 0.15, 20.74, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:58:05.861129+00'),
('b0f31bfa-e5d3-4979-8cd1-c68fb6ba491a', '02-A-12', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'UNIDAD TAPADO DE ROZAS INSTALACIONES', 'Relleno y tapado de todas las rozas realizadas para el paso de instalaciones de fontanería y electricidad.', 'Ud', 230.40, 345.60, 576.00, 0.15, 576.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('7a145500-bdaf-4aa1-8be4-dca9ccad7ad2', '02-A-13', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN DE MOLDURAS', 'Suministro y colocación de moldura de escayola.', 'ml', 8.64, 12.96, 21.60, 0.15, 21.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('908fd380-35f9-440d-a23d-b8d1f1568743', '02-A-14', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'COLOCACIÓN CAJETÍN PUERTA CORREDERA', 'Instalación y raseo del armazón metálico para puerta corredera.', 'Ud', 109.44, 164.16, 273.60, 0.15, 273.60, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 11:00:15.899756+00'),
('42d5c095-1dc2-43ac-a645-5f6d11dc9d8d', '02-A-15', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AYUDA A GREMIOS', 'Asistencia de albañilería a fontaneros, electricistas o carpinteros.', 'Ud', 172.80, 259.20, 432.00, 0.15, 432.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:58.437689+00'),
('6cf4d628-4d22-404c-91be-995be0bb23b8', '02-A-16', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'BAJADO DE TECHOS', 'Instalación de falso techo en placa de yeso laminado.', 'm²', 15.50, 23.26, 38.76, 0.15, 38.76, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00'),
('9d9580ed-9015-4330-ad63-cb6a5552b2fa', '02-A-17', 'd6e90b3f-3bc5-4f15-8530-19da496abc5e', 'AISLANTES TÉRMICOS', 'Suministro y colocación de aislamiento térmico o acústico.', 'm²', 7.60, 11.40, 19.00, 0.15, 19.00, true, false, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:52.267254+00');

COMMIT;

-- Verificación
SELECT COUNT(*) as total_albanileria FROM price_master WHERE code LIKE '02-A-%';
