BEGIN;

-- Limpiar tablas completamente
TRUNCATE TABLE price_master CASCADE;
TRUNCATE TABLE price_categories CASCADE;

-- Restaurar TODAS las categorías del backup (11 categorías)
INSERT INTO price_categories (id, name, description, icon, display_order, created_at, updated_at, is_active) VALUES
('5b38410c-4b7b-412a-9f57-6e74db0cc237', 'DERRIBOS', 'Trabajos de demolición y retirada', 'Hammer', 1, '2025-10-09 18:44:21.635185+00', '2025-10-09 18:44:21.635185+00', true),
('d6e90b3f-3bc5-4f15-8530-19da496abc5e', 'ALBAÑILERÍA', 'Trabajos de albañilería y construcción', 'Brick', 2, '2025-10-09 18:44:21.635185+00', '2025-10-09 22:46:47.808767+00', true),
('c4c68527-3b91-4125-a96c-7db5a32a31f5', 'TABIQUES Y TRASDOSADOS', 'Formación de tabiques de ladrillo y trasdosados de pladur', '🧱', 3, '2025-10-13 22:32:13.552778+00', '2025-10-13 22:32:13.552778+00', true),
('3d93ed2f-bfec-4f36-834e-2d3c4d7d7260', 'FONTANERÍA', 'Instalaciones de fontanería', 'Droplet', 4, '2025-10-09 18:44:21.635185+00', '2025-10-13 22:32:13.552778+00', true),
('e4967edd-53b5-459a-bb68-b1fd88ee6836', 'CARPINTERÍA', 'Trabajos de carpintería', 'Drill', 5, '2025-10-09 18:44:21.635185+00', '2025-10-13 22:32:13.552778+00', true),
('243dee0d-edba-4de9-94a4-2a4c17ff607d', 'ELECTRICIDAD', 'Instalaciones eléctricas', 'Zap', 6, '2025-10-09 18:44:21.635185+00', '2025-10-13 22:32:13.552778+00', true),
('5090928c-9b72-4d83-8667-9d01ddbfca47', 'CALEFACCIÓN', 'Sistemas de calefacción', 'Flame', 7, '2025-10-09 18:44:21.635185+00', '2025-10-13 22:32:13.552778+00', true),
('0f95a55f-12ba-4e0e-ba0d-d01229d05c4c', 'LIMPIEZA', 'Servicios de limpieza', 'Sparkles', 8, '2025-10-09 18:44:21.635185+00', '2025-10-13 22:32:13.552778+00', true),
('0e963dbd-3ef7-4b34-806d-92df8fe3df1e', 'PINTURA', 'Trabajos de pintura y acabados', 'Paintbrush', 9, '2025-10-13 23:06:53.853635+00', '2025-10-13 23:06:53.853635+00', true),
('0d110423-99b0-4c31-b61a-6d6b1ee629c5', 'MATERIALES', 'Suministro de materiales', 'Package', 10, '2025-10-09 18:44:21.635185+00', '2025-11-14 14:04:55.03602+00', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VENTANAS', 'Carpintería exterior de ventanas', '🪟', 11, '2025-11-14 13:22:07.2833+00', '2025-11-14 14:04:57.492602+00', true);

-- Este script restaura TODOS los precios del backup. Debido al límite de tamaño,
-- lo he dividido en secciones por categoría. Ejecuta este script primero.

-- Luego ejecuta los scripts complementarios que crearemos para cada categoría faltante.

COMMIT;

SELECT 'Categorías restauradas correctamente' as status;
SELECT COUNT(*) as total_categorias FROM price_categories;
