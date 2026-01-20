-- Añadir categoría TABIQUERÍA a la tabla de precios
-- Esta categoría aparecerá después de ALBAÑILERÍA en los presupuestos

-- Corregido para usar la tabla price_master en lugar de prices
-- Insertar o actualizar los códigos de tabiquería
INSERT INTO price_master (id, code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
VALUES 
  (gen_random_uuid(), '02-T-01', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUERÍA', 'Colocación de una capa de placa de yeso laminado de 13mm sobre perfilería.', 'm²', 35.42, 23.62, 0, 0, false, NULL),
  (gen_random_uuid(), '02-T-02', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUERÍA', 'Levantamiento de tabique de ladrillo de pequeño formato (rasilla o hueco doble).', 'm²', 21.60, 14.40, 0, 0, false, NULL),
  (gen_random_uuid(), '02-T-03', (SELECT id FROM price_categories WHERE name = 'ALBANILERIA'), 'TABIQUERÍA', 'Levantamiento de tabique con doble placa de yeso laminado de 13mm en ambas caras y aislamiento interior.', 'm²', 40.18, 26.78, 0, 0, false, NULL)
ON CONFLICT (code) DO UPDATE SET
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  labor_cost = EXCLUDED.labor_cost,
  material_cost = EXCLUDED.material_cost,
  equipment_cost = EXCLUDED.equipment_cost,
  other_cost = EXCLUDED.other_cost;
