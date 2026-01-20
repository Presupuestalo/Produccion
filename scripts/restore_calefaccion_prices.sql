-- Restauración de precios de CALEFACCIÓN desde backup del 20/11/2025

BEGIN;

DELETE FROM price_master WHERE code LIKE '07-CAL-%';

INSERT INTO price_master (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes, created_at, updated_at, created_by, updated_by, base_price, final_price, color, brand, model, profit_margin) VALUES
('d61bcc7e-c916-4741-9dc4-e6d44a667980', '07-CAL-02', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RECOLOCAR CALDERA DE GAS-SIN DESPLAZAMIENTO', 'Desmontaje y montaje de caldera en el mismo sitio.', NULL, 'Ud', 28.80, 28.80, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 57.60, 57.60, NULL, NULL, NULL, 0.15),
('41f72655-941f-4a16-9a80-00f98ac96ccd', '07-CAL-03', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN CALDERA DE GAS', 'Mano de obra por la instalación completa de una nueva caldera.', NULL, 'Ud', 273.60, 273.60, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 547.20, 547.20, NULL, NULL, NULL, 0.15),
('7fdf3cb2-f08a-4793-8963-027925dc8ffd', '07-CAL-04', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'RED ALIMENTACIÓN POR RADIADOR', 'Instalación de tubería multicapa desde el colector hasta el radiador.', NULL, 'Ud', 129.60, 129.60, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 259.20, 259.20, NULL, NULL, NULL, 0.15),
('15c9fc75-acec-42e6-8b3c-499987f44c4e', '07-CAL-05', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'COLOCACIÓN Y MOVIMIENTO RADIADORES', 'Instalación de nuevo radiador o movimiento de uno existente.', NULL, 'Ud', 43.20, 43.20, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 86.40, 86.40, NULL, NULL, NULL, 0.15),
('3afe9d6c-0c56-40b3-93be-d9c7c6375414', '07-CAL-06', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'LEGALIZACIÓN INSTALACIÓN', 'Emisión de certificados y legalización de la instalación de gas.', NULL, 'Ud', 230.40, 230.40, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:11.343074+00', NULL, NULL, 460.80, 460.80, NULL, NULL, NULL, 0.15),
('aa514e1f-0004-4d34-bdc3-ee152dc15896', '07-CAL-07', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN SUELO RADIANTE HÚMEDO', 'Instalación de red de tuberías de suelo radiante sobre base aislante.', NULL, 'm²', 45.58, 45.57, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 91.15, 91.15, NULL, NULL, NULL, 0.15),
('c74e76f9-8672-486a-a36c-9b9541030838', '07-CAL-08', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'ACOMETIDA DE GAS', 'Coste estimado de conexión a la red de gas general.', NULL, 'Ud', 720.00, 720.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-20 10:57:05.362354+00', NULL, NULL, 1440.00, 1440.00, NULL, NULL, NULL, 0.15),
('46218d7a-2e6e-4c54-a58d-425efb5e5501', '07-CAL-09', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'CAMBIO DE RACORES RADIADOR', 'Sustitución de piezas de conexión del radiador.', NULL, 'Ud', 32.40, 32.40, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 64.80, 64.80, NULL, NULL, NULL, 0.15),
('fa491fd9-e049-47e5-95ea-5a693fbcb84f', '07-CAL-10', '5090928c-9b72-4d83-8667-9d01ddbfca47', 'INSTALACIÓN TERMO FLECK DUO 80L', 'Instalación y conexionado de termo eléctrico.', NULL, 'Ud', 138.96, 138.96, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 277.92, 277.92, NULL, NULL, NULL, 0.15);

SELECT COUNT(*) as total_calefaccion FROM price_master WHERE code LIKE '07-CAL-%';

COMMIT;
