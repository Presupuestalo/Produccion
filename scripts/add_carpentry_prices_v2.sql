-- Añadir nuevos precios de carpintería a la base de datos
-- Códigos: 04-C-17 (Forro puerta entrada) y 04-C-18 (Puerta corredera exterior con carril)

INSERT INTO price_master (
  id, 
  code, 
  category_id, 
  subcategory, 
  description, 
  unit, 
  labor_cost, 
  material_cost, 
  equipment_cost, 
  other_cost, 
  is_custom, 
  user_id
) VALUES
-- 04-C-17: Forro de puerta de entrada
(
  gen_random_uuid(),
  '04-C-17',
  (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'),
  'FORRO PUERTA DE ENTRADA (MO)',
  'Instalación de forro de marco para puerta de entrada.',
  'Ud',
  144.00,
  0.00,
  0.00,
  0.00,
  false,
  NULL::uuid
),
-- 04-C-18: Puerta corredera exterior con carril
(
  gen_random_uuid(),
  '04-C-18',
  (SELECT id FROM price_categories WHERE name = 'CARPINTERIA'),
  'PUERTA CORREDERA EXTERIOR CON CARRIL (MO)',
  'Instalación de puerta corredera exterior con sistema de carril visto.',
  'Ud',
  165.60,
  0.00,
  0.00,
  0.00,
  false,
  NULL::uuid
);
