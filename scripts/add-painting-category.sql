-- Script para añadir la categoría PINTURA y sus partidas al price_master

-- Paso 1: Insertar la categoría PINTURA
INSERT INTO price_categories (id, name, description, icon, display_order, is_active) VALUES
(gen_random_uuid(), 'PINTURA', 'Trabajos de pintura y acabados', 'Paintbrush', 9, true);

-- Paso 2: Insertar las partidas de pintura y lacado (70% labor, 30% material)
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id) VALUES
(gen_random_uuid(), '09-P-01', (SELECT id FROM price_categories WHERE name = 'PINTURA'), 'PINTURA DE PAREDES', 'Pintura plástica lisa en paredes, incluyendo mano de obra y materiales.', 'm²', 7.00, 3.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '09-P-02', (SELECT id FROM price_categories WHERE name = 'PINTURA'), 'PINTURA DE TECHOS', 'Pintura plástica lisa en techos, incluyendo mano de obra y materiales.', 'm²', 7.70, 3.30, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '09-P-03', (SELECT id FROM price_categories WHERE name = 'PINTURA'), 'LACADO DE PUERTA DE ENTRADA', 'Lacado de puerta de entrada, incluyendo lijado, imprimación y dos manos de esmalte.', 'Ud', 140.00, 60.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '09-P-04', (SELECT id FROM price_categories WHERE name = 'PINTURA'), 'LACADO DE ARMARIOS', 'Lacado de armarios empotrados, incluyendo puertas, frentes y estructura visible.', 'm²', 35.00, 15.00, 0, 0, false, NULL::uuid),
(gen_random_uuid(), '09-P-05', (SELECT id FROM price_categories WHERE name = 'PINTURA'), 'LACADO DE PUERTAS INTERIORES', 'Lacado de puertas interiores, incluyendo lijado, imprimación y dos manos de esmalte.', 'Ud', 70.00, 30.00, 0, 0, false, NULL::uuid);
