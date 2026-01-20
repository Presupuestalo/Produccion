-- Restauración de precios de LIMPIEZA desde backup del 20/11/2025

BEGIN;

DELETE FROM price_master WHERE code LIKE '08-L-%';

INSERT INTO price_master (id, code, category_id, subcategory, description, long_description, unit, labor_cost, material_cost, equipment_cost, other_cost, margin_percentage, is_active, is_custom, user_id, notes, created_at, updated_at, created_by, updated_by, base_price, final_price, color, brand, model, profit_margin) VALUES
('2a7ac1e4-7040-4e90-aac7-6e737ee5b51a', '08-L-01', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZAS PERIÓDICAS DE OBRA', 'Mano de obra por la limpieza diaria/semanal de la obra.', NULL, 'Ud', 100.80, 0.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 100.80, 100.80, NULL, NULL, NULL, 0.15),
('d051a18f-1baf-447b-85db-bbf36f948fb3', '08-L-02', '0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA FINAL DE OBRA', 'Limpieza exhaustiva de fin de obra y retirada de restos menores.', NULL, 'Ud', 175.00, 75.00, 0.00, 0.00, 0.00, true, false, NULL, NULL, '2025-10-09 18:44:21.635185+00', '2025-11-14 18:36:51.543027+00', NULL, NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15);

SELECT COUNT(*) as total_limpieza FROM price_master WHERE code LIKE '08-L-%';

COMMIT;
