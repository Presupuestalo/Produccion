-- Restauración de precios de PINTURA desde backup del 20/11/2025

BEGIN;

DELETE FROM price_master WHERE code LIKE '09-P-%';

INSERT INTO price_master (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes, created_at, updated_at, created_by, updated_by, base_price, final_price, color, brand, model, profit_margin) VALUES
('d0bfadb8-ef34-4590-9569-3d6df310f32e', '09-P-01', '0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'PINTURA DE PAREDES', 'Pintura plástica lisa en paredes, incluyendo mano de obra y materiales.', NULL, 'm²', 7.07, 3.03, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-13 23:06:53.853635+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 10.10, 10.10, NULL, NULL, NULL, 0.15),
('666cbb04-71bf-4b6c-96d8-10b180a22127', '09-P-02', '0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'PINTURA DE TECHOS', 'Pintura plástica lisa en techos, incluyendo mano de obra y materiales.', NULL, 'm²', 7.11, 3.05, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-13 23:06:53.853635+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 10.15, 10.15, NULL, NULL, NULL, 0.15),
('111b6fa4-5dd2-440d-9fea-120c4e9456ad', '09-P-03', '0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'LACADO DE PUERTA DE ENTRADA', 'Lacado de puerta de entrada, incluyendo lijado, imprimación y dos manos de esmalte.', NULL, 'Ud', 175.00, 75.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-13 23:06:53.853635+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 250.00, 250.00, NULL, NULL, NULL, 0.15),
('cbfbca64-0b45-4f02-92ec-0c1376727941', '09-P-04', '0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'LACADO DE ARMARIOS', 'Lacado de armarios empotrados, incluyendo puertas, frentes y estructura visible.', NULL, 'm²', 42.00, 18.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-13 23:06:53.853635+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 60.00, 60.00, NULL, NULL, NULL, 0.15),
('b3720a3f-4650-44f1-a9ba-af7cfe01bf12', '09-P-05', '0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'LACADO DE PUERTAS INTERIORES', 'Lacado de puertas interiores, incluyendo lijado, imprimación y dos manos de esmalte.', NULL, 'Ud', 63.00, 27.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-13 23:06:53.853635+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 90.00, 90.00, NULL, NULL, NULL, 0.15);

SELECT COUNT(*) as total_pintura FROM price_master WHERE code LIKE '09-P-%';

COMMIT;
