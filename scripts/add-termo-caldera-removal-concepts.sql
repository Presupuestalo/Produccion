-- Script para agregar conceptos de retirada de termo eléctrico y caldera
-- Estos conceptos se agregan a price_master (España) y todas las tablas de países

-- 01-D-17: Retirada de termo eléctrico
-- 01-D-18: Retirada de caldera

-- Agregando UUID para evitar error de constraint NOT NULL en id

-- PRICE_MASTER (España)
INSERT INTO price_master (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  profit_margin,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  45.00,
  45.00,
  15.00,
  51.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  65.00,
  65.00,
  15.00,
  74.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  profit_margin = EXCLUDED.profit_margin,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_bolivia (Bolivia - BOB)
INSERT INTO price_master_bolivia (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  310.00,
  310.00,
  15.00,
  356.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  448.00,
  448.00,
  15.00,
  515.20,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_argentina (Argentina - ARS)
INSERT INTO price_master_argentina (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  45000.00,
  45000.00,
  15.00,
  51750.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  65000.00,
  65000.00,
  15.00,
  74750.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_chile (Chile - CLP)
INSERT INTO price_master_chile (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  profit_margin,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  38000.00,
  38000.00,
  15.00,
  43700.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  55000.00,
  55000.00,
  15.00,
  63250.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  profit_margin = EXCLUDED.profit_margin,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_peru (Perú - PEN)
INSERT INTO price_master_peru (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  150.00,
  150.00,
  15.00,
  172.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  217.00,
  217.00,
  15.00,
  249.55,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_mexico (México - MXN)
INSERT INTO price_master_mexico (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  850.00,
  850.00,
  15.00,
  977.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  1230.00,
  1230.00,
  15.00,
  1414.50,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_colombia (Colombia - COP)
INSERT INTO price_master_colombia (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  180000.00,
  180000.00,
  15.00,
  207000.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  260000.00,
  260000.00,
  15.00,
  299000.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_ecuador (Ecuador - USD)
INSERT INTO price_master_ecuador (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  45.00,
  45.00,
  15.00,
  51.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  65.00,
  65.00,
  15.00,
  74.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_venezuela (Venezuela - VES)
INSERT INTO price_master_venezuela (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  1600.00,
  1600.00,
  15.00,
  1840.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  2300.00,
  2300.00,
  15.00,
  2645.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_guatemala (Guatemala - GTQ)
INSERT INTO price_master_guatemala (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  350.00,
  350.00,
  15.00,
  402.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  506.00,
  506.00,
  15.00,
  581.90,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_cuba (Cuba - CUP)
INSERT INTO price_master_cuba (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  1125.00,
  1125.00,
  15.00,
  1293.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  1625.00,
  1625.00,
  15.00,
  1868.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_dominicana (República Dominicana - DOP)
INSERT INTO price_master_dominicana (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  2700.00,
  2700.00,
  15.00,
  3105.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  3900.00,
  3900.00,
  15.00,
  4485.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_honduras (Honduras - HNL)
INSERT INTO price_master_honduras (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  1125.00,
  1125.00,
  15.00,
  1293.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  1625.00,
  1625.00,
  15.00,
  1868.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_paraguay (Paraguay - PYG)
INSERT INTO price_master_paraguay (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  330000.00,
  330000.00,
  15.00,
  379500.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  477000.00,
  477000.00,
  15.00,
  548550.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_nicaragua (Nicaragua - NIO)
INSERT INTO price_master_nicaragua (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  1650.00,
  1650.00,
  15.00,
  1897.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  2385.00,
  2385.00,
  15.00,
  2742.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_salvador (El Salvador - USD)
INSERT INTO price_master_salvador (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  45.00,
  45.00,
  15.00,
  51.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  65.00,
  65.00,
  15.00,
  74.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_costarica (Costa Rica - CRC)
INSERT INTO price_master_costarica (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  23000.00,
  23000.00,
  15.00,
  26450.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  33250.00,
  33250.00,
  15.00,
  38237.50,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_panama (Panamá - PAB)
INSERT INTO price_master_panama (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  45.00,
  45.00,
  15.00,
  51.75,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  65.00,
  65.00,
  15.00,
  74.75,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_uruguay (Uruguay - UYU)
INSERT INTO price_master_uruguay (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  1750.00,
  1750.00,
  15.00,
  2012.50,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  2530.00,
  2530.00,
  15.00,
  2909.50,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_guinea (Guinea Ecuatorial - XAF)
INSERT INTO price_master_guinea (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  27000.00,
  27000.00,
  15.00,
  31050.00,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  39000.00,
  39000.00,
  15.00,
  44850.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Agregando conceptos a price_master_usa (Estados Unidos - USD)
INSERT INTO price_master_usa (
  id,
  code,
  category_id,
  subcategory,
  description,
  unit,
  material_cost,
  labor_cost,
  base_price,
  margin_percentage,
  final_price,
  is_custom,
  is_active
)
VALUES (
  gen_random_uuid()::text,
  '01-D-17',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR TERMO ELÉCTRICO',
  'Ud',
  0.00,
  55.00,
  55.00,
  15.00,
  63.25,
  false,
  true
),
(
  gen_random_uuid()::text,
  '01-D-18',
  (SELECT id FROM price_categories WHERE name = 'DERRIBOS'),
  'Demoliciones',
  'RETIRAR CALDERA',
  'Ud',
  0.00,
  80.00,
  80.00,
  15.00,
  92.00,
  false,
  true
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  material_cost = EXCLUDED.material_cost,
  labor_cost = EXCLUDED.labor_cost,
  base_price = EXCLUDED.base_price,
  margin_percentage = EXCLUDED.margin_percentage,
  final_price = EXCLUDED.final_price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verificar que los conceptos se agregaron correctamente en todos los países
SELECT 'España' as pais, code, description, final_price 
FROM price_master 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Bolivia' as pais, code, description, final_price 
FROM price_master_bolivia 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Argentina' as pais, code, description, final_price 
FROM price_master_argentina 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Chile' as pais, code, description, final_price 
FROM price_master_chile 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Perú' as pais, code, description, final_price 
FROM price_master_peru 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'México' as pais, code, description, final_price 
FROM price_master_mexico 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Colombia' as pais, code, description, final_price 
FROM price_master_colombia 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Ecuador' as pais, code, description, final_price 
FROM price_master_ecuador 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Venezuela' as pais, code, description, final_price 
FROM price_master_venezuela 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Guatemala' as pais, code, description, final_price 
FROM price_master_guatemala 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Cuba' as pais, code, description, final_price 
FROM price_master_cuba 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Rep. Dominicana' as pais, code, description, final_price 
FROM price_master_dominicana 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Honduras' as pais, code, description, final_price 
FROM price_master_honduras 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Paraguay' as pais, code, description, final_price 
FROM price_master_paraguay 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Nicaragua' as pais, code, description, final_price 
FROM price_master_nicaragua 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'El Salvador' as pais, code, description, final_price 
FROM price_master_salvador 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Costa Rica' as pais, code, description, final_price 
FROM price_master_costarica 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Panamá' as pais, code, description, final_price 
FROM price_master_panama 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Uruguay' as pais, code, description, final_price 
FROM price_master_uruguay 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'Guinea Ecuatorial' as pais, code, description, final_price 
FROM price_master_guinea 
WHERE code IN ('01-D-18', '01-D-17')
UNION ALL
SELECT 'USA' as pais, code, description, final_price 
FROM price_master_usa 
WHERE code IN ('01-D-18', '01-D-17')
ORDER BY pais, code;
