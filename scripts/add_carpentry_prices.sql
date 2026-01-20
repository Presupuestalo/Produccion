-- Añadir precios de carpintería faltantes para todos los países

-- España
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
VALUES 
  ('04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 'Instalación de forro de marco para puerta de entrada.', 'Ud', 144.00, 0.00, 0.00, 0.00, false, NULL),
  ('04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 'Instalación de puerta corredera exterior con sistema de carril visto.', 'Ud', 288.00, 0.00, 0.00, 0.00, false, NULL)
ON CONFLICT (code) DO UPDATE SET
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  labor_cost = EXCLUDED.labor_cost;

-- Perú (ajustando precios para el mercado peruano)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
VALUES 
  ('04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 'Instalación de forro de marco para puerta de entrada.', 'Ud', 120.00, 0.00, 0.00, 0.00, false, NULL),
  ('04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 'Instalación de puerta corredera exterior con sistema de carril visto.', 'Ud', 240.00, 0.00, 0.00, 0.00, false, NULL)
ON CONFLICT (code) DO UPDATE SET
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  labor_cost = EXCLUDED.labor_cost;

-- Bolivia (ajustando precios para el mercado boliviano)
INSERT INTO price_master (code, category_id, subcategory, description, unit, labor_cost, material_cost, equipment_cost, other_cost, is_custom, user_id)
VALUES 
  ('04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 'Instalación de forro de marco para puerta de entrada.', 'Ud', 110.00, 0.00, 0.00, 0.00, false, NULL),
  ('04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 'Instalación de puerta corredera exterior con sistema de carril visto.', 'Ud', 220.00, 0.00, 0.00, 0.00, false, NULL)
ON CONFLICT (code) DO UPDATE SET
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  labor_cost = EXCLUDED.labor_cost;
