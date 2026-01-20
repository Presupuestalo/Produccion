-- Añadir material de suelo laminado a la base de datos
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
) VALUES (
  gen_random_uuid(),
  '08-M-24',
  (SELECT id FROM price_categories WHERE name = 'MATERIALES'),
  'SUELO LAMINADO',
  'Coste del metro cuadrado de suelo laminado tipo click.',
  'm²',
  5.00,
  20.00,
  0,
  0,
  false,
  NULL::uuid
);
