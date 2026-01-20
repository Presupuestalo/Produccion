-- Añadir nuevos códigos de carpintería a la base de datos
-- Códigos: 04-C-17, 04-C-18, 04-C-19

-- España
INSERT INTO price_master (
  id, code, category_id, subcategory, description, notes, unit,
  labor_cost, material_cost, equipment_cost, other_cost, total_cost,
  is_active, is_custom, user_id, project_id,
  created_at, updated_at, country_code, region_code,
  markup_percentage, tax_rate, custom_fields, tags, version, profit_margin
) VALUES
-- 04-C-17: Forro puerta de entrada
(gen_random_uuid(), '04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 
 'Instalación de forro de marco para puerta de entrada.', NULL, 'Ud',
 144.00, 0.00, 0.00, 0.00, 144.00, true, false, NULL, NULL,
 NOW(), NOW(), 'ES', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-18: Puerta corredera exterior con carril
(gen_random_uuid(), '04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 
 'Instalación de puerta corredera exterior con sistema de carril visto.', NULL, 'Ud',
 288.00, 0.00, 0.00, 0.00, 288.00, true, false, NULL, NULL,
 NOW(), NOW(), 'ES', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-19: Instalación suelo laminado
(gen_random_uuid(), '04-C-19', 4, 'INSTALACIÓN SUELO LAMINADO (MO)', 
 'Mano de obra de colocación de suelo laminado tipo click.', NULL, 'm²',
 18.50, 0.00, 0.00, 0.00, 18.50, true, false, NULL, NULL,
 NOW(), NOW(), 'ES', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15);

-- Perú (ajustando precios a moneda local)
INSERT INTO price_master (
  id, code, category_id, subcategory, description, notes, unit,
  labor_cost, material_cost, equipment_cost, other_cost, total_cost,
  is_active, is_custom, user_id, project_id,
  created_at, updated_at, country_code, region_code,
  markup_percentage, tax_rate, custom_fields, tags, version, profit_margin
) VALUES
-- 04-C-17: Forro puerta de entrada (Perú)
(gen_random_uuid(), '04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 
 'Instalación de forro de marco para puerta de entrada.', NULL, 'Ud',
 540.00, 0.00, 0.00, 0.00, 540.00, true, false, NULL, NULL,
 NOW(), NOW(), 'PE', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-18: Puerta corredera exterior con carril (Perú)
(gen_random_uuid(), '04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 
 'Instalación de puerta corredera exterior con sistema de carril visto.', NULL, 'Ud',
 1080.00, 0.00, 0.00, 0.00, 1080.00, true, false, NULL, NULL,
 NOW(), NOW(), 'PE', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-19: Instalación suelo laminado (Perú)
(gen_random_uuid(), '04-C-19', 4, 'INSTALACIÓN SUELO LAMINADO (MO)', 
 'Mano de obra de colocación de suelo laminado tipo click.', NULL, 'm²',
 69.38, 0.00, 0.00, 0.00, 69.38, true, false, NULL, NULL,
 NOW(), NOW(), 'PE', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15);

-- Bolivia (ajustando precios a moneda local)
INSERT INTO price_master (
  id, code, category_id, subcategory, description, notes, unit,
  labor_cost, material_cost, equipment_cost, other_cost, total_cost,
  is_active, is_custom, user_id, project_id,
  created_at, updated_at, country_code, region_code,
  markup_percentage, tax_rate, custom_fields, tags, version, profit_margin
) VALUES
-- 04-C-17: Forro puerta de entrada (Bolivia)
(gen_random_uuid(), '04-C-17', 4, 'FORRO PUERTA DE ENTRADA (MO)', 
 'Instalación de forro de marco para puerta de entrada.', NULL, 'Ud',
 990.00, 0.00, 0.00, 0.00, 990.00, true, false, NULL, NULL,
 NOW(), NOW(), 'BO', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-18: Puerta corredera exterior con carril (Bolivia)
(gen_random_uuid(), '04-C-18', 4, 'COLOCACIÓN PUERTA CORREDERA EXTERIOR CON CARRIL (MO)', 
 'Instalación de puerta corredera exterior con sistema de carril visto.', NULL, 'Ud',
 1980.00, 0.00, 0.00, 0.00, 1980.00, true, false, NULL, NULL,
 NOW(), NOW(), 'BO', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15),

-- 04-C-19: Instalación suelo laminado (Bolivia)
(gen_random_uuid(), '04-C-19', 4, 'INSTALACIÓN SUELO LAMINADO (MO)', 
 'Mano de obra de colocación de suelo laminado tipo click.', NULL, 'm²',
 127.13, 0.00, 0.00, 0.00, 127.13, true, false, NULL, NULL,
 NOW(), NOW(), 'BO', NULL, 0.00, 0.00, NULL, NULL, NULL, 0.15);
